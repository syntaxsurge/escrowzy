'use client'

import { useState, useEffect, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  AlertTriangle,
  Zap,
  Swords,
  User,
  UserX,
  RefreshCw
} from 'lucide-react'
import useSWR from 'swr'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib'
import type { DailyBattleLimit } from '@/types/battle'

interface MatchmakingInterfaceProps {
  combatPower: number
  canBattle: boolean
  isSearching: boolean
  isInQueue: boolean
  dailyLimit: DailyBattleLimit | undefined
  onFindMatch: (matchRange?: number) => Promise<any>
  onLeaveQueue: () => Promise<void>
  activeMinCP?: number | null
  activeMaxCP?: number | null
  activeRange?: number | null
}

const SEARCH_MESSAGES = [
  'Scanning the battlefield...',
  'Looking for worthy opponents...',
  'Analyzing combat powers...',
  'Matching skill levels...',
  'Finding the perfect challenge...',
  'Almost there...'
]

export function MatchmakingInterface({
  combatPower,
  canBattle,
  isSearching,
  isInQueue,
  dailyLimit,
  onFindMatch,
  onLeaveQueue,
  activeMinCP: propMinCP,
  activeMaxCP: propMaxCP,
  activeRange: propRange
}: MatchmakingInterfaceProps) {
  const [matchRange, setMatchRange] = useState(20)
  const [searchingAnimation, setSearchingAnimation] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isLocalSearching, setIsLocalSearching] = useState(false)

  // Fetch live battle stats and queue info
  const { data: _liveStats } = useSWR(
    '/api/battles/live-stats',
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 5000 } // Refresh every 5 seconds
  )

  const { data: queueInfo } = useSWR(
    isInQueue ? '/api/battles/queue-info' : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 2000 } // Refresh every 2 seconds when in queue
  )

  // Calculate current range based on slider
  const currentMinCP = Math.floor(combatPower * (1 - matchRange / 100))
  const currentMaxCP = Math.ceil(combatPower * (1 + matchRange / 100))

  // Use prop values when available (from parent), otherwise calculate from current range
  const displayMinCP =
    (isLocalSearching || isSearching || isInQueue) &&
    propMinCP !== null &&
    propMinCP !== undefined
      ? propMinCP
      : currentMinCP
  const displayMaxCP =
    (isLocalSearching || isSearching || isInQueue) &&
    propMaxCP !== null &&
    propMaxCP !== undefined
      ? propMaxCP
      : currentMaxCP
  const displayRange =
    (isLocalSearching || isSearching || isInQueue) &&
    propRange !== null &&
    propRange !== undefined
      ? propRange
      : matchRange

  const getTimeUntilReset = () => {
    if (!dailyLimit?.resetsAt) return ''

    const now = new Date()
    const reset = new Date(dailyLimit.resetsAt)
    const diff = reset.getTime() - now.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  // Handle search initiation
  const handleFindMatch = useCallback(async () => {
    setIsLocalSearching(true)
    setCurrentMessage(0)

    // Start the actual search - parent will handle storing the values
    const result = await onFindMatch(matchRange)

    if (result) {
      // Match found, stop searching
      setIsLocalSearching(false)
    }
    // If no match, we stay in queue - no need to show any error
  }, [matchRange, onFindMatch])

  // Message cycling animation
  useEffect(() => {
    if (isLocalSearching || isInQueue) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % SEARCH_MESSAGES.length)
        setSearchingAnimation(prev => (prev + 10) % 100)
      }, 2000) // Change message every 2 seconds

      return () => clearInterval(interval)
    }
  }, [isLocalSearching, isInQueue])

  // Reset state when isSearching changes
  useEffect(() => {
    if (!isSearching && !isLocalSearching && !isInQueue) {
      setSearchingAnimation(0)
    }
  }, [isSearching, isLocalSearching, isInQueue])

  // Show searching overlay when looking for match
  if (isLocalSearching || isSearching || isInQueue) {
    return (
      <div className='space-y-6'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center'
        >
          <div className='relative mb-6 inline-block'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className='border-primary/20 absolute inset-0 rounded-full border-4'
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className='border-t-primary absolute inset-0 rounded-full border-4 border-r-transparent border-b-transparent border-l-transparent'
            />
            <div className='relative flex h-32 w-32 items-center justify-center'>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Swords className='text-primary h-16 w-16' />
              </motion.div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className='absolute -right-2 -bottom-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg'
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              >
                <RefreshCw className='h-6 w-6' />
              </motion.div>
            </motion.div>
          </div>

          <motion.h3
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className='text-primary text-2xl font-black'
          >
            {isInQueue ? 'IN MATCHMAKING QUEUE' : 'SEARCHING FOR OPPONENT'}
          </motion.h3>

          <div className='mx-auto mt-4 max-w-xs space-y-3'>
            <Progress value={searchingAnimation} className='h-3' />
            <AnimatePresence mode='wait'>
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='text-muted-foreground text-sm font-medium'
              >
                {isInQueue
                  ? 'You are in the queue, waiting for opponents...'
                  : SEARCH_MESSAGES[currentMessage]}
              </motion.p>
            </AnimatePresence>
            <p className='text-muted-foreground text-xs'>
              Finding warriors within{' '}
              <strong className='text-primary'>
                {displayMinCP} - {displayMaxCP} CP
              </strong>{' '}
              range (±{displayRange}%)
            </p>
            <Button
              onClick={async () => {
                if (isInQueue) {
                  await onLeaveQueue()
                } else {
                  setIsLocalSearching(false)
                  setSearchingAnimation(0)
                }
              }}
              variant='outline'
              className='gap-2 border-red-500/30 hover:bg-red-500/10'
            >
              <UserX className='h-4 w-4' />
              {isInQueue ? 'Leave Queue' : 'Cancel Search'}
            </Button>
          </div>

          <div className='mt-6 flex justify-center gap-8'>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className='text-center'
            >
              <div className='mb-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-3'>
                <User className='h-8 w-8 text-green-500' />
              </div>
              <p className='text-xs font-bold'>YOU</p>
              <p className='text-lg font-bold'>{combatPower} CP</p>
            </motion.div>

            <div className='flex items-center'>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                className='text-primary text-3xl font-black'
              >
                VS
              </motion.div>
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className='text-center'
            >
              <div className='mb-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 p-3'>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <User className='h-8 w-8 text-red-500' />
                </motion.div>
              </div>
              <p className='text-xs font-bold'>SEARCHING...</p>
              <motion.p
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className='text-lg font-bold'
              >
                ??? CP
              </motion.p>
            </motion.div>
          </div>

          {queueInfo?.data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className='mt-6 rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4'
            >
              <div className='grid grid-cols-2 gap-4 text-center'>
                <div>
                  <p className='text-muted-foreground text-xs uppercase'>
                    Queue Position
                  </p>
                  <p className='text-2xl font-bold text-purple-500'>
                    #{queueInfo.data.queuePosition || 1}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs uppercase'>
                    Est. Wait Time
                  </p>
                  <p className='text-2xl font-bold text-pink-500'>
                    {queueInfo.data.estimatedWaitTime || 10}s
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Search Settings */}
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {/* Match Range Selector */}
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium'>Match Range</label>
              <span className='text-muted-foreground text-sm'>
                ±{matchRange}% CP
              </span>
            </div>

            <Slider
              value={[matchRange]}
              onValueChange={([value]: number[]) => setMatchRange(value)}
              min={10}
              max={50}
              step={5}
              className='w-full'
            />

            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>Narrow (±10%)</span>
              <span>Wide (±50%)</span>
            </div>

            <div className='bg-muted rounded-lg p-3'>
              <p className='text-sm'>
                Opponents will have between <strong>{currentMinCP}</strong> and{' '}
                <strong>{currentMaxCP}</strong> Combat Power
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show alert only if daily limit reached */}
      {!canBattle && dailyLimit && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            Daily battle limit reached. Resets in {getTimeUntilReset()}
          </AlertDescription>
        </Alert>
      )}

      {/* Find Match Button */}
      <div className='flex justify-center'>
        <LoadingButton
          size='lg'
          onClick={handleFindMatch}
          disabled={!canBattle}
          isLoading={isLocalSearching || isSearching}
          loadingText='Searching...'
          className={cn(
            'min-w-[200px] gap-2',
            (isLocalSearching || isSearching) && 'animate-pulse'
          )}
        >
          <Search className='h-5 w-5' />
          Find Opponent
        </LoadingButton>
      </div>

      {/* Info Box */}
      <Alert>
        <Zap className='h-4 w-4' />
        <AlertDescription>
          Win battles to earn 25% off platform fees for 24 hours! Higher Combat
          Power increases your chances of winning.
        </AlertDescription>
      </Alert>
    </div>
  )
}
