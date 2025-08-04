import { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'
import requestIp from 'request-ip'
import { verifyMessage } from 'viem'

import { truncateAddress } from '@/lib'
import { apiResponses } from '@/lib/api/server-utils'
import { setSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { findUserByWalletAddress, createUser } from '@/lib/db/queries/users'
import { teams, teamMembers, ActivityType, activityLogs } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  try {
    const { message, signature, address, socialEmail, socialName } =
      await request.json()

    if (!message || !signature || !address) {
      return apiResponses.validationError(
        ['message', 'signature', 'address'].filter(field => {
          return !{ message, signature, address }[field]
        })
      )
    }

    // Get IP address
    const ipAddress = requestIp.getClientIp(request as any) || 'unknown'

    // Verify the signature
    let isValid = false
    try {
      isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`
      })
    } catch (_) {
      return apiResponses.unauthorized('Invalid signature')
    }

    if (!isValid) {
      return apiResponses.unauthorized('Invalid signature')
    }

    // Check if user exists using centralized function
    let user
    try {
      user = await findUserByWalletAddress(address)
    } catch (_) {
      throw new Error('Database connection failed')
    }

    if (!user) {
      // Create new user and team in a transaction
      try {
        user = await db.transaction(async tx => {
          // Create new user using centralized function
          const newUser = await createUser(
            {
              walletAddress: address,
              email: socialEmail || undefined,
              name: socialName || undefined,
              role: 'user',
              // Auto-verify email if it comes from social login
              emailVerified: socialEmail ? true : false
            },
            tx
          )

          // Create default team for the user
          const normalizedAddr = newUser.walletAddress
          const [newTeam] = await tx
            .insert(teams)
            .values({
              name: `${truncateAddress(normalizedAddr)}'s Team`,
              planId: 'free'
            })
            .returning()

          // Add user to team as owner
          await tx.insert(teamMembers).values({
            userId: newUser.id,
            teamId: newTeam.id,
            role: 'owner'
          })

          // Log wallet connection activity with IP address
          await tx.insert(activityLogs).values({
            teamId: newTeam.id,
            userId: newUser.id,
            action: ActivityType.WALLET_CONNECTED,
            ipAddress
          })

          return newUser
        })
      } catch (error) {
        // If creation fails due to duplicate email, return a user-friendly error
        if (
          error instanceof Error &&
          error.message.includes('users_email_unique')
        ) {
          return apiResponses.badRequest(
            'This email has already been used by another user with a different wallet address. Please disconnect your wallet and use another email instead.'
          )
        }
        throw error
      }
    } else {
      // Update email and/or name if user doesn't have them and social login provides them
      const updates: {
        email?: string
        name?: string
        emailVerified?: boolean
      } = {}
      if (!user.email && socialEmail) {
        updates.email = socialEmail
        // Auto-verify email if it comes from social login
        updates.emailVerified = true
      }
      if (!user.name && socialName) {
        updates.name = socialName
      }

      if (Object.keys(updates).length > 0) {
        try {
          const { updateUser } = await import('@/lib/db/queries/users')
          const updatedUser = await updateUser(user.id, updates)
          if (updatedUser) {
            if (updates.email) user.email = updates.email
            if (updates.name) user.name = updates.name
            if (updates.emailVerified)
              user.emailVerified = updates.emailVerified
          }
        } catch (error) {
          // If update fails (e.g., email already taken), return a user-friendly error
          if (
            error instanceof Error &&
            error.message.includes('users_email_unique')
          ) {
            return apiResponses.badRequest(
              'This email has already been used by another user with a different wallet address. Please disconnect your wallet and use another email instead.'
            )
          }
          console.error('Failed to update user info from social login:', error)
        }
      }

      // Log activity for existing user
      const userTeam = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.id))
        .limit(1)

      if (userTeam.length) {
        await db.insert(activityLogs).values({
          teamId: userTeam[0].teamId,
          userId: user.id,
          action: ActivityType.SIGN_IN,
          ipAddress
        })
      }
    }

    // Set session
    try {
      await setSession(user)
    } catch (_) {
      throw new Error('Failed to create session')
    }

    return apiResponses.success({ success: true, user })
  } catch (error) {
    return apiResponses.handleError(error, 'Authentication failed')
  }
}

function generateSecureNonce(): string {
  // Generate a secure nonce that meets SIWE requirements:
  // - At least 8 characters
  // - Only alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let nonce = ''

  // Generate 12 characters to be safe (more than minimum 8)
  for (let i = 0; i < 12; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return nonce
}

export async function GET(_request: NextRequest) {
  // Generate nonce for signing
  const nonce = generateSecureNonce()

  return apiResponses.success({ nonce })
}
