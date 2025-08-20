'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
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
import { appRoutes } from '@/config/app-routes'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/string'

interface JobPosting {
  id: number
  title: string
  status: string
  budgetType: 'fixed' | 'hourly'
  budgetMin: string | null
  budgetMax: string | null
  currentBidsCount: number
  viewsCount: number
  createdAt: string
  deadline: string | null
  assignedFreelancerId: number | null
  completedAt: string | null
}

const fetcher = async (url: string) => {
  const response = await api.get(url, { shouldShowErrorToast: false })
  if (!response.success) throw new Error(response.error)
  return response.data
}

export function ClientJobManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('active')

  // Fetch client's jobs
  const { data, error, isLoading, mutate } = useSWR(
    `${apiEndpoints.jobs.base}?clientId=me&status=${activeTab === 'active' ? 'open' : activeTab}`,
    fetcher,
    {
      refreshInterval: 30000
    }
  )

  const handleJobAction = async (jobId: number, action: string) => {
    const response = await api.patch(
      apiEndpoints.jobs.byId(jobId),
      { status: action },
      {
        successMessage: `Job ${action} successfully`,
        errorMessage: 'Failed to update job'
      }
    )

    if (response.success) {
      mutate()
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-500/10 text-gray-600' },
      open: { label: 'Open', className: 'bg-green-500/10 text-green-600' },
      in_progress: {
        label: 'In Progress',
        className: 'bg-blue-500/10 text-blue-600'
      },
      completed: {
        label: 'Completed',
        className: 'bg-purple-500/10 text-purple-600'
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-red-500/10 text-red-600'
      },
      closed: { label: 'Closed', className: 'bg-orange-500/10 text-orange-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: ''
    }

    return (
      <Badge variant='outline' className={cn(config.className)}>
        {config.label}
      </Badge>
    )
  }

  const formatBudget = (job: JobPosting) => {
    if (job.budgetType === 'hourly') {
      if (job.budgetMin && job.budgetMax) {
        return `$${job.budgetMin}-${job.budgetMax}/hr`
      }
      return job.budgetMin ? `$${job.budgetMin}/hr` : 'TBD'
    } else {
      if (job.budgetMin && job.budgetMax) {
        return `$${job.budgetMin}-${job.budgetMax}`
      }
      return job.budgetMin ? `$${job.budgetMin}` : 'TBD'
    }
  }

  const stats = {
    totalJobs: data?.total || 0,
    activeJobs:
      data?.jobs?.filter((j: JobPosting) => j.status === 'open').length || 0,
    totalProposals:
      data?.jobs?.reduce(
        (acc: number, job: JobPosting) => acc + job.currentBidsCount,
        0
      ) || 0,
    avgBidsPerJob:
      data?.jobs?.length > 0
        ? Math.round(
            data.jobs.reduce(
              (acc: number, job: JobPosting) => acc + job.currentBidsCount,
              0
            ) / data.jobs.length
          )
        : 0
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Job Management</h2>
          <p className='text-muted-foreground'>
            Manage your job postings and proposals
          </p>
        </div>
        <Button
          onClick={() => router.push(appRoutes.trades.jobs.create)}
          className='bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
        >
          <Plus className='mr-2 h-4 w-4' />
          Post New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Total Jobs</p>
                <p className='text-2xl font-bold'>{stats.totalJobs}</p>
              </div>
              <Briefcase className='text-muted-foreground h-8 w-8' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Active Jobs</p>
                <p className='text-2xl font-bold'>{stats.activeJobs}</p>
              </div>
              <TrendingUp className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Total Proposals</p>
                <p className='text-2xl font-bold'>{stats.totalProposals}</p>
              </div>
              <Users className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Avg Bids/Job</p>
                <p className='text-2xl font-bold'>{stats.avgBidsPerJob}</p>
              </div>
              <BarChart3 className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value='active'>Active</TabsTrigger>
              <TabsTrigger value='draft'>Drafts</TabsTrigger>
              <TabsTrigger value='in_progress'>In Progress</TabsTrigger>
              <TabsTrigger value='completed'>Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className='mt-6'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-16 w-full' />
                  ))}
                </div>
              ) : error ? (
                <div className='text-muted-foreground py-8 text-center'>
                  Failed to load jobs
                </div>
              ) : data?.jobs?.length === 0 ? (
                <div className='py-12 text-center'>
                  <Briefcase className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <h3 className='mb-2 text-lg font-semibold'>
                    No {activeTab.replace('_', ' ')} jobs
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    {activeTab === 'active'
                      ? 'Post your first job to start receiving proposals'
                      : `You don't have any ${activeTab.replace('_', ' ')} jobs yet`}
                  </p>
                  {activeTab === 'active' && (
                    <Button
                      onClick={() => router.push(appRoutes.trades.jobs.create)}
                    >
                      Post a Job
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Proposals</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.jobs?.map((job: JobPosting) => (
                      <TableRow key={job.id}>
                        <TableCell className='font-medium'>
                          <div>
                            <p className='line-clamp-1'>{job.title}</p>
                            {job.deadline && (
                              <p className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
                                <Calendar className='h-3 w-3' />
                                Due{' '}
                                {new Date(job.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <span className='flex items-center gap-1'>
                            <DollarSign className='h-4 w-4' />
                            {formatBudget(job)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className='flex items-center gap-1'>
                            <Users className='h-4 w-4' />
                            {job.currentBidsCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className='flex items-center gap-1'>
                            <Eye className='h-4 w-4' />
                            {job.viewsCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            {formatDate(job.createdAt, 'relative')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    appRoutes.trades.jobs.detail(job.id)
                                  )
                                }
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                View Details
                              </DropdownMenuItem>
                              {job.status === 'open' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/trades/jobs/${job.id}/proposals`
                                      )
                                    }
                                  >
                                    <Users className='mr-2 h-4 w-4' />
                                    View Proposals
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `${appRoutes.trades.jobs.detail(job.id)}/edit`
                                      )
                                    }
                                  >
                                    <Edit className='mr-2 h-4 w-4' />
                                    Edit Job
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleJobAction(job.id, 'closed')
                                    }
                                    className='text-orange-600'
                                  >
                                    <XCircle className='mr-2 h-4 w-4' />
                                    Close Job
                                  </DropdownMenuItem>
                                </>
                              )}
                              {job.status === 'in_progress' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleJobAction(job.id, 'completed')
                                  }
                                  className='text-green-600'
                                >
                                  <CheckCircle className='mr-2 h-4 w-4' />
                                  Mark as Complete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
