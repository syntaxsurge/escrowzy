'use client'

import { useEffect, useState } from 'react'

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
  Star
} from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

  // Poll for battle state updates from server
  const { data: battleData } = useSWR(
    battleId && phase === 'fighting' ? `/api/battles/current` : null,
    (url: string) => api.get(url).then(res => res.data),
    {
      refreshInterval: 2000, // Poll every 2 seconds
      revalidateOnFocus: false
    }
  )

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

  // Update battle state from server data
  useEffect(() => {
    if (battleData?.data && phase === 'fighting') {
      const {
        player1: p1,
        player2: p2,
        currentRound: round,
        status
      } = battleData.data

      // Update health
      if (p1?.health !== undefined) setPlayer1Health(p1.health)
      if (p2?.health !== undefined) setPlayer2Health(p2.health)
      if (round !== undefined) setCurrentRound(round)

      // Check if battle is completed
      if (status === 'completed' || p1?.health <= 0 || p2?.health <= 0) {
        const battleWinner = p1?.health > p2?.health ? 1 : 2
        setWinner(battleWinner)
        setPhase('victory')

        if (battleWinner === 1) {
          triggerVictoryConfetti()
        }

        // Victory phase duration
        setTimeout(() => {
          setPhase('complete')
          if (onComplete) {
            onComplete(battleWinner === 1 ? player1.id : player2.id)
          }
        }, 4000)
      }

      // Show attack animations based on battle log
      const battleLog = battleData.data.battleLog || []
      if (battleLog.length > currentRound && battleLog[currentRound - 1]) {
        const lastRound = battleLog[currentRound - 1]
        if (lastRound.attacker) {
          setCurrentAttacker(lastRound.attacker)

          // Add damage number
          if (lastRound.damage) {
            addDamageNumber(
              lastRound.damage,
              lastRound.attacker === 1 ? 2 : 1,
              lastRound.isCritical || false
            )
          }

          // Screen shake on critical
          if (lastRound.isCritical) {
            setScreenShake(true)
            setTimeout(() => setScreenShake(false), 300)
          }

          // Clear attacker after animation
          setTimeout(() => setCurrentAttacker(null), 1000)
        }
      }
    }
  }, [battleData, phase, currentRound, player1.id, player2.id, onComplete])

  useEffect(() => {
    const battleSequence = async () => {
      // Preparing phase
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPhase('fighting')

      // For battles without server processing (fallback)
      if (!battleId) {
        // Simple animation for 3 minutes
        const totalRounds = 30 // 30 rounds over 3 minutes
        const roundDuration = 6000 // 6 seconds per round

        for (let round = 1; round <= totalRounds; round++) {
          setCurrentRound(round)

          // Random attacker
          const attacker = Math.random() > 0.5 ? 1 : 2
          setCurrentAttacker(attacker)

          // Simulate damage
          const damage = Math.floor(3 + Math.random() * 5) // Smaller damage for longer battle
          const isCritical = Math.random() < 0.2

          if (attacker === 1) {
            setPlayer2Health(prev => {
              const newHealth = Math.max(0, prev - damage)
              if (newHealth <= 0) {
                setWinner(1)
                setPhase('victory')
                triggerVictoryConfetti()
                setTimeout(() => {
                  setPhase('complete')
                  if (onComplete) onComplete(player1.id)
                }, 4000)
              }
              return newHealth
            })
            addDamageNumber(damage, 2, isCritical)
          } else {
            setPlayer1Health(prev => {
              const newHealth = Math.max(0, prev - damage)
              if (newHealth <= 0) {
                setWinner(2)
                setPhase('victory')
                setTimeout(() => {
                  setPhase('complete')
                  if (onComplete) onComplete(player2.id)
                }, 4000)
              }
              return newHealth
            })
            addDamageNumber(damage, 1, isCritical)
          }

          if (isCritical) {
            setScreenShake(true)
            setTimeout(() => setScreenShake(false), 300)
          }

          // Wait for round duration
          await new Promise(resolve =>
            setTimeout(resolve, roundDuration - 1000)
          )
          setCurrentAttacker(null)
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Check if battle should end
          if (phase !== 'fighting') break
        }
      }
    }

    battleSequence()
  }, [battleId, player1, player2, onComplete])

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
