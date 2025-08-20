'use client'

import { useState, useEffect } from 'react'

import {
  Copy,
  Users,
  TrendingUp,
  DollarSign,
  Share2,
  Trophy,
  Gift,
  Link2,
  Calendar,
  Target
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  totalEarnings: string
  pendingEarnings: string
  conversionRate: number
  totalClicks: number
  lifetimeValue: string
  currentTier: string
  nextTierProgress: number
}

interface ReferralLink {
  id: number
  code: string
  clicks: number
  conversions: number
  campaignSource?: string
  createdAt: Date
}

interface Referral {
  id: number
  referredUser: string
  status: 'pending' | 'active' | 'expired'
  joinedAt: Date
  earnings: string
  trades: number
}

interface LeaderboardEntry {
  rank: number
  userId: number
  username: string
  referralCount: number
  totalEarnings: string
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [newLinkSource, setNewLinkSource] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [loading, setLoading] = useState(true)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://escrowzy.com'

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      // Fetch stats
      const statsResult = await api.get(apiEndpoints.referrals.stats, {
        shouldShowErrorToast: false
      })
      if (statsResult.success) {
        setStats(statsResult.data)
      }

      // Fetch leaderboard
      const leaderboardResult = await api.get(
        '/api/referrals/stats?type=leaderboard',
        { shouldShowErrorToast: false }
      )
      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.data)
      }

      // Mock referral links and referrals for now
      setReferralLinks([
        {
          id: 1,
          code: 'ESCROW2024',
          clicks: 245,
          conversions: 12,
          campaignSource: 'twitter',
          createdAt: new Date('2024-01-15')
        },
        {
          id: 2,
          code: 'CRYPTO10',
          clicks: 189,
          conversions: 8,
          campaignSource: 'discord',
          createdAt: new Date('2024-02-01')
        }
      ])

      setReferrals([
        {
          id: 1,
          referredUser: '0x1234...5678',
          status: 'active',
          joinedAt: new Date('2024-01-20'),
          earnings: '125.50',
          trades: 15
        },
        {
          id: 2,
          referredUser: '0xabcd...efgh',
          status: 'active',
          joinedAt: new Date('2024-02-05'),
          earnings: '89.25',
          trades: 8
        }
      ])
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReferralLink = async () => {
    try {
      const result = await api.post(
        apiEndpoints.referrals.generate,
        {
          campaignSource: newLinkSource || undefined,
          customSlug: customSlug || undefined
        },
        {
          shouldShowErrorToast: false,
          successMessage: 'Referral link generated successfully!'
        }
      )

      if (result.success) {
        setReferralLinks(prev => [...prev, result.data.link])
        setNewLinkSource('')
        setCustomSlug('')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to generate referral link:', error)
      toast.error('Failed to generate referral link')
    }
  }

  const copyToClipboard = (code: string) => {
    const fullUrl = `${baseUrl}/ref/${code}`
    navigator.clipboard.writeText(fullUrl)
    toast.success('Link copied to clipboard!')
  }

  const shareOnSocial = (platform: string, code: string) => {
    const fullUrl = `${baseUrl}/ref/${code}`
    const message =
      'Join me on Escrowzy - the most secure cryptocurrency escrow platform!'

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(fullUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(message)}`
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank')
    }
  }

  if (loading) {
    return <div className='container mx-auto px-4 py-8'>Loading...</div>
  }

  const mockStats: ReferralStats = stats || {
    totalReferrals: 20,
    activeReferrals: 12,
    totalEarnings: '1,245.75',
    pendingEarnings: '325.50',
    conversionRate: 15.5,
    totalClicks: 434,
    lifetimeValue: '2,567.90',
    currentTier: 'Gold',
    nextTierProgress: 65
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='mb-4 text-4xl font-bold'>Referral Program</h1>
        <p className='text-muted-foreground text-xl'>
          Earn rewards by inviting friends to join Escrowzy
        </p>
      </div>

      {/* Stats Overview */}
      <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Total Referrals</p>
                <p className='text-2xl font-bold'>{mockStats.totalReferrals}</p>
                <p className='text-xs text-green-500'>+3 this month</p>
              </div>
              <Users className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Total Earnings</p>
                <p className='text-2xl font-bold'>${mockStats.totalEarnings}</p>
                <p className='text-xs text-green-500'>+$125 this month</p>
              </div>
              <DollarSign className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Conversion Rate</p>
                <p className='text-2xl font-bold'>
                  {mockStats.conversionRate}%
                </p>
                <p className='text-xs text-green-500'>+2.3% vs last month</p>
              </div>
              <TrendingUp className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Current Tier</p>
                <p className='text-2xl font-bold'>{mockStats.currentTier}</p>
                <Progress value={mockStats.nextTierProgress} className='mt-2' />
              </div>
              <Trophy className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='links' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='links'>My Links</TabsTrigger>
          <TabsTrigger value='referrals'>Referrals</TabsTrigger>
          <TabsTrigger value='rewards'>Rewards</TabsTrigger>
          <TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
        </TabsList>

        {/* My Links Tab */}
        <TabsContent value='links' className='space-y-4'>
          {/* Generate New Link */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Referral Link</CardTitle>
              <CardDescription>
                Create a custom referral link to track your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div>
                  <Label htmlFor='source'>Campaign Source (Optional)</Label>
                  <Input
                    id='source'
                    placeholder='e.g., twitter, youtube'
                    value={newLinkSource}
                    onChange={e => setNewLinkSource(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='slug'>Custom Code (Optional)</Label>
                  <Input
                    id='slug'
                    placeholder='e.g., CRYPTO2024'
                    value={customSlug}
                    onChange={e => setCustomSlug(e.target.value)}
                  />
                </div>
                <div className='flex items-end'>
                  <Button onClick={generateReferralLink} className='w-full'>
                    <Link2 className='mr-2 h-4 w-4' />
                    Generate Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Links */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Links</CardTitle>
              <CardDescription>
                Manage and track your referral links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {referralLinks.map(link => (
                  <div key={link.id} className='rounded-lg border p-4'>
                    <div className='mb-2 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='bg-muted rounded px-2 py-1 font-mono text-sm'>
                          {baseUrl}/ref/{link.code}
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => copyToClipboard(link.code)}
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                      {link.campaignSource && (
                        <Badge variant='outline'>{link.campaignSource}</Badge>
                      )}
                    </div>

                    <div className='text-muted-foreground flex items-center gap-6 text-sm'>
                      <span>{link.clicks} clicks</span>
                      <span>{link.conversions} conversions</span>
                      <span>
                        {((link.conversions / link.clicks) * 100).toFixed(1)}%
                        conversion
                      </span>
                    </div>

                    <div className='mt-3 flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => shareOnSocial('twitter', link.code)}
                      >
                        Twitter
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => shareOnSocial('telegram', link.code)}
                      >
                        Telegram
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => shareOnSocial('facebook', link.code)}
                      >
                        Facebook
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value='referrals'>
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                Track your referred users and their activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Your Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map(referral => (
                    <TableRow key={referral.id}>
                      <TableCell className='font-mono'>
                        {referral.referredUser}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            referral.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {referral.joinedAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>{referral.trades}</TableCell>
                      <TableCell className='font-semibold'>
                        ${referral.earnings}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value='rewards'>
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Referral Tiers</CardTitle>
                <CardDescription>
                  Unlock higher rewards as you refer more users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      tier: 'Bronze',
                      referrals: '0-5',
                      commission: '10%',
                      current: false
                    },
                    {
                      tier: 'Silver',
                      referrals: '6-15',
                      commission: '15%',
                      current: false
                    },
                    {
                      tier: 'Gold',
                      referrals: '16-30',
                      commission: '20%',
                      current: true
                    },
                    {
                      tier: 'Platinum',
                      referrals: '31+',
                      commission: '25%',
                      current: false
                    }
                  ].map(tier => (
                    <div
                      key={tier.tier}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        tier.current ? 'bg-primary/5 border-primary' : ''
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <Trophy
                          className={`h-5 w-5 ${tier.current ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <div>
                          <p className='font-semibold'>{tier.tier}</p>
                          <p className='text-muted-foreground text-sm'>
                            {tier.referrals} referrals
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold'>{tier.commission}</p>
                        <p className='text-muted-foreground text-sm'>
                          commission
                        </p>
                      </div>
                      {tier.current && <Badge className='ml-4'>Current</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bonus Rewards</CardTitle>
                <CardDescription>
                  Earn extra rewards for achieving milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Gift className='h-4 w-4 text-purple-500' />
                      <span>First 10 Referrals</span>
                    </div>
                    <Badge variant='outline'>$100 Bonus</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Target className='h-4 w-4 text-blue-500' />
                      <span>Monthly Top Referrer</span>
                    </div>
                    <Badge variant='outline'>$500 Prize</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-green-500' />
                      <span>100 Total Referrals</span>
                    </div>
                    <Badge variant='outline'>Lifetime Premium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value='leaderboard'>
          <Card>
            <CardHeader>
              <CardTitle>Referral Leaderboard</CardTitle>
              <CardDescription>
                See how you rank against other referrers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-16'>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Total Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map(entry => (
                    <TableRow key={entry.userId}>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          {entry.rank <= 3 && (
                            <Trophy
                              className={`h-4 w-4 ${
                                entry.rank === 1
                                  ? 'text-yellow-500'
                                  : entry.rank === 2
                                    ? 'text-gray-400'
                                    : 'text-orange-500'
                              }`}
                            />
                          )}
                          {entry.rank}
                        </div>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {entry.username}
                      </TableCell>
                      <TableCell>{entry.referralCount}</TableCell>
                      <TableCell className='font-semibold'>
                        ${entry.totalEarnings}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA Card */}
      <Card className='from-primary/10 to-primary/5 mt-8 bg-gradient-to-r'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='mb-1 text-lg font-semibold'>
                Invite friends and earn together!
              </h3>
              <p className='text-muted-foreground'>
                Get up to 25% commission on every trade your referrals make
              </p>
            </div>
            <Button size='lg'>
              <Share2 className='mr-2 h-4 w-4' />
              Share Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
