'use client'

import { useState, useEffect, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Shield,
  AlertTriangle,
  Zap,
  Info,
  Swords,
  User,
  UserX,
  RefreshCw,
  Timer,
  Sparkles,
  Globe,
  Users
} from 'lucide-react'
import useSWR from 'swr'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  dailyLimit: DailyBattleLimit | undefined
  onFindMatch: (matchRange?: number) => Promise<any>
}

const SEARCH_DURATION = 15000 // 15 seconds search time
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
  dailyLimit,
  onFindMatch
}: MatchmakingInterfaceProps) {
  const [matchRange, setMatchRange] = useState(20)
  const [searchingAnimation, setSearchingAnimation] = useState(0)
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [showNoMatchFound, setShowNoMatchFound] = useState(false)
  const [isLocalSearching, setIsLocalSearching] = useState(false)

  // Fetch live battle stats
  const { data: liveStats } = useSWR(
    '/api/battles/live-stats',
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 5000 } // Refresh every 5 seconds
  )

  const minCP = Math.floor(combatPower * (1 - matchRange / 100))
  const maxCP = Math.ceil(combatPower * (1 + matchRange / 100))

  const remainingBattles = dailyLimit
    ? dailyLimit.maxBattles - dailyLimit.battlesUsed
    : 3

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
    setShowNoMatchFound(false)
    setIsLocalSearching(true)
    setSearchStartTime(Date.now())
    setCurrentMessage(0)

    // Start the actual search
    const result = await onFindMatch(matchRange)

    // If no match found immediately, let the timer continue
    if (!result) {
      // Timer will handle the no match found state
    } else {
      // Match found, stop searching
      setIsLocalSearching(false)
      setSearchStartTime(null)
    }
  }, [matchRange, onFindMatch])

  // Countdown timer and message cycling
  useEffect(() => {
    if (searchStartTime && isLocalSearching) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - searchStartTime
        const remaining = Math.max(0, SEARCH_DURATION - elapsed)
        setTimeRemaining(Math.ceil(remaining / 1000))

        // Update progress
        setSearchingAnimation((elapsed / SEARCH_DURATION) * 100)

        // Cycle through messages
        const messageIndex = Math.floor(
          (elapsed / SEARCH_DURATION) * SEARCH_MESSAGES.length
        )
        setCurrentMessage(Math.min(messageIndex, SEARCH_MESSAGES.length - 1))

        // Check if search time is up
        if (remaining <= 0) {
          setIsLocalSearching(false)
          setSearchStartTime(null)
          setShowNoMatchFound(true)
          setSearchingAnimation(0)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [searchStartTime, isLocalSearching])

  // Reset state when isSearching changes
  useEffect(() => {
    if (!isSearching && !isLocalSearching) {
      setSearchingAnimation(0)
      setTimeRemaining(0)
    }
  }, [isSearching, isLocalSearching])

  // Show no match found screen
  if (showNoMatchFound) {
    return (
      <div className='space-y-6'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center'
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className='relative mb-6 inline-block'
          >
            <div className='relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20'>
              <UserX className='h-16 w-16 text-orange-500' />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className='absolute -top-2 -right-2'
            >
              <Badge className='bg-red-500 text-white'>NO MATCH</Badge>
            </motion.div>
          </motion.div>

          <h3 className='bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-3xl font-black text-transparent'>
            NO OPPONENTS FOUND
          </h3>

          <p className='text-muted-foreground mt-2 text-lg'>
            The battlefield is empty right now!
          </p>

          <div className='mx-auto mt-6 max-w-md space-y-4'>
            <Card className='border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10'>
              <CardContent className='pt-6'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <Globe className='h-5 w-5 text-orange-500' />
                    <p className='text-sm font-semibold'>
                      Search Range: {minCP} - {maxCP} CP
                    </p>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    We couldn't find any warriors matching your combat power.
                    They might be in other battles or offline.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className='grid grid-cols-3 gap-3'>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className='rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 text-center'
              >
                <Timer className='mx-auto mb-2 h-6 w-6 text-blue-500' />
                <p className='text-xs font-bold'>WAIT</p>
                <p className='text-muted-foreground text-xs'>Try again soon</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className='rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 text-center'
              >
                <Users className='mx-auto mb-2 h-6 w-6 text-green-500' />
                <p className='text-xs font-bold'>INVITE</p>
                <p className='text-muted-foreground text-xs'>Bring friends</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className='rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 text-center'
              >
                <Sparkles className='mx-auto mb-2 h-6 w-6 text-purple-500' />
                <p className='text-xs font-bold'>LEVEL UP</p>
                <p className='text-muted-foreground text-xs'>Gain more CP</p>
              </motion.div>
            </div>

            <div className='flex flex-col gap-3'>
              <Button
                onClick={() => {
                  setMatchRange(Math.min(matchRange + 10, 50))
                  setShowNoMatchFound(false)
                }}
                variant='outline'
                className='gap-2 border-purple-500/30 hover:bg-purple-500/10'
                disabled={matchRange >= 50}
              >
                <Zap className='h-4 w-4' />
                Expand Search Range{' '}
                {matchRange < 50 && `(to ±${matchRange + 10}%)`}
              </Button>

              <Button
                onClick={() => {
                  setShowNoMatchFound(false)
                  handleFindMatch()
                }}
                className='gap-2 bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white hover:from-green-700 hover:to-emerald-800'
              >
                <RefreshCw className='h-4 w-4' />
                SEARCH AGAIN
              </Button>
            </div>

            <Alert className='border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/10'>
              <Info className='h-4 w-4 text-yellow-500' />
              <AlertDescription>
                <strong>Pro Tip:</strong> Peak battle hours are usually evenings
                and weekends. Try expanding your search range or come back
                later!
              </AlertDescription>
            </Alert>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show searching overlay when looking for match
  if (isLocalSearching || isSearching) {
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
            {timeRemaining > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='absolute -right-2 -bottom-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg'
              >
                <span className='text-lg font-bold'>{timeRemaining}</span>
              </motion.div>
            )}
          </div>

          <motion.h3
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className='text-primary text-2xl font-black'
          >
            SEARCHING FOR OPPONENT
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
                {SEARCH_MESSAGES[currentMessage]}
              </motion.p>
            </AnimatePresence>
            <p className='text-muted-foreground text-xs'>
              Finding warriors within {minCP} - {maxCP} CP range
            </p>
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className='mt-6 grid grid-cols-3 gap-2 text-center'
          >
            <div className='rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-2'>
              <p className='text-2xl font-bold text-blue-500'>
                {liveStats?.data?.warriorsOnline || 0}
              </p>
              <p className='text-muted-foreground text-xs'>Warriors Online</p>
            </div>
            <div className='rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-2'>
              <p className='text-2xl font-bold text-green-500'>
                {liveStats?.data?.activeBattles || 0}
              </p>
              <p className='text-muted-foreground text-xs'>Active Battles</p>
            </div>
            <div className='rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-2'>
              <p className='text-2xl font-bold text-purple-500'>
                {liveStats?.data?.inQueue || 0}
              </p>
              <p className='text-muted-foreground text-xs'>In Queue</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Combat Power Display */}
      <div className='text-center'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='inline-block'
        >
          <div className='relative'>
            <Shield className='text-primary mx-auto h-24 w-24' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-2xl font-bold'>{combatPower}</span>
            </div>
          </div>
        </motion.div>
        <p className='mt-2 text-lg font-semibold'>Your Combat Power</p>
        <p className='text-muted-foreground text-sm'>
          Matches will be found within your power range
        </p>
      </div>

      {/* Match Range Selector */}
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
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
                Opponents will have between <strong>{minCP}</strong> and{' '}
                <strong>{maxCP}</strong> Combat Power
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Limit Status */}
      {dailyLimit && (
        <Card>
          <CardContent className='pt-6'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Daily Battles</span>
                <span className='text-sm'>
                  {dailyLimit.battlesUsed} / {dailyLimit.maxBattles}
                </span>
              </div>

              <Progress
                value={(dailyLimit.battlesUsed / dailyLimit.maxBattles) * 100}
                className='h-2'
              />

              {!canBattle && (
                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    Daily battle limit reached. Resets in {getTimeUntilReset()}
                  </AlertDescription>
                </Alert>
              )}

              {canBattle && remainingBattles <= 1 && (
                <Alert>
                  <Info className='h-4 w-4' />
                  <AlertDescription>
                    {remainingBattles} battle{remainingBattles !== 1 ? 's' : ''}{' '}
                    remaining today
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
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
