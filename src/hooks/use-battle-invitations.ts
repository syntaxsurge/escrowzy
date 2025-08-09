'use client'

import { useCallback, useEffect, useState } from 'react'

import useSWR from 'swr'

import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()
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
          toast({
            title: '⚔️ Battle Starting!',
            description: 'Get ready to fight!',
            variant: 'default'
          })

          // Remove from pending list
          setPendingInvitations(prev =>
            prev.filter(inv => inv.id !== invitationId)
          )

          mutate()
          return response.data.data
        }
      } catch (error: any) {
        // Don't show toast for invalid invitations - let the UI handle it
        if (error.response?.data?.error !== 'Invalid or expired invitation') {
          toast({
            title: 'Failed to accept',
            description: error.response?.data?.error || 'Something went wrong',
            variant: 'destructive'
          })
        }
        return null
      }
    },
    [toast, mutate]
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
        toast({
          title: 'Failed to reject',
          description: error.response?.data?.error || 'Something went wrong',
          variant: 'destructive'
        })
        return false
      }
    },
    [toast, mutate]
  )

  // Send invitation
  const sendInvitation = useCallback(
    async (toUserId: number) => {
      try {
        const response = await api.post('/api/battles/invite', { toUserId })

        if (response.data.success) {
          toast({
            title: '⚔️ Battle invitation sent!',
            description: 'Waiting for opponent to accept...',
            variant: 'default'
          })
          return response.data.data
        }
      } catch (error: any) {
        toast({
          title: 'Failed to send invitation',
          description: error.response?.data?.error || 'Something went wrong',
          variant: 'destructive'
        })
        return null
      }
    },
    [toast]
  )

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

      toast({
        title: '⚔️ Battle Challenge!',
        description: `${displayName} wants to battle you!`,
        variant: 'default'
      })

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
  }, [userId, toast, mutate])

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
