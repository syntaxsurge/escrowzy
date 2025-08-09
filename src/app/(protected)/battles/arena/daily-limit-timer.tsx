'use client'

import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import { Clock, RefreshCw } from 'lucide-react'
import { mutate } from 'swr'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { apiEndpoints } from '@/config/api-endpoints'
import { cn } from '@/lib'
import type { DailyBattleLimit } from '@/types/battle'

interface DailyLimitTimerProps {
  dailyLimit: DailyBattleLimit | undefined
  userId: number
  onLimitReset?: () => void
  className?: string
}

export function DailyLimitTimer({
  dailyLimit,
  userId,
  onLimitReset,
  className
}: DailyLimitTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [percentageUsed, setPercentageUsed] = useState(0)
  const [hasReset, setHasReset] = useState(false)

  useEffect(() => {
    if (!dailyLimit) return

    const calculateTimeRemaining = () => {
      const now = new Date()
      const resetsAt = new Date(dailyLimit.resetsAt)

      // Check for invalid date
      if (isNaN(resetsAt.getTime())) {
        setTimeRemaining('Invalid date')
        return false
      }

      const diff = resetsAt.getTime() - now.getTime()

      if (diff <= 0) {
        // Timer has expired, trigger a reset
        if (!hasReset) {
          setHasReset(true)
          setTimeRemaining('Resetting...')

          // Refresh the daily limit data
          setTimeout(() => {
            mutate(apiEndpoints.battles.dailyLimit)
            mutate(apiEndpoints.battles.history)
            mutate(apiEndpoints.battles.statsByUserId(userId))

            // Call the reset callback if provided
            if (onLimitReset) {
              onLimitReset()
            }

            setHasReset(false)
          }, 500)
        }
        return false
      }

      // Calculate percentage used
      const percentage = (dailyLimit.battlesUsed / dailyLimit.maxBattles) * 100
      setPercentageUsed(Math.min(100, percentage))

      // Format time remaining
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      // Show countdown in HH:MM:SS format
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

      setTimeRemaining(formattedTime)
      return true
    }

    // Initial calculation
    const shouldContinue = calculateTimeRemaining()
    if (!shouldContinue) return

    // Update every second
    const interval = setInterval(() => {
      const shouldContinue = calculateTimeRemaining()
      if (!shouldContinue) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [dailyLimit, userId, hasReset, onLimitReset])

  if (!dailyLimit || !timeRemaining || timeRemaining === 'Invalid date') {
    return null
  }

  const isLimitReached = dailyLimit.battlesUsed >= dailyLimit.maxBattles
  const isNearLimit = dailyLimit.battlesUsed >= dailyLimit.maxBattles - 1

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card
        className={cn(
          'border-2 transition-all',
          isLimitReached
            ? 'border-red-500/50 bg-red-500/5'
            : isNearLimit
              ? 'border-orange-500/50 bg-orange-500/5'
              : 'border-blue-500/50 bg-blue-500/5'
        )}
      >
        <CardContent className='p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'rounded-lg p-2',
                  isLimitReached
                    ? 'bg-red-100 dark:bg-red-900/20'
                    : isNearLimit
                      ? 'bg-orange-100 dark:bg-orange-900/20'
                      : 'bg-blue-100 dark:bg-blue-900/20'
                )}
              >
                {hasReset ? (
                  <RefreshCw
                    className={cn(
                      'h-4 w-4 animate-spin',
                      isLimitReached
                        ? 'text-red-600'
                        : isNearLimit
                          ? 'text-orange-600'
                          : 'text-blue-600'
                    )}
                  />
                ) : (
                  <Clock
                    className={cn(
                      'h-4 w-4',
                      isLimitReached
                        ? 'text-red-600'
                        : isNearLimit
                          ? 'text-orange-600'
                          : 'text-blue-600'
                    )}
                  />
                )}
              </div>
              <div>
                <p className='text-sm font-semibold'>Daily Battle Limit</p>
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-black'>
                    {dailyLimit.battlesUsed} / {dailyLimit.maxBattles}
                  </span>
                  {isLimitReached && (
                    <Badge variant='destructive' className='animate-pulse'>
                      LIMIT REACHED
                    </Badge>
                  )}
                  {isNearLimit && !isLimitReached && (
                    <Badge className='bg-orange-500 text-white'>
                      1 BATTLE LEFT
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className='text-right'>
              <p className='text-muted-foreground text-xs'>
                {isLimitReached ? 'Resets in' : 'Next reset'}
              </p>
              <div
                className={cn(
                  'font-mono text-lg font-bold tabular-nums',
                  isLimitReached && 'animate-pulse text-red-600'
                )}
              >
                {hasReset ? (
                  <span className='text-green-600'>Resetting...</span>
                ) : (
                  timeRemaining
                )}
              </div>
            </div>
          </div>

          <Progress
            value={percentageUsed}
            className={cn(
              'h-2',
              isLimitReached && '[&>div]:bg-red-500',
              isNearLimit && !isLimitReached && '[&>div]:bg-orange-500'
            )}
          />

          {isLimitReached && (
            <p className='mt-2 animate-pulse text-xs text-red-600'>
              Your daily battle limit has been reached. Wait for the timer to
              reset!
            </p>
          )}
          {!isLimitReached && (
            <p className='text-muted-foreground mt-2 text-xs'>
              {dailyLimit.maxBattles - dailyLimit.battlesUsed} battle
              {dailyLimit.maxBattles - dailyLimit.battlesUsed !== 1
                ? 's'
                : ''}{' '}
              remaining today
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
