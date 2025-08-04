'use client'

import { useEffect, useState, useRef } from 'react'

import type { Battle } from '@/lib/db/schema'
import { pusherClient } from '@/lib/pusher'

interface BattleWithPlayers extends Battle {
  player1: {
    id: number
    name: string | null
    walletAddress: string
  }
  player2: {
    id: number
    name: string | null
    walletAddress: string
  }
  winner?: {
    id: number
    name: string | null
    walletAddress: string
  } | null
}

interface UseBattleRealtimeProps {
  battleId?: number
  userId?: number
  onBattleStart?: (battle: BattleWithPlayers) => void
  onBattleComplete?: (battle: BattleWithPlayers) => void
  onMatchFound?: (battle: BattleWithPlayers) => void
}

interface BattleRealtimeEvent {
  battle: BattleWithPlayers
  action: 'started' | 'completed' | 'match_found'
  winnerId?: number
  feeDiscountPercent?: number
  discountExpiresAt?: Date
}

export function useBattleRealtime({
  battleId,
  userId,
  onBattleStart,
  onBattleComplete,
  onMatchFound
}: UseBattleRealtimeProps = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastBattle, setLastBattle] = useState<BattleWithPlayers | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const channelsRef = useRef<Set<any>>(new Set())

  useEffect(() => {
    if (!pusherClient) {
      setIsConnected(false)
      return
    }

    const channels: string[] = []

    // Subscribe to specific battle channel if battleId is provided
    if (battleId) {
      channels.push(`battle-${battleId}`)
    }

    // Subscribe to user's battles channel if userId is provided
    if (userId) {
      channels.push(`user-battles-${userId}`)
    }

    // Subscribe to channels
    channels.forEach(channelName => {
      const channel = pusherClient!.subscribe(channelName)
      channelsRef.current.add(channel)

      channel.bind('pusher:subscription_succeeded', () => {
        setIsConnected(true)
      })

      channel.bind('pusher:subscription_error', () => {
        setIsConnected(false)
      })

      // Listen for battle match found
      channel.bind('battle-match-found', (event: BattleRealtimeEvent) => {
        setIsSearching(false)
        setLastBattle(event.battle)

        if (onMatchFound) {
          onMatchFound(event.battle)
        }
      })

      // Listen for battle start
      channel.bind('battle-started', (event: BattleRealtimeEvent) => {
        setLastBattle(event.battle)

        if (onBattleStart) {
          onBattleStart(event.battle)
        }
      })

      // Listen for battle completion
      channel.bind('battle-completed', (event: BattleRealtimeEvent) => {
        setLastBattle(event.battle)

        if (onBattleComplete) {
          onBattleComplete(event.battle)
        }
      })

      // Listen for matchmaking status
      channel.bind('matchmaking-searching', () => {
        setIsSearching(true)
      })

      channel.bind('matchmaking-cancelled', () => {
        setIsSearching(false)
      })
    })

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        channel.unbind_all()
        pusherClient?.unsubscribe(channel.name)
      })
      channelsRef.current.clear()
    }
  }, [battleId, userId, onBattleStart, onBattleComplete, onMatchFound])

  return {
    isConnected,
    lastBattle,
    isSearching
  }
}

// Hook for listening to global battle events (leaderboard updates, etc.)
export function useGlobalBattleRealtime(
  onNewBattle?: (battle: BattleWithPlayers) => void,
  onLeaderboardUpdate?: (leaderboard: any[]) => void
) {
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!pusherClient) {
      setIsConnected(false)
      return
    }

    const channelName = 'battles-global'

    if (channelRef.current?.name === channelName) {
      return
    }

    if (channelRef.current) {
      pusherClient.unsubscribe(channelRef.current.name)
    }

    const channel = pusherClient.subscribe(channelName)
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true)
    })

    channel.bind('pusher:subscription_error', () => {
      setIsConnected(false)
    })

    // Listen for new battles
    channel.bind('battle-created', (event: { battle: BattleWithPlayers }) => {
      if (onNewBattle) {
        onNewBattle(event.battle)
      }
    })

    // Listen for leaderboard updates
    channel.bind('leaderboard-updated', (event: { leaderboard: any[] }) => {
      if (onLeaderboardUpdate) {
        onLeaderboardUpdate(event.leaderboard)
      }
    })

    return () => {
      if (pusherClient && channel) {
        channel.unbind_all()
        pusherClient.unsubscribe(channelName)
      }
      channelRef.current = null
    }
  }, [onNewBattle, onLeaderboardUpdate])

  return {
    isConnected
  }
}
