'use client'

import { useEffect, useState, useCallback } from 'react'

import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Shield,
  Zap,
  Flame,
  Heart,
  Skull,
  Sparkles,
  Star,
  Sparkle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useBattleRealtime } from '@/hooks/use-battle-realtime'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib'
import { api } from '@/lib/api/http-client'

interface BattleAnimationProps {
  player1: {
    id: number
    name: string
    combatPower: number
  }
  player2: {
    id: number
    name: string
    combatPower: number
  }
  battleId?: number
  onComplete?: (winnerId: number) => void
}

interface DamageNumber {
  id: number
  damage: number
  x: number
  y: number
  isCritical: boolean
}

export function BattleAnimation({
  player1,
  player2,
  battleId,
  onComplete
}: BattleAnimationProps) {
  const { user } = useSession()
  const [phase, setPhase] = useState<
    'preparing' | 'fighting' | 'victory' | 'complete'
  >('preparing')
  const [player1Health, setPlayer1Health] = useState(100)
  const [player2Health, setPlayer2Health] = useState(100)
  const [currentAttacker, setCurrentAttacker] = useState<1 | 2 | null>(null)
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([])
  const [comboCount, setComboCount] = useState(0)
  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [screenShake, setScreenShake] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [actionCount, setActionCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastProcessTime, setLastProcessTime] = useState(0)

  // Real-time battle updates
  useBattleRealtime(user?.id, {
    onBattleUpdate: data => {
      if (data.battleId !== battleId) return

      // Update health
      setPlayer1Health(data.player1Health)
      setPlayer2Health(data.player2Health)
      setCurrentRound(data.round)

      // Show attack animation
      if (data.attacker) {
        setCurrentAttacker(data.attacker)

        // Add damage number
        addDamageNumber(
          data.damage,
          data.attacker === 1 ? 2 : 1,
          data.isCritical
        )

        // Screen shake on critical
        if (data.isCritical) {
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 300)
        }

        // Clear attacker after animation
        setTimeout(() => setCurrentAttacker(null), 1000)
      }
    },
    onBattleCompleted: data => {
      if (data.battleId !== battleId) return

      const battleWinner = data.winnerId === player1.id ? 1 : 2
      setWinner(battleWinner)
      setPhase('victory')

      if (data.winnerId === user?.id) {
        triggerVictoryConfetti()
      }

      setTimeout(() => {
        setPhase('complete')
        if (onComplete) {
          onComplete(data.winnerId)
        }
      }, 4000)
    }
  })

  // Victory confetti effect
  const triggerVictoryConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  // Add damage number
  const addDamageNumber = (
    damage: number,
    targetPlayer: 1 | 2,
    isCritical: boolean = false
  ) => {
    const newDamage: DamageNumber = {
      id: Date.now() + Math.random(),
      damage,
      x: targetPlayer === 1 ? 25 : 75,
      y: 50,
      isCritical
    }
    setDamageNumbers(prev => [...prev, newDamage])

    // Remove damage number after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== newDamage.id))
    }, 1500)
  }

  // Process battle round
  const processBattleRound = useCallback(async () => {
    if (!battleId || isProcessing || phase !== 'fighting') return

    const now = Date.now()
    if (now - lastProcessTime < 3000) return // Prevent too frequent processing

    setIsProcessing(true)
    setLastProcessTime(now)

    try {
      const response = await api.post('/api/battles/process', {
        battleId,
        action: actionCount > 0 ? { type: 'attack', power: actionCount } : null
      })

      if (response.data?.data) {
        const data = response.data.data
        setPlayer1Health(data.player1Health)
        setPlayer2Health(data.player2Health)
        setCurrentRound(data.currentRound)

        // Reset action count after processing
        if (actionCount > 0) {
          setActionCount(0)
        }
      }
    } catch (error) {
      console.error('Error processing battle round:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [battleId, isProcessing, phase, actionCount, lastProcessTime])

  // Handle player action (clicking/tapping for attacks)
  const handlePlayerAction = useCallback(
    (actionType: 'attack' | 'defend' | 'special') => {
      if (phase !== 'fighting' || winner) return

      setActionCount(prev => prev + 1)
      setComboCount(prev => prev + 1)

      // Reset combo after 2 seconds
      setTimeout(() => {
        setComboCount(0)
      }, 2000)

      // Visual feedback
      const isPlayer1 = user?.id === player1.id
      setCurrentAttacker(isPlayer1 ? 1 : 2)
      setTimeout(() => setCurrentAttacker(null), 300)
    },
    [phase, winner, user?.id, player1.id]
  )

  // Start battle sequence
  useEffect(() => {
    const startBattle = async () => {
      // Preparing phase
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPhase('fighting')

      // If we have a battleId, start processing rounds
      if (battleId) {
        // Initial round processing
        processBattleRound()
      }
    }

    startBattle()
  }, [battleId])

  // Process rounds periodically
  useEffect(() => {
    if (phase !== 'fighting' || !battleId) return

    const interval = setInterval(() => {
      processBattleRound()
    }, 3000) // Process every 3 seconds

    return () => clearInterval(interval)
  }, [phase, battleId, processBattleRound])

  return (
    <div
      className={cn(
        'relative flex min-h-[500px] items-center justify-center',
        screenShake && 'animate-pulse'
      )}
    >
      <AnimatePresence mode='wait'>
        {phase === 'preparing' && (
          <motion.div
            key='preparing'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className='text-center'
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Swords className='text-primary mx-auto mb-4 h-20 w-20' />
            </motion.div>
            <h3 className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-3xl font-black text-transparent'>
              PREPARING BATTLE
            </h3>
            <p className='text-muted-foreground mt-2 animate-pulse'>
              Warriors entering the arena...
            </p>
          </motion.div>
        )}

        {(phase === 'fighting' || phase === 'victory') && (
          <motion.div
            key='fighting'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='w-full space-y-8'
          >
            {/* Round Counter */}
            <div className='text-center'>
              <Badge className='bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-white'>
                ROUND {currentRound}
              </Badge>
            </div>

            {/* Combo Counter */}
            <AnimatePresence>
              {comboCount > 1 && (
                <motion.div
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 20 }}
                  className='absolute top-0 right-0 z-20'
                >
                  <Badge className='bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-lg font-black text-white'>
                    {comboCount}x COMBO!
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Damage Numbers */}
            <AnimatePresence>
              {damageNumbers.map(dmg => (
                <motion.div
                  key={dmg.id}
                  initial={{
                    y: 0,
                    opacity: 1,
                    scale: dmg.isCritical ? 1.5 : 1
                  }}
                  animate={{ y: -50, opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className='pointer-events-none absolute z-30'
                  style={{ left: `${dmg.x}%`, top: '40%' }}
                >
                  <span
                    className={cn(
                      'font-black',
                      dmg.isCritical
                        ? 'text-4xl text-red-500'
                        : 'text-2xl text-yellow-500'
                    )}
                  >
                    -{dmg.damage}
                    {dmg.isCritical && (
                      <span className='ml-2 text-lg'>CRITICAL!</span>
                    )}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Battle Field */}
            <div className='grid grid-cols-3 items-center gap-8'>
              {/* Player 1 */}
              <motion.div
                animate={{
                  x: currentAttacker === 1 ? 30 : 0,
                  scale:
                    phase === 'victory' && winner === 1
                      ? 1.2
                      : currentAttacker === 1
                        ? 1.1
                        : 1,
                  opacity: phase === 'victory' && winner === 2 ? 0.5 : 1,
                  y: phase === 'victory' && winner === 2 ? 50 : 0
                }}
                transition={{ type: 'spring', stiffness: 200 }}
                className='text-center'
              >
                <div
                  className={cn(
                    'relative inline-block',
                    currentAttacker === 1 && 'animate-pulse'
                  )}
                >
                  {phase === 'victory' && winner === 1 ? (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Star className='mx-auto mb-2 h-24 w-24 text-yellow-500' />
                    </motion.div>
                  ) : phase === 'victory' && winner === 2 ? (
                    <Skull className='mx-auto mb-2 h-24 w-24 text-gray-500' />
                  ) : (
                    <Shield className='mx-auto mb-2 h-24 w-24 text-blue-500' />
                  )}
                  {currentAttacker === 1 && phase === 'fighting' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className='absolute inset-0 flex items-center justify-center'
                    >
                      <Zap className='h-12 w-12 text-yellow-500' />
                    </motion.div>
                  )}
                </div>
                <p className='font-bold text-blue-600 dark:text-blue-400'>
                  {player1.name}
                </p>
                <p className='text-muted-foreground text-sm'>
                  CP: {player1.combatPower}
                </p>

                {/* Health Bar */}
                <div className='mt-3 space-y-1'>
                  <div className='flex items-center justify-center gap-2'>
                    <Heart className='h-4 w-4 text-red-500' />
                    <span className='text-sm font-bold'>{player1Health}%</span>
                  </div>
                  <Progress
                    value={player1Health}
                    className='h-3'
                    indicatorClassName={cn(
                      'transition-all duration-300',
                      player1Health > 50
                        ? 'bg-green-500'
                        : player1Health > 25
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                  />
                </div>

                {/* Victory/Defeat Badge */}
                {phase === 'victory' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {winner === 1 ? (
                      <Badge className='mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-white'>
                        <Sparkles className='mr-2 h-4 w-4' />
                        WINNER!
                      </Badge>
                    ) : (
                      <Badge className='mt-3 bg-gray-500/20 px-4 py-2'>
                        DEFEATED
                      </Badge>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* VS / Battle Status */}
              <div className='text-center'>
                {phase === 'fighting' ? (
                  <>
                    <motion.div
                      animate={{ rotate: currentAttacker ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                      className='inline-block'
                    >
                      <Flame className='mx-auto h-16 w-16 text-orange-500' />
                    </motion.div>
                    <p className='mt-2 text-3xl font-black'>BATTLE!</p>
                    {currentAttacker && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-2 text-sm font-bold text-orange-500'
                      >
                        {currentAttacker === 1 ? player1.name : player2.name}{' '}
                        ATTACKS!
                      </motion.p>
                    )}
                  </>
                ) : phase === 'victory' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Swords className='mx-auto h-16 w-16 text-yellow-500' />
                    <p className='mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-3xl font-black text-transparent'>
                      BATTLE OVER!
                    </p>
                  </motion.div>
                ) : null}
              </div>

              {/* Player 2 */}
              <motion.div
                animate={{
                  x: currentAttacker === 2 ? -30 : 0,
                  scale:
                    phase === 'victory' && winner === 2
                      ? 1.2
                      : currentAttacker === 2
                        ? 1.1
                        : 1,
                  opacity: phase === 'victory' && winner === 1 ? 0.5 : 1,
                  y: phase === 'victory' && winner === 1 ? 50 : 0
                }}
                transition={{ type: 'spring', stiffness: 200 }}
                className='text-center'
              >
                <div
                  className={cn(
                    'relative inline-block',
                    currentAttacker === 2 && 'animate-pulse'
                  )}
                >
                  {phase === 'victory' && winner === 2 ? (
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Star className='mx-auto mb-2 h-24 w-24 text-yellow-500' />
                    </motion.div>
                  ) : phase === 'victory' && winner === 1 ? (
                    <Skull className='mx-auto mb-2 h-24 w-24 text-gray-500' />
                  ) : (
                    <Shield className='mx-auto mb-2 h-24 w-24 text-red-500' />
                  )}
                  {currentAttacker === 2 && phase === 'fighting' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className='absolute inset-0 flex items-center justify-center'
                    >
                      <Zap className='h-12 w-12 text-yellow-500' />
                    </motion.div>
                  )}
                </div>
                <p className='font-bold text-red-600 dark:text-red-400'>
                  {player2.name}
                </p>
                <p className='text-muted-foreground text-sm'>
                  CP: {player2.combatPower}
                </p>

                {/* Health Bar */}
                <div className='mt-3 space-y-1'>
                  <div className='flex items-center justify-center gap-2'>
                    <Heart className='h-4 w-4 text-red-500' />
                    <span className='text-sm font-bold'>{player2Health}%</span>
                  </div>
                  <Progress
                    value={player2Health}
                    className='h-3'
                    indicatorClassName={cn(
                      'transition-all duration-300',
                      player2Health > 50
                        ? 'bg-green-500'
                        : player2Health > 25
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                  />
                </div>

                {/* Victory/Defeat Badge */}
                {phase === 'victory' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {winner === 2 ? (
                      <Badge className='mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-white'>
                        <Sparkles className='mr-2 h-4 w-4' />
                        WINNER!
                      </Badge>
                    ) : (
                      <Badge className='mt-3 bg-gray-500/20 px-4 py-2'>
                        DEFEATED
                      </Badge>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Action Buttons */}
            {phase === 'fighting' && !winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='mt-8 flex justify-center gap-4'
              >
                <Button
                  onClick={() => handlePlayerAction('attack')}
                  disabled={isProcessing}
                  className='gap-2 bg-gradient-to-r from-red-600 to-orange-600 font-bold text-white hover:from-red-700 hover:to-orange-700'
                >
                  <Swords className='h-4 w-4' />
                  ATTACK!
                </Button>
                <Button
                  onClick={() => handlePlayerAction('defend')}
                  disabled={isProcessing}
                  variant='outline'
                  className='gap-2 border-blue-500/30 hover:bg-blue-500/10'
                >
                  <Shield className='h-4 w-4' />
                  DEFEND
                </Button>
                <Button
                  onClick={() => handlePlayerAction('special')}
                  disabled={isProcessing || comboCount < 3}
                  className={cn(
                    'gap-2',
                    comboCount >= 3
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white hover:from-purple-700 hover:to-pink-700'
                      : 'cursor-not-allowed opacity-50'
                  )}
                >
                  <Sparkle className='h-4 w-4' />
                  SPECIAL
                </Button>
              </motion.div>
            )}

            {/* Action Counter */}
            {actionCount > 0 && phase === 'fighting' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='text-center'
              >
                <Badge className='bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white'>
                  ACTION POWER: {actionCount}
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div
            key='complete'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className='text-center'
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1 }}
            >
              <Swords className='text-primary mx-auto mb-4 h-16 w-16' />
            </motion.div>
            <h3 className='text-xl font-bold'>Processing Results...</h3>
            <p className='text-muted-foreground mt-2'>
              Calculating rewards and updating stats
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
