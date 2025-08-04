'use server'

import { eq } from 'drizzle-orm'

import { envPublic } from '@/config/env.public'
import { envServer } from '@/config/env.server'
import { getCurrentUserAction } from '@/lib/actions/user'
import { db } from '@/lib/db/drizzle'
import { attachments, messages } from '@/lib/db/schema'
import { processUploadedFile, getUploadUrl } from '@/lib/utils/upload'

export async function uploadAttachmentsAction(
  messageId: number,
  formData: FormData
) {
  const user = await getCurrentUserAction()
  if (!user) throw new Error('Unauthorized')

  const files = formData.getAll('files') as File[]
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  const message = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1)

  if (!message[0] || message[0].senderId !== user.id) {
    throw new Error('Unauthorized')
  }

  const uploadedFiles: Array<{
    id: number
    filename: string
    mimeType: string
    size: number
    url: string
    name: string
    type: string
  }> = []

  for (const file of files) {
    const processedFile = await processUploadedFile(file, {
      uploadType: 'attachments'
    })

    const [attachment] = await db
      .insert(attachments)
      .values({
        messageId: messageId,
        userId: user.id,
        filename: processedFile.originalName,
        mimeType: processedFile.mimeType,
        path: processedFile.relativePath,
        size: processedFile.size
      })
      .returning()

    uploadedFiles.push({
      id: attachment.id,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: getUploadUrl(processedFile.relativePath),
      name: attachment.filename,
      type: attachment.mimeType
    })
  }

  await db
    .update(messages)
    .set({
      metadata: { attachments: uploadedFiles },
      messageType: 'mixed'
    })
    .where(eq(messages.id, messageId))

  // Send real-time update via Pusher
  const updatedMessage = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1)

  if (updatedMessage[0]) {
    const pusher =
      envServer.PUSHER_APP_ID &&
      envPublic.NEXT_PUBLIC_PUSHER_KEY &&
      envServer.PUSHER_SECRET &&
      envPublic.NEXT_PUBLIC_PUSHER_CLUSTER
        ? new (await import('pusher')).default({
            appId: envServer.PUSHER_APP_ID,
            key: envPublic.NEXT_PUBLIC_PUSHER_KEY,
            secret: envServer.PUSHER_SECRET,
            cluster: envPublic.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true
          })
        : null

    if (pusher) {
      await pusher.trigger(
        `chat-${updatedMessage[0].contextType}-${updatedMessage[0].contextId}`,
        'message-edited',
        {
          ...updatedMessage[0],
          sender: {
            id: user.id,
            name: user.name,
            walletAddress: user.walletAddress,
            email: user.email
          }
        }
      )
    }
  }

  return uploadedFiles
}
