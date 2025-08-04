import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { sendMessageAction } from '@/lib/actions/chat'
import { getCurrentUserAction } from '@/lib/actions/user'
import { db } from '@/lib/db/drizzle'
import { trades, users } from '@/lib/db/schema'
import { processUploadedFile, getUploadUrl } from '@/lib/utils/upload'
import type { TradeMetadata } from '@/types/trade'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tradeId } = await params
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No payment proof images provided' },
        { status: 400 }
      )
    }

    // Get the trade and verify user is the buyer
    const [trade] = await db
      .select({
        trade: trades,
        buyer: users,
        seller: users
      })
      .from(trades)
      .innerJoin(users, eq(trades.buyerId, users.id))
      .where(eq(trades.id, parseInt(tradeId)))
      .limit(1)

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    if (trade.trade.buyerId !== user.id) {
      return NextResponse.json(
        { error: 'Only buyer can upload payment proof' },
        { status: 403 }
      )
    }

    // Check trade status - must be funded
    if (trade.trade.status !== 'funded') {
      return NextResponse.json(
        { error: 'Trade must be funded before uploading payment proof' },
        { status: 400 }
      )
    }

    // Process uploaded images
    const uploadedImages: string[] = []
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        )
      }

      // Validate file type
      const fileType = file.type.toLowerCase()
      if (!allowedTypes.includes(fileType)) {
        return NextResponse.json(
          {
            error: `File ${file.name} must be an image (JPEG, PNG, GIF, or WebP)`
          },
          { status: 400 }
        )
      }

      const processedFile = await processUploadedFile(file, {
        uploadType: 'payment-proofs',
        subPath: `trade-${tradeId}`
      })

      uploadedImages.push(getUploadUrl(processedFile.relativePath))
    }

    // Update trade metadata with payment proof images
    const currentMetadata = (trade.trade.metadata as TradeMetadata) || {}
    const updatedMetadata: TradeMetadata = {
      ...currentMetadata,
      paymentProofImages: [
        ...(currentMetadata.paymentProofImages || []),
        ...uploadedImages
      ],
      paymentProofUploadedAt: new Date().toISOString()
    }

    // Update trade with new metadata
    await db
      .update(trades)
      .set({
        metadata: updatedMetadata,
        paymentSentAt: new Date()
      })
      .where(eq(trades.id, parseInt(tradeId)))

    // Send automatic message to trade chat with the payment proof
    const messageContent = `Payment proof uploaded by buyer. ${files.length} screenshot(s) attached.`
    const attachments = uploadedImages.map((url, index) => ({
      name: `payment-proof-${index + 1}.jpg`,
      url,
      type: 'image/jpeg' as const,
      size: files[index].size
    }))

    try {
      await sendMessageAction(
        'trade' as any,
        `trade_${tradeId}`,
        messageContent,
        attachments
      )
    } catch (error) {
      console.error('Failed to send automatic message:', error)
      // Don't fail the upload if message sending fails
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      message: 'Payment proof uploaded successfully'
    })
  } catch (error) {
    console.error('Payment proof upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload payment proof' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tradeId } = await params

    // Get the trade
    const [trade] = await db
      .select()
      .from(trades)
      .where(eq(trades.id, parseInt(tradeId)))
      .limit(1)

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Check if user is buyer or seller
    if (trade.buyerId !== user.id && trade.sellerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not part of this trade' },
        { status: 403 }
      )
    }

    const metadata = (trade.metadata as TradeMetadata) || {}
    const paymentProofImages = metadata.paymentProofImages || []

    return NextResponse.json({
      success: true,
      images: paymentProofImages,
      uploadedAt: metadata.paymentProofUploadedAt
    })
  } catch (error) {
    console.error('Get payment proof error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment proof' },
      { status: 500 }
    )
  }
}
