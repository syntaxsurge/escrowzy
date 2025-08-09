'use client'

import { useState, useEffect, useCallback } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Trophy,
  Shield,
  Flame,
  Calendar,
  User,
  Sparkles
} from 'lucide-react'
import useSWR from 'swr'

import { LiveStatsDisplay } from '@/components/blocks/battle/live-stats-display'
import { GamifiedHeader } from '@/components/blocks/trading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBattleInvitations } from '@/hooks/use-battle-invitations'
import { useBattleRealtime } from '@/hooks/use-battle-realtime'
import { useBattles } from '@/hooks/use-battles'
import { useRewards } from '@/hooks/use-rewards'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import { formatNumber } from '@/lib/utils/string'

import { BattleAnimation } from './battle-animation'
import { BattleCountdown } from './battle-countdown'
import { BattleHistory } from './battle-history'
import { BattleInteractions } from './battle-interactions'
import { DiscountTimer } from './discount-timer'
import { MatchmakingInterface } from './matchmaking-interface'

type BattleState =
  | 'idle'
  | 'searching'
  | 'invitation-sent'
  | 'invitation-received'
  | 'invitation-invalid'
  | 'preparing'
  | 'countdown'
  | 'battling'
  | 'result'

interface CurrentBattleData {
  battleId: number
  isPlayer1: boolean
  player1: { id: number; combatPower: number }
  player2: { id: number; combatPower: number }
  opponent: { id: number; name: string; combatPower: number }
  winnerId?: number
  feeDiscountPercent?: number
}

export default function BattleArenaPage() {
  const { user } = useSession()
  // Removed toast - all notifications handled in UI
  const { stats } = useRewards(user?.id)
  const {
    activeDiscount,
    battleHistory,
    battleHistoryStats,
    dailyLimit,
    battleStats,
    canBattle,
    isSearching,
    battleResult,
    isInQueue,
    findMatch,
    leaveQueue,
    createBattle
  } = useBattles(user?.id)

  // Battle state management
  const [battleState, setBattleState] = useState<BattleState>('idle')
  const [currentOpponent, setCurrentOpponent] = useState<any>(null)
  const [currentInvitationId, setCurrentInvitationId] = useState<number | null>(
    null
  )
  const [currentBattleData, setCurrentBattleData] =
    useState<CurrentBattleData | null>(null)
  const [playerActions, setPlayerActions] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState('arena')

  const {
    pendingInvitations,
    acceptInvitation,
    rejectInvitation,
    sendInvitation
  } = useBattleInvitations(user?.id)

  // Fetch current battle data
  const { data: currentBattle } = useSWR<{ data: CurrentBattleData | null }>(
    user?.id && battleState === 'battling' ? '/api/battles/current' : null,
    (url: string) => api.get(url).then(res => res.data),
    { refreshInterval: 1000 }
  )

  // Setup real-time battle events
  useBattleRealtime(user?.id, {
    onInvitationReceived: data => {
      if (battleState === 'idle') {
        setBattleState('invitation-received')
      }
    },
    onInvitationAccepted: data => {
      // Sender receives this when their invitation is accepted
      if (battleState === 'invitation-sent') {
        setBattleState('preparing')
        setCurrentBattleData(data)

        // Start countdown after a short delay
        setTimeout(() => {
          setBattleState('countdown')
        }, 1000)
      }
    },
    onInvitationRejected: _data => {
      if (battleState === 'invitation-sent') {
        setBattleState('idle')
        setCurrentOpponent(null)
        setCurrentInvitationId(null)
        // No toast - UI already shows the state change
      }
    },
    onBattleStarted: data => {
      // Accepter receives this when they accept
      if (battleState === 'invitation-received' || battleState === 'idle') {
        setBattleState('preparing')
        setCurrentBattleData(data)

        // Start countdown after a short delay
        setTimeout(() => {
          setBattleState('countdown')
        }, 1000)
      }
    },
    onBattleCompleted: data => {
      if (battleState === 'battling') {
        setBattleState('result')
        setCurrentBattleData(prev => ({
          ...prev!,
          winnerId: data.winnerId,
          feeDiscountPercent: data.feeDiscountPercent
        }))
      }
    },
    onOpponentAction: data => {
      setPlayerActions(prev => [...prev, { ...data, isOpponent: true }])
    }
  })

  // Handle finding a match
  const handleFindMatch = async (matchRange?: number) => {
    if (!canBattle) return null

    setBattleState('searching')
    const opponent = await findMatch(matchRange)

    if (opponent) {
      // Send invitation to matched opponent
      const invitation = await sendInvitation(opponent.userId)
      if (invitation) {
        setCurrentOpponent(opponent)
        setCurrentInvitationId(invitation.invitationId)
        setBattleState('invitation-sent')
      } else {
        setBattleState('idle')
      }
    } else {
      // No match found, stay in queue (no need to show anything)
      // User is already informed by the UI state
      setBattleState('idle')
    }

    return opponent
  }

  // Handle incoming battle invitations
  useEffect(() => {
    if (pendingInvitations.length > 0 && battleState === 'idle') {
      const latestInvitation = pendingInvitations[0]
      const displayName =
        latestInvitation.fromUser.name ||
        (latestInvitation.fromUser as any).email ||
        `${latestInvitation.fromUser.walletAddress?.slice(0, 6)}...${latestInvitation.fromUser.walletAddress?.slice(-4)}` ||
        'Anonymous Warrior'

      setCurrentOpponent({
        userId: latestInvitation.fromUserId,
        username: displayName,
        combatPower: latestInvitation.fromUserCP
      })
      setCurrentInvitationId(latestInvitation.id)
      setBattleState('invitation-received')
    }
  }, [pendingInvitations, battleState])

  // Handle accepting battle
  const handleAcceptBattle = async () => {
    if (!currentInvitationId) return

    setBattleState('preparing')
    const result = await acceptInvitation(currentInvitationId)

    if (result) {
      setCurrentBattleData(result)
      setCurrentInvitationId(null)

      // Start countdown
      setTimeout(() => {
        setBattleState('countdown')
      }, 1000)
    } else {
      // Invitation was invalid or expired
      setBattleState('invitation-invalid')
      setCurrentOpponent(null)
      setCurrentInvitationId(null)
    }
  }

  // Handle rejecting battle
  const handleRejectBattle = async () => {
    if (!currentInvitationId) return

    await rejectInvitation(currentInvitationId)
    setBattleState('idle')
    setCurrentOpponent(null)
    setCurrentInvitationId(null)
  }

  // Handle countdown complete
  const handleCountdownComplete = () => {
    setBattleState('battling')
  }

  // Handle battle animation complete
  const handleBattleComplete = useCallback(
    (winnerId: number) => {
      setBattleState('result')

      // The battle result is shown in the UI - no toasts needed
    },
    [user?.id, currentBattleData]
  )

  // Handle power boost from interactions
  const handlePowerBoost = (boost: number, playerNumber: 1 | 2) => {
    // Broadcast power boost to opponent
    if (user?.id) {
      api
        .post('/api/battles/action', {
          battleId: currentBattleData?.battleId,
          action: 'power-boost',
          value: boost
        })
        .catch(console.error)
    }
  }

  // Handle player action
  const handlePlayerAction = (action: string, playerNumber: 1 | 2) => {
    // Broadcast action to opponent
    if (user?.id) {
      api
        .post('/api/battles/action', {
          battleId: currentBattleData?.battleId,
          action,
          playerNumber
        })
        .catch(console.error)
    }

    setPlayerActions(prev => [
      ...prev,
      { action, playerNumber, isOpponent: false }
    ])
  }

  // Reset battle state
  const resetBattle = () => {
    setBattleState('idle')
    setCurrentOpponent(null)
    setCurrentInvitationId(null)
    setCurrentBattleData(null)
    setPlayerActions([])
  }

  const combatPower = stats?.gameData?.combatPower || 100

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Header */}
        <GamifiedHeader
          title='BATTLE ARENA'
          subtitle='Challenge opponents and earn fee discounts'
          icon={<Swords className='h-8 w-8 text-white' />}
          actions={
            activeDiscount && <DiscountTimer discount={activeDiscount} />
          }
        />

        {/* Stats Overview */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <Card className='group relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 transition-all hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs font-bold text-blue-600 uppercase dark:text-blue-400'>
                    Combat Power
                  </p>
                  <p className='text-2xl font-black'>
                    {formatNumber(combatPower)}
                  </p>
                  <p className='text-muted-foreground text-xs'>Your strength</p>
                </div>
                <Shield className='h-8 w-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='group relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 transition-all hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs font-bold text-green-600 uppercase dark:text-green-400'>
                    Win Rate
                  </p>
                  <p className='text-2xl font-black'>
                    {battleStats?.winRate.toFixed(1) || 0}%
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {battleStats?.wins || 0}W / {battleStats?.losses || 0}L
                  </p>
                </div>
                <Trophy className='h-8 w-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='group relative overflow-hidden border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10 transition-all hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs font-bold text-orange-600 uppercase dark:text-orange-400'>
                    Win Streak
                  </p>
                  <p className='text-2xl font-black'>
                    {battleHistoryStats?.currentStreak || 0}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Best: {battleHistoryStats?.bestStreak || 0}
                  </p>
                </div>
                <Flame className='h-8 w-8 text-orange-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='group relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 transition-all hover:scale-105'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs font-bold text-purple-600 uppercase dark:text-purple-400'>
                    Daily Battles
                  </p>
                  <p className='text-2xl font-black'>
                    {dailyLimit?.battlesUsed || 0}/{dailyLimit?.maxBattles || 3}
                  </p>
                  <Progress
                    value={
                      ((dailyLimit?.battlesUsed || 0) /
                        (dailyLimit?.maxBattles || 3)) *
                      100
                    }
                    className='mt-2 h-2'
                  />
                </div>
                <Calendar className='h-8 w-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className='group border-primary/20 from-primary/5 relative overflow-hidden border-2 bg-gradient-to-br to-purple-600/5 shadow-2xl'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Swords className='text-primary h-6 w-6' />
              <CardTitle className='from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-3xl font-black text-transparent'>
                WARRIOR ARENA
              </CardTitle>
              {battleState !== 'idle' && (
                <Badge className='ml-auto animate-pulse bg-gradient-to-r from-orange-500 to-red-500 text-white'>
                  {battleState.toUpperCase().replace('-', ' ')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Live Platform Stats */}
            <LiveStatsDisplay className='mb-6' compact />

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='arena' className='flex items-center gap-2'>
                  <Swords className='h-4 w-4' />
                  Battle Arena
                </TabsTrigger>
                <TabsTrigger
                  value='history'
                  className='flex items-center gap-2'
                >
                  <Trophy className='h-4 w-4' />
                  Battle History
                </TabsTrigger>
              </TabsList>

              <TabsContent value='arena' className='mt-6 space-y-6'>
                {/* Battle Interface */}
                <Card className='group border-primary/20 from-primary/10 relative overflow-hidden bg-gradient-to-br to-purple-600/10 transition-all hover:scale-[1.01]'>
                  <CardHeader>
                    <CardTitle className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-xl font-bold text-transparent'>
                      BATTLE ARENA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <AnimatePresence mode='wait'>
                      {/* Idle State - Show Matchmaking */}
                      {battleState === 'idle' && !battleResult && (
                        <motion.div
                          key='idle'
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <MatchmakingInterface
                            combatPower={combatPower}
                            canBattle={canBattle}
                            isSearching={false}
                            isInQueue={isInQueue}
                            dailyLimit={dailyLimit}
                            onFindMatch={handleFindMatch}
                            onLeaveQueue={leaveQueue}
                          />
                        </motion.div>
                      )}

                      {/* Searching State - Use original matchmaking UI */}
                      {battleState === 'searching' && (
                        <motion.div
                          key='searching'
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <MatchmakingInterface
                            combatPower={combatPower}
                            canBattle={canBattle}
                            isSearching={true}
                            isInQueue={isInQueue}
                            dailyLimit={dailyLimit}
                            onFindMatch={handleFindMatch}
                            onLeaveQueue={async () => {
                              await leaveQueue()
                              setBattleState('idle')
                            }}
                          />
                        </motion.div>
                      )}

                      {/* Invitation Sent State */}
                      {battleState === 'invitation-sent' && currentOpponent && (
                        <motion.div
                          key='invitation-sent'
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className='space-y-6'
                        >
                          <div className='text-center'>
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Swords className='mx-auto mb-4 h-16 w-16 text-orange-500' />
                            </motion.div>
                            <h3 className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-2xl font-black text-transparent'>
                              INVITATION SENT!
                            </h3>
                            <p className='text-muted-foreground mt-2'>
                              Waiting for {currentOpponent.username} to
                              accept...
                            </p>
                          </div>

                          <div className='flex justify-center'>
                            <Button
                              variant='outline'
                              onClick={() => {
                                setBattleState('idle')
                                setCurrentOpponent(null)
                                setCurrentInvitationId(null)
                              }}
                              className='border-red-500/30 hover:bg-red-500/10'
                            >
                              Cancel Invitation
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Invitation Received State */}
                      {battleState === 'invitation-received' &&
                        currentOpponent && (
                          <motion.div
                            key='invitation-received'
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className='space-y-6'
                          >
                            <div className='text-center'>
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              >
                                <Swords className='mx-auto mb-4 h-20 w-20 text-red-500' />
                              </motion.div>
                              <h3 className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-2xl font-black text-transparent'>
                                BATTLE CHALLENGE!
                              </h3>
                              <p className='text-muted-foreground mt-2'>
                                {currentOpponent.username} wants to battle you!
                              </p>
                            </div>

                            <div className='grid grid-cols-3 items-center gap-4'>
                              {/* Your Stats */}
                              <Card className='group relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10'>
                                <CardContent className='pt-6 text-center'>
                                  <User className='mx-auto mb-2 h-8 w-8 text-green-500' />
                                  <p className='font-bold text-green-600 dark:text-green-400'>
                                    YOU
                                  </p>
                                  <p className='mt-2 text-2xl font-black'>
                                    {formatNumber(combatPower)}
                                  </p>
                                  <p className='text-muted-foreground text-xs uppercase'>
                                    Combat Power
                                  </p>
                                </CardContent>
                              </Card>

                              {/* VS */}
                              <div className='text-center'>
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className='text-4xl font-black text-orange-500'
                                >
                                  VS
                                </motion.div>
                              </div>

                              {/* Opponent Stats */}
                              <Card className='group relative overflow-hidden border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10'>
                                <CardContent className='pt-6 text-center'>
                                  <User className='mx-auto mb-2 h-8 w-8 text-red-500' />
                                  <p className='font-bold text-red-600 dark:text-red-400'>
                                    {currentOpponent.username}
                                  </p>
                                  <p className='mt-2 text-2xl font-black'>
                                    {formatNumber(currentOpponent.combatPower)}
                                  </p>
                                  <p className='text-muted-foreground text-xs uppercase'>
                                    Combat Power
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            <div className='flex justify-center gap-4'>
                              <Button
                                variant='outline'
                                onClick={handleRejectBattle}
                                className='border-red-500/30 hover:bg-red-500/10'
                              >
                                Reject
                              </Button>
                              <Button
                                onClick={handleAcceptBattle}
                                className='gap-2 bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white hover:from-green-700 hover:to-emerald-800'
                              >
                                <Swords className='h-4 w-4' />
                                ACCEPT BATTLE
                              </Button>
                            </div>
                          </motion.div>
                        )}

                      {/* Invalid Invitation State */}
                      {battleState === 'invitation-invalid' && (
                        <motion.div
                          key='invitation-invalid'
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className='space-y-6'
                        >
                          <div className='text-center'>
                            <motion.div
                              animate={{ y: [0, 10, 0] }}
                              transition={{ duration: 1, repeat: 2 }}
                            >
                              <Shield className='mx-auto mb-4 h-20 w-20 text-gray-500' />
                            </motion.div>
                            <h3 className='text-2xl font-black text-gray-600 dark:text-gray-400'>
                              INVITATION EXPIRED
                            </h3>
                            <p className='text-muted-foreground mt-2'>
                              The battle invitation has expired or is no longer
                              valid.
                            </p>
                            <p className='text-muted-foreground mt-1'>
                              Search for a new opponent to battle!
                            </p>
                          </div>

                          <div className='flex justify-center'>
                            <Button
                              onClick={() => {
                                setBattleState('searching')
                                handleFindMatch()
                              }}
                              disabled={!canBattle}
                              className='gap-2 bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white hover:from-purple-700 hover:to-pink-700'
                            >
                              <Swords className='h-4 w-4' />
                              SEARCH FOR NEW OPPONENT
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Preparing State */}
                      {battleState === 'preparing' && (
                        <motion.div
                          key='preparing'
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className='py-12 text-center'
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Shield className='mx-auto mb-4 h-20 w-20 text-blue-500' />
                          </motion.div>
                          <h3 className='text-3xl font-black text-blue-600 dark:text-blue-400'>
                            PREPARING BATTLE...
                          </h3>
                          <p className='text-muted-foreground mt-2 animate-pulse'>
                            Warriors are entering the arena
                          </p>
                        </motion.div>
                      )}

                      {/* Countdown State */}
                      {battleState === 'countdown' && currentBattleData && (
                        <motion.div
                          key='countdown'
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <BattleCountdown
                            onComplete={handleCountdownComplete}
                            player1Name={user?.name || 'You'}
                            player2Name={
                              currentOpponent?.username || 'Opponent'
                            }
                            player1CP={
                              currentBattleData.isPlayer1
                                ? currentBattleData.player1.combatPower
                                : currentBattleData.player2.combatPower
                            }
                            player2CP={
                              currentBattleData.isPlayer1
                                ? currentBattleData.player2.combatPower
                                : currentBattleData.player1.combatPower
                            }
                          />
                        </motion.div>
                      )}

                      {/* Battling State with Interactions */}
                      {battleState === 'battling' && currentBattleData && (
                        <motion.div
                          key='battling'
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className='space-y-6'
                        >
                          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                            {/* Player 1 Interactions */}
                            <div className='order-2 lg:order-1'>
                              <h4 className='mb-3 text-center font-bold text-blue-600 dark:text-blue-400'>
                                YOUR CONTROLS
                              </h4>
                              <BattleInteractions
                                onPowerBoost={boost =>
                                  handlePowerBoost(boost, 1)
                                }
                                onAction={action =>
                                  handlePlayerAction(action, 1)
                                }
                                isActive={true}
                                playerNumber={1}
                              />
                            </div>

                            {/* Battle Animation */}
                            <div className='order-1 lg:order-2'>
                              <BattleAnimation
                                player1={{
                                  id: user?.id || 0,
                                  name: user?.name || 'You',
                                  combatPower: currentBattleData.isPlayer1
                                    ? currentBattleData.player1.combatPower
                                    : currentBattleData.player2.combatPower
                                }}
                                player2={{
                                  id: currentOpponent?.userId || 0,
                                  name: currentOpponent?.username || 'Opponent',
                                  combatPower: currentBattleData.isPlayer1
                                    ? currentBattleData.player2.combatPower
                                    : currentBattleData.player1.combatPower
                                }}
                                onComplete={handleBattleComplete}
                              />
                            </div>

                            {/* Opponent Status */}
                            <div className='order-3'>
                              <h4 className='mb-3 text-center font-bold text-red-600 dark:text-red-400'>
                                OPPONENT STATUS
                              </h4>
                              <BattleInteractions
                                isActive={false}
                                playerNumber={2}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Result State */}
                      {(battleState === 'result' || battleResult) && (
                        <motion.div
                          key='result'
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className='space-y-6'
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className='text-center'
                          >
                            {currentBattleData?.winnerId === user?.id ||
                            battleResult?.winnerId === user?.id ? (
                              <>
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                                  transition={{ duration: 0.5, delay: 0.2 }}
                                  className='inline-block'
                                >
                                  <Trophy className='mx-auto mb-4 h-20 w-20 text-yellow-500' />
                                </motion.div>
                                <h3 className='bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-4xl font-black text-transparent'>
                                  VICTORY!
                                </h3>
                                <Badge className='mt-3 bg-green-500/20 px-4 py-2 text-green-600 dark:text-green-400'>
                                  <Sparkles className='mr-2 h-4 w-4' />
                                  {currentBattleData?.feeDiscountPercent ||
                                    battleResult?.feeDiscountPercent ||
                                    25}
                                  % FEE DISCOUNT FOR 24 HOURS!
                                </Badge>
                                <p className='text-muted-foreground mt-2'>
                                  Congratulations, warrior! You've conquered
                                  your opponent!
                                </p>
                              </>
                            ) : (
                              <>
                                <motion.div
                                  animate={{ y: [0, 10, 0] }}
                                  transition={{ duration: 1, repeat: 2 }}
                                  className='inline-block'
                                >
                                  <Shield className='mx-auto mb-4 h-20 w-20 text-gray-500' />
                                </motion.div>
                                <h3 className='bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 bg-clip-text text-4xl font-black text-transparent'>
                                  DEFEAT
                                </h3>
                                <Badge className='mt-3 bg-blue-500/20 px-4 py-2 text-blue-600 dark:text-blue-400'>
                                  +10 XP FOR PARTICIPATING
                                </Badge>
                                <p className='text-muted-foreground mt-2'>
                                  Better luck next time, warrior! Keep training!
                                </p>
                              </>
                            )}
                          </motion.div>

                          <div className='flex justify-center'>
                            <Button
                              onClick={resetBattle}
                              disabled={!canBattle}
                              className={
                                canBattle
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white hover:from-purple-700 hover:to-pink-700'
                                  : 'cursor-not-allowed opacity-50'
                              }
                            >
                              {canBattle
                                ? 'FIND ANOTHER MATCH'
                                : 'DAILY LIMIT REACHED'}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Battle Rules */}
                <Card className='group relative overflow-hidden border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 transition-all hover:scale-[1.01]'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-xl font-bold text-transparent'>
                      <Shield className='h-5 w-5 text-yellow-500' />
                      BATTLE RULES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='group flex items-start gap-3 rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-3 transition-all hover:scale-[1.02]'>
                      <Badge className='from-primary mt-0.5 bg-gradient-to-r to-purple-600 text-white'>
                        1
                      </Badge>
                      <div>
                        <p className='font-bold uppercase'>
                          Combat Power Matching
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Opponents are matched within ±20% of your Combat Power
                        </p>
                      </div>
                    </div>
                    <div className='group flex items-start gap-3 rounded-lg border border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5 p-3 transition-all hover:scale-[1.02]'>
                      <Badge className='mt-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white'>
                        2
                      </Badge>
                      <div>
                        <p className='font-bold uppercase'>Winner Rewards</p>
                        <p className='text-muted-foreground text-sm'>
                          Winners get 25% off platform fees for 24 hours
                        </p>
                      </div>
                    </div>
                    <div className='group flex items-start gap-3 rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 p-3 transition-all hover:scale-[1.02]'>
                      <Badge className='mt-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white'>
                        3
                      </Badge>
                      <div>
                        <p className='font-bold uppercase'>Daily Limits</p>
                        <p className='text-muted-foreground text-sm'>
                          Free: 3 battles/day | Pro: 10 battles/day |
                          Enterprise: Unlimited
                        </p>
                      </div>
                    </div>
                    <div className='group flex items-start gap-3 rounded-lg border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-red-500/5 p-3 transition-all hover:scale-[1.02]'>
                      <Badge className='mt-0.5 bg-gradient-to-r from-orange-600 to-red-600 text-white'>
                        4
                      </Badge>
                      <div>
                        <p className='font-bold uppercase'>
                          Interactive Battles
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Click rapidly to boost power and use special attacks!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='history' className='mt-6'>
                <BattleHistory
                  battles={battleHistory || []}
                  userId={user?.id || 0}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
