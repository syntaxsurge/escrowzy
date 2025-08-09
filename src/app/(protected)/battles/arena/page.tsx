'use client'

import { useState, useEffect } from 'react'

import { motion } from 'framer-motion'
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

import { GamifiedHeader } from '@/components/blocks/trading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBattleInvitations } from '@/hooks/use-battle-invitations'
import { useBattles } from '@/hooks/use-battles'
import { useRewards } from '@/hooks/use-rewards'
import { useSession } from '@/hooks/use-session'
import { formatNumber } from '@/lib/utils/string'

import { BattleAnimation } from './battle-animation'
import { BattleHistory } from './battle-history'
import { DiscountTimer } from './discount-timer'
import { MatchmakingInterface } from './matchmaking-interface'

export default function BattleArenaPage() {
  const { user } = useSession()
  const { stats } = useRewards(user?.id)
  const {
    activeDiscount,
    battleHistory,
    dailyLimit,
    battleStats,
    canBattle,
    isSearching,
    isBattling,
    battleResult,
    isInQueue,
    findMatch,
    leaveQueue
  } = useBattles(user?.id)

  const [selectedTab, setSelectedTab] = useState('arena')
  const [currentOpponent, setCurrentOpponent] = useState<any>(null)
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [currentInvitationId, setCurrentInvitationId] = useState<number | null>(
    null
  )

  const {
    pendingInvitations,
    acceptInvitation,
    rejectInvitation,
    sendInvitation
  } = useBattleInvitations(user?.id)

  // Fetch live battle stats
  const { data: liveStats } = useSWR(
    '/api/battles/live-stats',
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 5000 }
  )

  const handleFindMatch = async (matchRange?: number) => {
    if (!canBattle) return null
    const opponent = await findMatch(matchRange)
    if (opponent) {
      // Send invitation to matched opponent
      const invitation = await sendInvitation(opponent.userId)
      if (invitation) {
        setCurrentOpponent(opponent)
        setCurrentInvitationId(invitation.invitationId)
        setWaitingForResponse(true)
      }
    }
    return opponent
  }

  // Handle incoming battle invitations
  useEffect(() => {
    if (pendingInvitations.length > 0 && !currentOpponent && !isBattling) {
      const latestInvitation = pendingInvitations[0]
      setCurrentOpponent({
        userId: latestInvitation.fromUserId,
        username: latestInvitation.fromUser.name,
        combatPower: latestInvitation.fromUserCP
      })
      setCurrentInvitationId(latestInvitation.id)
      setWaitingForResponse(false)
    }
  }, [pendingInvitations, currentOpponent, isBattling])

  const handleAcceptBattle = async () => {
    if (!currentInvitationId) return
    const result = await acceptInvitation(currentInvitationId)
    if (result) {
      setWaitingForResponse(false)
      setCurrentInvitationId(null)
      // Battle will start automatically
    }
  }

  const handleRejectBattle = async () => {
    if (!currentInvitationId) return
    await rejectInvitation(currentInvitationId)
    setCurrentOpponent(null)
    setWaitingForResponse(false)
    setCurrentInvitationId(null)
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
                    {battleHistory?.currentStreak || 0}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Best: {battleHistory?.bestStreak || 0}
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
            </div>
          </CardHeader>
          <CardContent>
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
                {/* Live Platform Stats */}
                <div className='grid grid-cols-3 gap-4'>
                  <Card className='group relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10'>
                    <CardContent className='p-4 text-center'>
                      <User className='mx-auto mb-2 h-6 w-6 text-blue-500' />
                      <p className='text-2xl font-bold text-blue-500'>
                        {liveStats?.data?.warriorsOnline || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Warriors Online
                      </p>
                    </CardContent>
                  </Card>

                  <Card className='group relative overflow-hidden border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10'>
                    <CardContent className='p-4 text-center'>
                      <Swords className='mx-auto mb-2 h-6 w-6 text-green-500' />
                      <p className='text-2xl font-bold text-green-500'>
                        {liveStats?.data?.activeBattles || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Active Battles
                      </p>
                    </CardContent>
                  </Card>

                  <Card className='group relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10'>
                    <CardContent className='p-4 text-center'>
                      <Flame className='mx-auto mb-2 h-6 w-6 text-purple-500' />
                      <p className='text-2xl font-bold text-purple-500'>
                        {liveStats?.data?.inQueue || 0}
                      </p>
                      <p className='text-muted-foreground text-xs'>In Queue</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Battle Interface */}
                <Card className='group border-primary/20 from-primary/10 relative overflow-hidden bg-gradient-to-br to-purple-600/10 transition-all hover:scale-[1.01]'>
                  <CardHeader>
                    <CardTitle className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-xl font-bold text-transparent'>
                      BATTLE ARENA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {!currentOpponent && !battleResult && (
                      <MatchmakingInterface
                        combatPower={combatPower}
                        canBattle={canBattle}
                        isSearching={isSearching}
                        isInQueue={isInQueue}
                        dailyLimit={dailyLimit}
                        onFindMatch={handleFindMatch}
                        onLeaveQueue={leaveQueue}
                      />
                    )}

                    {currentOpponent && !battleResult && !isBattling && (
                      <div className='space-y-6'>
                        <div className='text-center'>
                          <h3 className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-2xl font-black text-transparent'>
                            {waitingForResponse
                              ? 'INVITATION SENT!'
                              : 'BATTLE CHALLENGE!'}
                          </h3>
                          <p className='text-muted-foreground mt-2'>
                            {waitingForResponse
                              ? 'Waiting for opponent to accept...'
                              : `${currentOpponent.username} wants to battle you!`}
                          </p>
                        </div>

                        <div className='grid grid-cols-3 items-center gap-4'>
                          {/* Your Stats */}
                          <Card className='group relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 transition-all hover:scale-105'>
                            <CardContent className='pt-6 text-center'>
                              <div className='from-primary relative mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br to-purple-600'>
                                <User className='h-6 w-6 text-white' />
                              </div>
                              <p className='font-bold text-green-600 dark:text-green-400'>
                                YOU
                              </p>
                              <p className='mt-2 text-3xl font-black'>
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
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 200 }}
                              className='from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-5xl font-black text-transparent'
                            >
                              VS
                            </motion.div>
                          </div>

                          {/* Opponent Stats */}
                          <Card className='group relative overflow-hidden border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 transition-all hover:scale-105'>
                            <CardContent className='pt-6 text-center'>
                              <div className='relative mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-600'>
                                <User className='h-6 w-6 text-white' />
                              </div>
                              <p className='font-bold text-red-600 uppercase dark:text-red-400'>
                                {currentOpponent.username}
                              </p>
                              <p className='mt-2 text-3xl font-black'>
                                {formatNumber(currentOpponent.combatPower)}
                              </p>
                              <p className='text-muted-foreground text-xs uppercase'>
                                Combat Power
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className='flex justify-center gap-4'>
                          {waitingForResponse ? (
                            <Button
                              variant='outline'
                              onClick={() => {
                                setCurrentOpponent(null)
                                setWaitingForResponse(false)
                                setCurrentInvitationId(null)
                              }}
                              className='border-red-500/30 hover:bg-red-500/10'
                            >
                              Cancel Invitation
                            </Button>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {isBattling && (
                      <BattleAnimation
                        player1={{
                          id: user?.id || 0,
                          name: user?.name || 'You',
                          combatPower: combatPower
                        }}
                        player2={{
                          id: currentOpponent?.userId || 0,
                          name: currentOpponent?.username || 'Opponent',
                          combatPower: currentOpponent?.combatPower || 100
                        }}
                      />
                    )}

                    {battleResult && (
                      <div className='space-y-6'>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                          className='text-center'
                        >
                          {battleResult.winnerId === user?.id ? (
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
                                {battleResult.feeDiscountPercent}% FEE DISCOUNT
                                FOR 24 HOURS!
                              </Badge>
                              <p className='text-muted-foreground mt-2'>
                                Congratulations, warrior! You've conquered your
                                opponent!
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
                            onClick={() => {
                              setCurrentOpponent(null)
                              // Note: battleResult is set via the hook
                            }}
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
                      </div>
                    )}
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
                        <p className='font-bold uppercase'>Opponent Cooldown</p>
                        <p className='text-muted-foreground text-sm'>
                          Cannot battle the same opponent twice within 24 hours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='history' className='mt-6'>
                <BattleHistory
                  battles={battleHistory?.battles || []}
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
