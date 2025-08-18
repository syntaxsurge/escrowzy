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
  Plus,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react'
import useSWR from 'swr'

import { BudgetTracker } from '@/components/blocks/dashboard/client/budget-tracker'
import { HiringPipeline } from '@/components/blocks/dashboard/client/hiring-pipeline'
import { JobsOverview } from '@/components/blocks/dashboard/client/jobs-overview'
import { MilestoneTracker } from '@/components/blocks/dashboard/client/milestone-tracker'
import { SpendingAnalytics } from '@/components/blocks/dashboard/client/spending-analytics'
import { TeamCollaboration } from '@/components/blocks/dashboard/client/team-collaboration'
import { VendorManagement } from '@/components/blocks/dashboard/client/vendor-management'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'

interface ClientDashboardData {
  overview: {
    activeJobs: number
    totalSpent: number
    avgProjectCost: number
    totalHires: number
    pendingPayments: number
    inProgressMilestones: number
    completedProjects: number
    avgCompletionTime: number
  }
  jobs: {
    posted: Array<{
      id: number
      title: string
      status: string
      category: string
      budget: string
      proposalsCount: number
      createdAt: Date
      deadline: Date | null
    }>
    active: Array<{
      id: number
      title: string
      freelancerName: string
      freelancerId: number
      progress: number
      nextMilestone: string | null
      nextMilestoneDate: Date | null
      totalBudget: string
    }>
  }
  milestones: {
    upcoming: Array<{
      id: number
      jobId: number
      jobTitle: string
      title: string
      amount: string
      dueDate: Date | null
      status: string
      freelancerName: string
    }>
    stats: {
      total: number
      pending: number
      inProgress: number
      submitted: number
      approved: number
      disputed: number
    }
  }
  freelancers: {
    active: Array<{
      id: number
      name: string
      title: string | null
      activeJobs: number
      totalPaid: number
      avgRating: number
      completionRate: number
    }>
    topPerformers: Array<{
      id: number
      name: string
      title: string | null
      completedJobs: number
      totalEarned: number
      avgRating: number
      specialties: string[]
    }>
  }
  spending: {
    monthly: Array<{
      month: string
      amount: number
      projectCount: number
    }>
    byCategory: Array<{
      category: string
      amount: number
      percentage: number
    }>
    projections: {
      currentMonth: number
      nextMonth: number
      quarterEstimate: number
    }
  }
  applications: {
    recent: Array<{
      id: number
      jobId: number
      jobTitle: string
      freelancerId: number
      freelancerName: string
      bidAmount: string
      proposalText: string
      deliveryDays: number
      status: string
      createdAt: Date
    }>
    stats: {
      total: number
      pending: number
      shortlisted: number
      hired: number
    }
  }
  teamActivity: {
    recentActions: Array<{
      type: string
      description: string
      actor: string
      timestamp: Date
    }>
    memberStats: Array<{
      id: number
      name: string
      role: string
      activeProjects: number
      totalManaged: number
    }>
  }
}

export default function ClientDashboardPage() {
  const { user, isLoading: userLoading } = useSession()
  const [selectedTab, setSelectedTab] = useState('overview')

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dataLoading } =
    useSWR<ClientDashboardData>(
      user ? `/api/client/${user.id}/dashboard` : null,
      async (url: string) => {
        const response = await api.get(url)
        return response.success ? response.data : null
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
        className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 p-8 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30'
      >
        <div className='relative z-10'>
          <h1 className='mb-2 text-3xl font-bold text-gray-900 dark:text-white'>
            {greeting}, {user.name || 'Client'}!
          </h1>
          <p className='text-muted-foreground mb-4'>
            Manage your projects and team from one place
          </p>

          {/* Quick Stats Badges */}
          <div className='flex flex-wrap items-center gap-3'>
            <Badge
              variant='outline'
              className='border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300'
            >
              <Briefcase className='mr-1 h-3 w-3' />
              {dashboardData.overview.activeJobs} Active Jobs
            </Badge>
            <Badge
              variant='outline'
              className='border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
            >
              <Users className='mr-1 h-3 w-3' />
              {dashboardData.overview.totalHires} Freelancers
            </Badge>
            <Badge
              variant='outline'
              className='border-purple-500/50 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300'
            >
              <TrendingUp className='mr-1 h-3 w-3' />
              {dashboardData.overview.completedProjects} Completed
            </Badge>
            {dashboardData.overview.pendingPayments > 0 && (
              <Badge
                variant='outline'
                className='border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300'
              >
                <Clock className='mr-1 h-3 w-3' />$
                {dashboardData.overview.pendingPayments.toFixed(2)} Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Background decoration */}
        <div className='absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl' />
        <div className='absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl' />
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
              <CardTitle className='text-sm font-medium'>Total Spent</CardTitle>
              <DollarSign className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${dashboardData.overview.totalSpent.toFixed(2)}
              </div>
              <p className='text-muted-foreground text-xs'>
                Avg ${dashboardData.overview.avgProjectCost.toFixed(2)}/project
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
                {dashboardData.overview.activeJobs}
              </div>
              <p className='text-muted-foreground text-xs'>
                {dashboardData.milestones.stats.inProgress} milestones in
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
                Pending Reviews
              </CardTitle>
              <FileText className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData.milestones.stats.submitted}
              </div>
              <p className='text-muted-foreground text-xs'>
                Milestones awaiting approval
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
                Success Rate
              </CardTitle>
              <Activity className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {dashboardData.overview.completedProjects > 0
                  ? Math.round(
                      (dashboardData.overview.completedProjects /
                        (dashboardData.overview.completedProjects +
                          dashboardData.overview.activeJobs)) *
                        100
                    )
                  : 0}
                %
              </div>
              <Progress
                value={
                  dashboardData.overview.completedProjects > 0
                    ? (dashboardData.overview.completedProjects /
                        (dashboardData.overview.completedProjects +
                          dashboardData.overview.activeJobs)) *
                      100
                    : 0
                }
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
          <TabsTrigger value='milestones'>Milestones</TabsTrigger>
          <TabsTrigger value='hiring'>Hiring</TabsTrigger>
          <TabsTrigger value='team'>Team</TabsTrigger>
          <TabsTrigger value='spending'>Analytics</TabsTrigger>
          <TabsTrigger value='vendors'>Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-2'>
            {/* Jobs Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <JobsOverview
                postedJobs={dashboardData.jobs.posted}
                activeJobs={dashboardData.jobs.active}
              />
            </motion.div>

            {/* Milestone Tracker */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MilestoneTracker
                milestones={dashboardData.milestones.upcoming}
                stats={dashboardData.milestones.stats}
              />
            </motion.div>
          </div>

          {/* Recent Applications */}
          {dashboardData.applications.recent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    Recent Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboardData.applications.recent.slice(0, 5).map(app => (
                      <div
                        key={app.id}
                        className='flex items-center justify-between rounded-lg border p-3'
                      >
                        <div>
                          <p className='font-medium'>{app.freelancerName}</p>
                          <p className='text-muted-foreground text-sm'>
                            {app.jobTitle}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-bold'>${app.bidAmount}</p>
                          <Badge
                            variant={
                              app.status === 'pending'
                                ? 'secondary'
                                : app.status === 'shortlisted'
                                  ? 'default'
                                  : app.status === 'accepted'
                                    ? 'success'
                                    : 'destructive'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Budget Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <BudgetTracker
              totalSpent={dashboardData.overview.totalSpent}
              pendingPayments={dashboardData.overview.pendingPayments}
              monthlySpending={dashboardData.spending.monthly}
              projections={dashboardData.spending.projections}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value='jobs' className='space-y-4'>
          <JobsOverview
            postedJobs={dashboardData.jobs.posted}
            activeJobs={dashboardData.jobs.active}
            detailed
          />
        </TabsContent>

        <TabsContent value='milestones' className='space-y-4'>
          <MilestoneTracker
            milestones={dashboardData.milestones.upcoming}
            stats={dashboardData.milestones.stats}
            detailed
            clientId={user.id}
          />
        </TabsContent>

        <TabsContent value='hiring' className='space-y-4'>
          <HiringPipeline
            applications={dashboardData.applications}
            clientId={user.id}
          />
        </TabsContent>

        <TabsContent value='team' className='space-y-4'>
          <TeamCollaboration
            teamActivity={dashboardData.teamActivity}
            memberStats={dashboardData.teamActivity.memberStats}
            clientId={user.id}
          />
        </TabsContent>

        <TabsContent value='spending' className='space-y-4'>
          <SpendingAnalytics
            spending={dashboardData.spending}
            overview={dashboardData.overview}
            clientId={user.id}
          />
        </TabsContent>

        <TabsContent value='vendors' className='space-y-4'>
          <VendorManagement
            freelancers={dashboardData.freelancers}
            clientId={user.id}
          />
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
                <Link href='/trades/listings/create/service'>
                  <Plus className='mr-2 h-4 w-4' />
                  Post New Job
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={appRoutes.trades.jobs.base}>
                  Browse Freelancers
                  <ChevronRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href='/dashboard/client/invoices'>
                  <Wallet className='mr-2 h-4 w-4' />
                  Invoices
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
