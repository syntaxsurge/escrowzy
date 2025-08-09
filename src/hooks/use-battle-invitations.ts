'use client'

import { useCallback, useEffect, useState } from 'react'

import useSWR from 'swr'

import { api } from '@/lib/api/http-client'
import type { BattleInvitation } from '@/lib/db/schema'
import { pusherClient } from '@/lib/pusher'

interface InvitationWithUser extends BattleInvitation {
  fromUser: {
    id: number
    name: string
    email?: string | null
    walletAddress: string
  }
}

export function useBattleInvitations(userId?: number) {
  // Removed toast - all notifications handled in UI
  const [pendingInvitations, setPendingInvitations] = useState<
    InvitationWithUser[]
  >([])

  // Fetch invitations
  const { data, error, mutate } = useSWR<{ data: InvitationWithUser[] }>(
    userId ? '/api/battles/invitations' : null,
    (url: string) => api.get(url).then(res => res.data),
    { refreshInterval: 5000 } // Check every 5 seconds
  )

  // Accept invitation
  const acceptInvitation = useCallback(
    async (invitationId: number) => {
      try {
        const response = await api.post('/api/battles/accept', { invitationId })

        if (response.data.success) {
          // No toast - UI handles battle starting state

          // Remove from pending list
          setPendingInvitations(prev =>
            prev.filter(inv => inv.id !== invitationId)
          )

          mutate()
          return response.data.data
        }
      } catch (error: any) {
        // Don't show any toasts - let the UI handle all errors
        return null
      }
    },
    [mutate]
  )

  // Reject invitation
  const rejectInvitation = useCallback(
    async (invitationId: number) => {
      try {
        const response = await api.post('/api/battles/reject', { invitationId })

        if (response.data.success) {
          // Remove from pending list
          setPendingInvitations(prev =>
            prev.filter(inv => inv.id !== invitationId)
          )

          mutate()
          return true
        }
      } catch (error: any) {
        // Don't show any toasts - let the UI handle all errors
        return false
      }
    },
    [mutate]
  )

  // Send invitation
  const sendInvitation = useCallback(async (toUserId: number) => {
    try {
      const response = await api.post('/api/battles/invite', { toUserId })

      if (response.data.success) {
        // No toast - UI handles invitation sent state
        return response.data.data
      }
    } catch (error: any) {
      // Don't show any toasts - let the UI handle all errors
      return null
    }
  }, [])

  // Setup Pusher for real-time updates
  useEffect(() => {
    if (!userId || !pusherClient) return

    const channel = pusherClient.subscribe(`user-${userId}`)

    channel.bind('battle-invitation', (invitation: InvitationWithUser) => {
      // Use improved display name
      const displayName =
        invitation.fromUser?.name ||
        invitation.fromUser?.email ||
        (invitation.fromUser?.walletAddress
          ? `${invitation.fromUser.walletAddress.slice(0, 6)}...${invitation.fromUser.walletAddress.slice(-4)}`
          : 'Anonymous Warrior')

      setPendingInvitations(prev => [
        ...prev,
        {
          ...invitation,
          fromUser: {
            ...invitation.fromUser,
            name: displayName
          }
        }
      ])

      // Don't show toast - UI will handle the invitation display

      mutate()
    })

    channel.bind('battle-started', (data: any) => {
      // Remove the invitation from pending when battle starts
      setPendingInvitations(prev =>
        prev.filter(inv => inv.id !== data.invitationId)
      )
    })

    channel.bind('battle-accepted', (data: any) => {
      // Remove the invitation when accepted
      setPendingInvitations(prev =>
        prev.filter(inv => inv.id !== data.invitationId)
      )
    })

    channel.bind('battle-rejected', (data: any) => {
      // Remove the invitation when rejected
      setPendingInvitations(prev =>
        prev.filter(inv => inv.id !== data.invitationId)
      )
    })

    return () => {
      channel.unbind('battle-invitation')
      channel.unbind('battle-started')
      channel.unbind('battle-accepted')
      channel.unbind('battle-rejected')
      pusherClient?.unsubscribe(`user-${userId}`)
    }
  }, [userId, mutate])

  // Update pending invitations from SWR data
  useEffect(() => {
    if (data?.data) {
      setPendingInvitations(data.data)
    }
  }, [data])

  return {
    pendingInvitations,
    acceptInvitation,
    rejectInvitation,
    sendInvitation,
    isLoading: !data && !error,
    error
  }
}
