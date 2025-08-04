'use client'

import { useEffect, useState } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Shield, Zap, Flame } from 'lucide-react'

import { cn } from '@/lib'

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
  onComplete?: (winnerId: number) => void
}

export function BattleAnimation({
  player1,
  player2,
  onComplete
}: BattleAnimationProps) {
  const [phase, setPhase] = useState<'preparing' | 'fighting' | 'complete'>(
    'preparing'
  )
  const [player1Health, setPlayer1Health] = useState(100)
  const [player2Health, setPlayer2Health] = useState(100)
  const [currentAttacker, setCurrentAttacker] = useState<1 | 2 | null>(null)

  useEffect(() => {
    const battleSequence = async () => {
      // Preparing phase
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPhase('fighting')

      // Fighting phase - simulate battle
      const maxRounds = 5
      let round = 0

      while (round < maxRounds && player1Health > 0 && player2Health > 0) {
        round++

        // Alternate attacks
        const attacker = round % 2 === 1 ? 1 : 2
        setCurrentAttacker(attacker)

        // Calculate damage based on combat power with some randomness
        const attackPower =
          attacker === 1 ? player1.combatPower : player2.combatPower
        const defensePower =
          attacker === 1 ? player2.combatPower : player1.combatPower
        const damageMultiplier =
          attackPower / (attackPower + defensePower) + Math.random() * 0.3
        const damage = Math.floor(20 * damageMultiplier)

        // Apply damage
        if (attacker === 1) {
          setPlayer2Health(prev => Math.max(0, prev - damage))
        } else {
          setPlayer1Health(prev => Math.max(0, prev - damage))
        }

        await new Promise(resolve => setTimeout(resolve, 800))
        setCurrentAttacker(null)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Determine winner based on remaining health
      const winnerId = player1Health > player2Health ? player1.id : player2.id

      setPhase('complete')
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (onComplete) {
        onComplete(winnerId)
      }
    }

    battleSequence()
  }, [])

  return (
    <div className='relative flex min-h-[400px] items-center justify-center'>
      <AnimatePresence mode='wait'>
        {phase === 'preparing' && (
          <motion.div
            key='preparing'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className='text-center'
          >
            <Swords className='text-primary mx-auto mb-4 h-16 w-16 animate-pulse' />
            <h3 className='text-xl font-bold'>Preparing Battle...</h3>
            <p className='text-muted-foreground mt-2'>
              Calculating battle outcome
            </p>
          </motion.div>
        )}

        {phase === 'fighting' && (
          <motion.div
            key='fighting'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='w-full space-y-8'
          >
            {/* Battle Field */}
            <div className='grid grid-cols-3 items-center gap-8'>
              {/* Player 1 */}
              <motion.div
                animate={{
                  x: currentAttacker === 1 ? 20 : 0,
                  scale: currentAttacker === 1 ? 1.1 : 1
                }}
                className='text-center'
              >
                <div
                  className={cn(
                    'relative inline-block',
                    currentAttacker === 1 && 'animate-pulse'
                  )}
                >
                  <Shield className='mx-auto mb-2 h-20 w-20 text-blue-500' />
                  {currentAttacker === 1 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className='absolute inset-0 flex items-center justify-center'
                    >
                      <Zap className='h-10 w-10 text-yellow-500' />
                    </motion.div>
                  )}
                </div>
                <p className='font-bold'>{player1.name}</p>
                <p className='text-muted-foreground text-sm'>
                  CP: {player1.combatPower}
                </p>

                {/* Health Bar */}
                <div className='mt-2 h-2 w-full rounded-full bg-gray-200'>
                  <motion.div
                    className='h-2 rounded-full bg-blue-500'
                    animate={{ width: `${player1Health}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className='mt-1 text-xs'>{player1Health}%</p>
              </motion.div>

              {/* VS */}
              <div className='text-center'>
                <motion.div
                  animate={{ rotate: currentAttacker ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                  className='inline-block'
                >
                  <Flame className='mx-auto h-12 w-12 text-orange-500' />
                </motion.div>
                <p className='mt-2 text-2xl font-bold'>BATTLE</p>
              </div>

              {/* Player 2 */}
              <motion.div
                animate={{
                  x: currentAttacker === 2 ? -20 : 0,
                  scale: currentAttacker === 2 ? 1.1 : 1
                }}
                className='text-center'
              >
                <div
                  className={cn(
                    'relative inline-block',
                    currentAttacker === 2 && 'animate-pulse'
                  )}
                >
                  <Shield className='mx-auto mb-2 h-20 w-20 text-red-500' />
                  {currentAttacker === 2 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className='absolute inset-0 flex items-center justify-center'
                    >
                      <Zap className='h-10 w-10 text-yellow-500' />
                    </motion.div>
                  )}
                </div>
                <p className='font-bold'>{player2.name}</p>
                <p className='text-muted-foreground text-sm'>
                  CP: {player2.combatPower}
                </p>

                {/* Health Bar */}
                <div className='mt-2 h-2 w-full rounded-full bg-gray-200'>
                  <motion.div
                    className='h-2 rounded-full bg-red-500'
                    animate={{ width: `${player2Health}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className='mt-1 text-xs'>{player2Health}%</p>
              </motion.div>
            </div>

            {/* Action Text */}
            <AnimatePresence mode='wait'>
              {currentAttacker && (
                <motion.div
                  key={`attack-${currentAttacker}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='text-center'
                >
                  <p className='text-lg font-semibold'>
                    {currentAttacker === 1 ? player1.name : player2.name}{' '}
                    attacks!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
            <h3 className='text-xl font-bold'>Battle Complete!</h3>
            <p className='text-muted-foreground mt-2'>Calculating results...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
