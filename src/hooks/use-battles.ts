'use client'

import { useCallback, useState, useEffect } from 'react'

import useSWR, { mutate } from 'swr'

import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import type {
  BattleDiscount,
  BattleResult,
  BattleStats,
  DailyBattleLimit
} from '@/types/battle'

interface FindMatchResponse {
  opponent: {
    userId: number
    combatPower: number
    username: string
  } | null
  inQueue?: boolean
}

export function useBattles(userId?: number) {
  const { toast } = useToast()
  const [isSearching, setIsSearching] = useState(false)
  const [isBattling, setIsBattling] = useState(false)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [isInQueue, setIsInQueue] = useState(false)

  // Fetch active discount
  const { data: activeDiscount, error: discountError } =
    useSWR<BattleDiscount | null>(
      userId ? apiEndpoints.battles.activeDiscount : null,
      (url: string) => api.get(url).then((res: any) => res.data),
      { refreshInterval: 60000 } // Refresh every minute
    )

  // Fetch battle history
  const { data: battleHistoryResponse, error: historyError } = useSWR<any>(
    userId ? apiEndpoints.battles.history : null,
    (url: string) => api.get(url).then((res: any) => res.data),
    { refreshInterval: 30000 } // Refresh every 30 seconds for real-time updates
  )

  // Fetch daily limit
  const { data: dailyLimit, error: limitError } = useSWR<DailyBattleLimit>(
    userId ? apiEndpoints.battles.dailyLimit : null,
    (url: string) => api.get(url).then((res: any) => res.data),
    { refreshInterval: 60000 } // Refresh every minute
  )

  // Find match
  const findMatch = useCallback(async (matchRange?: number) => {
    setIsSearching(true)
    setIsInQueue(false)
    try {
      const response = await api.post(apiEndpoints.battles.findMatch, {
        matchRange
      })

      // Check if response exists
      if (!response || !response.data) {
        console.error('Invalid response from find match API')
        return null
      }

      const data: FindMatchResponse = response.data

      // Check if user is in queue
      if (data?.inQueue) {
        setIsInQueue(true)
      }

      if (!data?.opponent) {
        // Don't show a toast here - let the UI handle the no match case
        return null
      }

      setIsInQueue(false)
      return data.opponent
    } catch (error: any) {
      // Don't show toast here - let the UI handle the error
      console.error('Failed to find match:', error)
      setIsInQueue(false)
      return null
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Remove from queue
  const leaveQueue = useCallback(async () => {
    if (!userId) return

    try {
      await api.delete(apiEndpoints.battles.findMatch)
      setIsInQueue(false)
    } catch (error) {
      console.error('Failed to leave queue:', error)
    }
  }, [userId])

  // Create battle
  const createBattle = useCallback(
    async (opponentId: number) => {
      setIsBattling(true)
      setBattleResult(null)

      try {
        const response = await api.post(apiEndpoints.battles.create, {
          player2Id: opponentId
        })
        const result: BattleResult = response.data

        setBattleResult(result)

        // Refresh all battle data
        if (userId) {
          mutate(apiEndpoints.battles.activeDiscount)
          mutate(apiEndpoints.battles.history)
          mutate(apiEndpoints.battles.dailyLimit)
          mutate(apiEndpoints.battles.statsByUserId(userId))
        }

        // Show result toast
        if (result.winnerId === userId) {
          toast({
            title: '🏆 Victory!',
            description: `You won! Enjoy ${result.feeDiscountPercent}% off fees for 24 hours!`,
            variant: 'default'
          })
        } else {
          toast({
            title: 'Defeat',
            description:
              'Better luck next time! You gained 10 XP for participating.',
            variant: 'default'
          })
        }

        return result
      } catch (error: any) {
        toast({
          title: 'Battle Error',
          description: error.response?.data?.error || 'Failed to create battle',
          variant: 'destructive'
        })
        return null
      } finally {
        setIsBattling(false)
      }
    },
    [userId, toast]
  )

  // Get battle stats
  const { data: battleStats } = useSWR<BattleStats>(
    userId ? apiEndpoints.battles.statsByUserId(userId) : null,
    (url: string) => api.get(url).then((res: any) => res.data),
    {
      refreshInterval: 60000,
      fallbackData: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageCP: 100,
        totalDiscountsEarned: 0
      }
    }
  )

  const canBattle = dailyLimit
    ? dailyLimit.battlesUsed < dailyLimit.maxBattles
    : true

  // Cleanup queue on unmount or when user navigates away
  useEffect(() => {
    return () => {
      if (isInQueue && userId) {
        // Clean up queue entry when component unmounts
        api.delete(apiEndpoints.battles.findMatch).catch(error => {
          console.error('Failed to cleanup queue on unmount:', error)
        })
      }
    }
  }, [isInQueue, userId])

  // Extract the actual battle history from the response
  // The API returns { success: true, data: { history: { battles: [...], totalBattles, ... }, ... } }
  const battleHistoryData =
    battleHistoryResponse?.data?.history ||
    battleHistoryResponse?.history ||
    battleHistoryResponse
  const battleHistory = battleHistoryData?.battles || []

  return {
    activeDiscount,
    battleHistory,
    battleHistoryStats: battleHistoryData, // Full history object with stats
    dailyLimit,
    battleStats,
    canBattle,
    isSearching,
    isBattling,
    battleResult,
    isInQueue,
    findMatch,
    createBattle,
    leaveQueue,
    isLoading: !battleHistoryResponse && !historyError,
    error: discountError || historyError || limitError
  }
}
