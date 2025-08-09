'use client'

import { useEffect, useCallback, useState } from 'react'

import { mutate } from 'swr'

import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { pusherClient } from '@/lib/pusher'

interface BattleRealtimeEvents {
  onInvitationReceived?: (data: any) => void
  onInvitationAccepted?: (data: any) => void
  onInvitationRejected?: (data: any) => void
  onBattleStarted?: (data: any) => void
  onBattleUpdate?: (data: any) => void
  onBattleCompleted?: (data: any) => void
  onQueueStatusChanged?: (data: any) => void
  onStatsUpdated?: () => void
  onOpponentAction?: (data: any) => void
}

export function useBattleRealtime(
  userId?: number,
  events?: BattleRealtimeEvents
) {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Handle connection state
  const handleConnectionStateChange = useCallback((state: any) => {
    const connected = state.current === 'connected'
    setIsConnected(connected)
    setConnectionError(
      connected ? null : 'Connection lost. Attempting to reconnect...'
    )
  }, [])

  // Setup Pusher subscriptions
  useEffect(() => {
    if (!pusherClient || !userId) return

    // Subscribe to user's personal channel
    const userChannel = pusherClient.subscribe(`user-${userId}`)

    // Subscribe to global battle channels
    const statsChannel = pusherClient.subscribe('battle-stats')
    const queueChannel = pusherClient.subscribe('battle-queue')

    // Connection state monitoring
    pusherClient.connection.bind('state_change', handleConnectionStateChange)

    // User-specific events
    userChannel.bind('battle-invitation', (data: any) => {
      // Update invitations cache
      mutate('/api/battles/invitations')

      // Show toast notification
      const displayName =
        data.fromUser?.name ||
        data.fromUser?.email ||
        `${data.fromUser?.walletAddress?.slice(0, 6)}...${data.fromUser?.walletAddress?.slice(-4)}` ||
        'A warrior'

      toast({
        title: '⚔️ Battle Challenge!',
        description: `${displayName} wants to battle you!`,
        variant: 'default'
      })

      // Call custom handler if provided
      events?.onInvitationReceived?.(data)
    })

    userChannel.bind('battle-accepted', (data: any) => {
      // Battle was accepted by opponent
      toast({
        title: '⚔️ Battle Accepted!',
        description: 'Your opponent accepted the challenge. Battle starting!',
        variant: 'default'
      })

      events?.onInvitationAccepted?.(data)

      // Refresh battle data
      mutate('/api/battles/invitations')
      mutate(apiEndpoints.battles.dailyLimit)
      mutate(apiEndpoints.battles.history)
      mutate('/api/battles/current')
    })

    userChannel.bind('battle-rejected', (data: any) => {
      // Battle was rejected by opponent
      toast({
        title: 'Challenge Declined',
        description: 'Your opponent declined the battle challenge.',
        variant: 'default'
      })

      events?.onInvitationRejected?.(data)

      // Refresh invitations
      mutate('/api/battles/invitations')
    })

    userChannel.bind('battle-started', (data: any) => {
      // Battle is starting (for the accepter)
      toast({
        title: '⚔️ Battle Starting!',
        description: 'Get ready to fight!',
        variant: 'default'
      })

      events?.onBattleStarted?.(data)

      // Refresh battle data
      mutate(apiEndpoints.battles.dailyLimit)
      mutate(apiEndpoints.battles.history)
      mutate('/api/battles/current')
    })

    userChannel.bind('battle-update', (data: any) => {
      // Battle round update
      events?.onBattleUpdate?.(data)

      // Refresh current battle data
      mutate('/api/battles/current')
    })

    userChannel.bind('battle-completed', (data: any) => {
      // Battle has completed
      events?.onBattleCompleted?.(data)

      // Refresh all battle data
      mutate(apiEndpoints.battles.dailyLimit)
      mutate(apiEndpoints.battles.history)
      mutate(apiEndpoints.battles.activeDiscount)
      mutate('/api/battles/current')
      if (userId) {
        mutate(apiEndpoints.battles.statsByUserId(userId))
      }
    })

    userChannel.bind('opponent-action', (data: any) => {
      // Opponent performed an action in battle
      events?.onOpponentAction?.(data)
    })

    userChannel.bind('queue-status', (data: any) => {
      events?.onQueueStatusChanged?.(data)

      // Refresh queue info
      mutate('/api/battles/queue-info')
    })

    // Global events
    statsChannel.bind('stats-updated', () => {
      // Refresh live stats
      mutate('/api/battles/live-stats')
      events?.onStatsUpdated?.()
    })

    queueChannel.bind('queue-updated', (data: any) => {
      // Refresh queue statistics
      mutate('/api/battles/live-stats')
      mutate('/api/battles/queue-info')
    })

    // Error handling
    userChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('Pusher subscription error:', error)
      setConnectionError('Failed to subscribe to battle updates')
    })

    // Cleanup
    return () => {
      // Unbind all events
      userChannel.unbind_all()
      statsChannel.unbind_all()
      queueChannel.unbind_all()

      // Unsubscribe from channels
      pusherClient?.unsubscribe(`user-${userId}`)
      pusherClient?.unsubscribe('battle-stats')
      pusherClient?.unsubscribe('battle-queue')

      // Unbind connection state
      pusherClient?.connection.unbind(
        'state_change',
        handleConnectionStateChange
      )
    }
  }, [userId, toast, events, handleConnectionStateChange])

  // Retry connection
  const retryConnection = useCallback(() => {
    if (pusherClient && !isConnected) {
      pusherClient.connect()
    }
  }, [isConnected])

  // Force refresh all battle data
  const refreshBattleData = useCallback(() => {
    if (!userId) return

    // Refresh all battle-related endpoints
    mutate('/api/battles/invitations')
    mutate('/api/battles/live-stats')
    mutate('/api/battles/queue-info')
    mutate(apiEndpoints.battles.dailyLimit)
    mutate(apiEndpoints.battles.history)
    mutate(apiEndpoints.battles.activeDiscount)
    mutate(apiEndpoints.battles.statsByUserId(userId))
    mutate('/api/battles/current')
  }, [userId])

  return {
    isConnected,
    connectionError,
    retryConnection,
    refreshBattleData
  }
}

// Hook for subscribing to battle stats only
export function useBattleStats() {
  const [stats, setStats] = useState({
    warriorsOnline: 0,
    activeBattles: 0,
    inQueue: 0
  })

  useEffect(() => {
    if (!pusherClient) return

    const statsChannel = pusherClient.subscribe('battle-stats')
    const queueChannel = pusherClient.subscribe('battle-queue')

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/battles/live-stats')
        const data = await response.json()
        if (data?.data) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch battle stats:', error)
      }
    }

    // Initial fetch
    fetchStats()

    // Listen for updates
    statsChannel.bind('stats-updated', fetchStats)
    queueChannel.bind('queue-updated', fetchStats)

    return () => {
      statsChannel.unbind('stats-updated')
      queueChannel.unbind('queue-updated')
      pusherClient?.unsubscribe('battle-stats')
      pusherClient?.unsubscribe('battle-queue')
    }
  }, [])

  return stats
}
