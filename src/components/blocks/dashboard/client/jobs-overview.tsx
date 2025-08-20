'use client'

import Link from 'next/link'

import { format } from 'date-fns'
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  MoreHorizontal,
  Users
} from 'lucide-react'

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
import { appRoutes } from '@/config/app-routes'

interface PostedJob {
  id: number
  title: string
  status: string
  category: string
  budget: string
  proposalsCount: number
  createdAt: Date
  deadline: Date | null
}

interface ActiveJob {
  id: number
  title: string
  freelancerName: string
  freelancerId: number
  progress: number
  nextMilestone: string | null
  nextMilestoneDate: Date | null
  totalBudget: string
}

interface JobsOverviewProps {
  postedJobs: PostedJob[]
  activeJobs: ActiveJob[]
  detailed?: boolean
}

export function JobsOverview({
  postedJobs,
  activeJobs,
  detailed = false
}: JobsOverviewProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant='success'>Open</Badge>
      case 'in_progress':
        return <Badge variant='default'>In Progress</Badge>
      case 'completed':
        return <Badge variant='secondary'>Completed</Badge>
      case 'cancelled':
        return <Badge variant='destructive'>Cancelled</Badge>
      case 'draft':
        return <Badge variant='outline'>Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (detailed) {
    return (
      <div className='space-y-6'>
        <Tabs defaultValue='posted' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='posted'>Posted Jobs</TabsTrigger>
            <TabsTrigger value='active'>Active Projects</TabsTrigger>
          </TabsList>

          <TabsContent value='posted' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <Briefcase className='h-5 w-5' />
                    Posted Jobs
                  </span>
                  <Button size='sm' asChild>
                    <Link href={appRoutes.trades.jobs.create}>
                      Post New Job
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postedJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className='font-medium'>
                          <Link
                            href={`/trades/jobs/${job.id}`}
                            className='hover:underline'
                          >
                            {job.title}
                          </Link>
                        </TableCell>
                        <TableCell>{job.category}</TableCell>
                        <TableCell>{job.budget}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            <Users className='mr-1 h-3 w-3' />
                            {job.proposalsCount}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {format(new Date(job.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {job.deadline
                            ? format(new Date(job.deadline), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/trades/jobs/${job.id}`}>
                                  <Eye className='mr-2 h-4 w-4' />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/trades/jobs/${job.id}/edit`}>
                                  Edit Job
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/trades/jobs/${job.id}/applications`}
                                >
                                  View Applications
                                </Link>
                              </DropdownMenuItem>
                              {job.status === 'open' && (
                                <DropdownMenuItem className='text-destructive'>
                                  Close Job
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='active' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Freelancer</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Next Milestone</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className='font-medium'>
                          <Link
                            href={`/jobs/${job.id}/workspace`}
                            className='hover:underline'
                          >
                            {job.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/profile/${job.freelancerId}`}
                            className='hover:underline'
                          >
                            {job.freelancerName}
                          </Link>
                        </TableCell>
                        <TableCell>${job.totalBudget}</TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <Progress value={job.progress} className='h-2' />
                            <span className='text-muted-foreground text-xs'>
                              {job.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{job.nextMilestone || '-'}</TableCell>
                        <TableCell>
                          {job.nextMilestoneDate
                            ? format(new Date(job.nextMilestoneDate), 'MMM d')
                            : '-'}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button size='sm' variant='outline' asChild>
                            <Link href={`/jobs/${job.id}/workspace`}>
                              Workspace
                              <ArrowRight className='ml-2 h-3 w-3' />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Briefcase className='h-5 w-5' />
            Jobs Overview
          </span>
          <Button size='sm' variant='outline' asChild>
            <Link href={appRoutes.dashboard.client.jobs}>View All</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Posted Jobs Summary */}
          <div>
            <h3 className='mb-2 text-sm font-medium'>Recent Posted Jobs</h3>
            <div className='space-y-2'>
              {postedJobs.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex-1'>
                    <Link
                      href={`/trades/jobs/${job.id}`}
                      className='font-medium hover:underline'
                    >
                      {job.title}
                    </Link>
                    <div className='text-muted-foreground mt-1 flex items-center gap-3 text-xs'>
                      <span className='flex items-center gap-1'>
                        <DollarSign className='h-3 w-3' />
                        {job.budget}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Users className='h-3 w-3' />
                        {job.proposalsCount} applications
                      </span>
                      {job.deadline && (
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          {format(new Date(job.deadline), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects Summary */}
          {activeJobs.length > 0 && (
            <div>
              <h3 className='mb-2 text-sm font-medium'>Active Projects</h3>
              <div className='space-y-2'>
                {activeJobs.slice(0, 3).map(job => (
                  <div
                    key={job.id}
                    className='flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex-1'>
                      <Link
                        href={`/jobs/${job.id}/workspace`}
                        className='font-medium hover:underline'
                      >
                        {job.title}
                      </Link>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        with {job.freelancerName}
                      </div>
                      <div className='mt-2'>
                        <Progress value={job.progress} className='h-1.5' />
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-medium'>{job.progress}%</div>
                      {job.nextMilestoneDate && (
                        <div className='text-muted-foreground text-xs'>
                          Due {format(new Date(job.nextMilestoneDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
