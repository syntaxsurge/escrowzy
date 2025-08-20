'use client'

import Link from 'next/link'
import { useState } from 'react'

import { motion } from 'framer-motion'
import {
  Activity,
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Medal,
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import useSWR from 'swr'

import { ActiveJobsTracker } from '@/components/blocks/dashboard/freelancer/active-jobs-tracker'
import { AnalyticsCharts } from '@/components/blocks/dashboard/freelancer/analytics-charts'
import { EarningsWidget } from '@/components/blocks/dashboard/freelancer/earnings-widget'
import { GoalTracker } from '@/components/blocks/dashboard/freelancer/goal-tracker'
import { GrowthRecommendations } from '@/components/blocks/dashboard/freelancer/growth-recommendations'
import { JobArchives } from '@/components/blocks/dashboard/freelancer/job-archives'
import { JobTemplates } from '@/components/blocks/dashboard/freelancer/job-templates'
import { MilestoneCalendar } from '@/components/blocks/dashboard/freelancer/milestone-calendar'
import { PerformanceChart } from '@/components/blocks/dashboard/freelancer/performance-chart'
import { ProposalMetrics } from '@/components/blocks/dashboard/freelancer/proposal-metrics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'

interface DashboardData {
  profile: {
    id: number
    userId: number
    professionalTitle: string | null
    availability: string
    avgRating: number
    completionRate: number
    totalJobs: number
    verificationStatus: string
  }
  earnings: {
    summary: {
      totalEarnings: number
      availableBalance: number
      pendingEarnings: number
      withdrawnAmount: number
      platformFees: number
      netEarnings: number
    }
    statistics: {
      currentMonthEarnings: number
      previousMonthEarnings: number
      growthRate: number
      averageProjectValue: number
      totalProjects: number
    }
    recentEarnings: Array<{
      period: string
      amount: number
      count: number
      netAmount: number
    }>
    upcomingPayments: Array<{
      milestoneTitle: string
      jobTitle: string
      amount: string
      dueDate: Date | null
      status: string
    }>
  }
  jobs: {
    active: Array<{
      id: number
      title: string
      status: string
      clientName: string
      totalMilestones: number
      completedMilestones: number
      nextMilestone: string | null
      nextMilestoneDate: Date | null
    }>
    completionRate: number
    milestoneStats: {
      total: number
      pending: number
      inProgress: number
      submitted: number
      approved: number
      disputed: number
    }
  }
  proposals: {
    recent: Array<{
      id: number
      jobId: number
      jobTitle: string
      bidAmount: string
      status: string
      createdAt: Date
      clientName: string
    }>
    stats: {
      total: number
      pending: number
      shortlisted: number
      accepted: number
      rejected: number
      conversionRate: number
    }
  }
  reviews: {
    recent: Array<{
      id: number
      rating: number
      reviewText: string
      clientName: string
      createdAt: Date
    }>
    avgRating: number
    totalReviews: number
  }
  performance: {
    completionRate: number
    responseTime: number | null
    uniqueClients: number
    repeatClients: number
  }
  quickStats: {
    totalEarnings: number
    availableBalance: number
    activeJobs: number
    pendingProposals: number
    monthlyGrowth: number
  }
}

export default function FreelancerDashboardPage() {
  const { user, isLoading: userLoading } = useSession()
  const [selectedTab, setSelectedTab] = useState('overview')

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dataLoading,
    error
  } = useSWR<DashboardData>(
    user ? apiEndpoints.freelancers.dashboard(user.id) : null,
    async (url: string) => {
      const response = await api.get(url)
      if (!response.success) {
        throw new Error(response.error || 'Failed to load dashboard')
      }
      // API now returns data directly, apiClient wraps it properly
      return response.data
    },
    {
      refreshInterval: 60000 // Refresh every minute
    }
  )

  // Loading state
  if (userLoading || dataLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
          <p className='text-muted-foreground'>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Handle profile not found error or missing profile data
  if (
    error?.message?.includes('profile not found') ||
    (!dashboardData && !dataLoading && user) ||
    (dashboardData && !dashboardData.profile)
  ) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-center'>
          <h2 className='mb-2 text-2xl font-bold'>
            Freelancer Profile Not Found
          </h2>
          <p className='text-muted-foreground mb-6'>
            You haven't set up your freelancer profile yet. Create one to access
            your dashboard.
          </p>
          <Button asChild>
            <Link href={appRoutes.profile.freelancer.setup}>
              Set Up Freelancer Profile
              <ChevronRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!user || !dashboardData) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-center'>
          <h2 className='mb-2 text-2xl font-bold'>No data available</h2>
          <p className='text-muted-foreground mb-4'>
            Unable to load dashboard data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    )
  }

  const currentTime = new Date().getHours()
  const greeting =
    currentTime < 12
      ? 'Good morning'
      : currentTime < 17
        ? 'Good afternoon'
        : 'Good evening'

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-8 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30'
      >
        <div className='relative z-10'>
          <h1 className='mb-2 text-3xl font-bold text-gray-900 dark:text-white'>
            {greeting}, {user.name || 'Freelancer'}!
          </h1>
          <p className='text-muted-foreground mb-4'>
            {dashboardData?.profile?.professionalTitle ||
              'Welcome to your dashboard'}
          </p>

          {/* Quick Stats Badges */}
          <div className='flex flex-wrap items-center gap-3'>
            <Badge
              variant='outline'
              className='border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300'
            >
              <Medal className='mr-1 h-3 w-3' />
              {dashboardData?.profile?.availability === 'available'
                ? 'Available'
                : dashboardData?.profile?.availability === 'busy'
                  ? 'Busy'
                  : 'Away'}
            </Badge>
            <Badge
              variant='outline'
              className='border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
            >
              <TrendingUp className='mr-1 h-3 w-3' />
              {dashboardData.quickStats.monthlyGrowth > 0 ? '+' : ''}
              {dashboardData.quickStats.monthlyGrowth.toFixed(1)}% this month
            </Badge>
            {dashboardData.performance.repeatClients > 0 && (
              <Badge
                variant='outline'
                className='border-purple-500/50 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300'
              >
                <Users className='mr-1 h-3 w-3' />
                {dashboardData.performance.repeatClients} repeat clients
              </Badge>
            )}
            {dashboardData?.profile?.verificationStatus === 'verified' && (
              <Badge
                variant='outline'
                className='border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300'
              >
                <Zap className='mr-1 h-3 w-3' />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Background decoration */}
        <div className='absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl' />
        <div className='absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl' />
      </motion.div>

      {/* Quick Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Available Balance
              </CardTitle>
              <DollarSign className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${dashboardData.quickStats.availableBalance.toFixed(2)}
              </div>
              <p className='text-muted-foreground text-xs'>
                ${dashboardData.earnings.summary.pendingEarnings.toFixed(2)}{' '}
                pending
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active Jobs</CardTitle>
              <Briefcase className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData.quickStats.activeJobs}
              </div>
              <p className='text-muted-foreground text-xs'>
                {dashboardData.jobs.milestoneStats.inProgress} milestones in
                progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Pending Proposals
              </CardTitle>
              <FileText className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData.quickStats.pendingProposals}
              </div>
              <p className='text-muted-foreground text-xs'>
                {dashboardData.proposals.stats.conversionRate}% success rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className='relative overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Completion Rate
              </CardTitle>
              <Target className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData.jobs.completionRate}%
              </div>
              <Progress
                value={dashboardData.jobs.completionRate}
                className='mt-2'
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Dashboard Content */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className='space-y-4'
      >
        <TabsList className='grid w-full grid-cols-7'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='jobs'>Jobs</TabsTrigger>
          <TabsTrigger value='earnings'>Earnings</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='goals'>Goals</TabsTrigger>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='archives'>Archives</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-2'>
            {/* Earnings Widget */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <EarningsWidget
                summary={dashboardData.earnings.summary}
                statistics={dashboardData.earnings.statistics}
                recentEarnings={dashboardData.earnings.recentEarnings}
              />
            </motion.div>

            {/* Proposal Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ProposalMetrics
                stats={dashboardData.proposals.stats}
                recentProposals={dashboardData.proposals.recent}
              />
            </motion.div>
          </div>

          {/* Active Jobs Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ActiveJobsTracker
              jobs={dashboardData.jobs.active}
              milestoneStats={dashboardData.jobs.milestoneStats}
            />
          </motion.div>

          {/* Upcoming Payments */}
          {dashboardData.earnings.upcomingPayments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    Upcoming Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboardData.earnings.upcomingPayments.map(
                      (payment, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded-lg border p-3'
                        >
                          <div>
                            <p className='font-medium'>
                              {payment.milestoneTitle}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              {payment.jobTitle}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-bold'>${payment.amount}</p>
                            {payment.dueDate && (
                              <p className='text-muted-foreground text-xs'>
                                Due{' '}
                                {new Date(payment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value='jobs' className='space-y-4'>
          <ActiveJobsTracker
            jobs={dashboardData.jobs.active}
            milestoneStats={dashboardData.jobs.milestoneStats}
            detailed
          />
          <MilestoneCalendar freelancerId={user.id} />
        </TabsContent>

        <TabsContent value='earnings' className='space-y-4'>
          <EarningsWidget
            summary={dashboardData.earnings.summary}
            statistics={dashboardData.earnings.statistics}
            recentEarnings={dashboardData.earnings.recentEarnings}
            detailed
          />
          <PerformanceChart freelancerId={user.id} />
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <GrowthRecommendations freelancerId={user.id} />
          <AnalyticsCharts freelancerId={user.id} />
        </TabsContent>

        <TabsContent value='goals' className='space-y-4'>
          <GoalTracker freelancerId={user.id} />
        </TabsContent>

        <TabsContent value='templates' className='space-y-4'>
          <JobTemplates freelancerId={user.id} />
        </TabsContent>

        <TabsContent value='archives' className='space-y-4'>
          <JobArchives freelancerId={user.id} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Button variant='outline' asChild>
                <Link href={appRoutes.trades.jobs.base}>
                  Browse Jobs
                  <ChevronRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={appRoutes.dashboard.freelancerBids}>
                  My Proposals
                  <ChevronRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={appRoutes.profile.freelancer.base}>
                  Edit Profile
                  <ChevronRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={appRoutes.dashboard.settings.base}>
                  Settings
                  <ChevronRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
