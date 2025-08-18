'use client'

import Link from 'next/link'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  XCircle
} from 'lucide-react'
import { Doughnut } from 'react-chartjs-2'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

interface ProposalStats {
  total: number
  pending: number
  shortlisted: number
  accepted: number
  rejected: number
  conversionRate: number
}

interface RecentProposal {
  id: number
  jobId: number
  jobTitle: string
  bidAmount: string
  status: string
  createdAt: Date
  clientName: string
}

interface ProposalMetricsProps {
  stats: ProposalStats
  recentProposals: RecentProposal[]
}

export function ProposalMetrics({
  stats,
  recentProposals
}: ProposalMetricsProps) {
  const chartData = {
    labels: ['Pending', 'Shortlisted', 'Accepted', 'Rejected'],
    datasets: [
      {
        data: [
          stats.pending,
          stats.shortlisted,
          stats.accepted,
          stats.rejected
        ],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 11
          }
        }
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-3 w-3 text-yellow-500' />
      case 'shortlisted':
        return <TrendingUp className='h-3 w-3 text-blue-500' />
      case 'accepted':
        return <CheckCircle className='h-3 w-3 text-green-500' />
      case 'rejected':
        return <XCircle className='h-3 w-3 text-red-500' />
      default:
        return <FileText className='h-3 w-3 text-gray-500' />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
      case 'shortlisted':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
      case 'accepted':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20'
      case 'rejected':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Proposal Metrics
          </span>
          <Badge
            variant='outline'
            className={cn(
              stats.conversionRate >= 30
                ? 'border-green-500/50 text-green-700 dark:text-green-300'
                : stats.conversionRate >= 15
                  ? 'border-yellow-500/50 text-yellow-700 dark:text-yellow-300'
                  : 'border-red-500/50 text-red-700 dark:text-red-300'
            )}
          >
            {stats.conversionRate}% success
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Stats Overview */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-lg border p-3'>
              <p className='text-muted-foreground text-xs'>Total Sent</p>
              <p className='text-xl font-bold'>{stats.total}</p>
            </div>
            <div className='rounded-lg border p-3'>
              <p className='text-muted-foreground text-xs'>Active</p>
              <p className='text-xl font-bold'>
                {stats.pending + stats.shortlisted}
              </p>
            </div>
          </div>

          {/* Conversion Chart */}
          <div className='h-[200px]'>
            <Doughnut data={chartData} options={chartOptions} />
          </div>

          {/* Recent Proposals */}
          <div>
            <h4 className='mb-2 text-sm font-medium'>Recent Proposals</h4>
            <div className='space-y-2'>
              {recentProposals.slice(0, 3).map(proposal => (
                <div
                  key={proposal.id}
                  className='flex items-center justify-between rounded-md border p-2'
                >
                  <div className='min-w-0 flex-1'>
                    <Link
                      href={`/trades/jobs/${proposal.jobId}`}
                      className='truncate text-sm font-medium hover:underline'
                    >
                      {proposal.jobTitle}
                    </Link>
                    <p className='text-muted-foreground text-xs'>
                      {formatDistanceToNow(new Date(proposal.createdAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  <Badge
                    variant='outline'
                    className={cn(
                      'ml-2 text-xs',
                      getStatusColor(proposal.status)
                    )}
                  >
                    {getStatusIcon(proposal.status)}
                    <span className='ml-1'>{proposal.status}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Button variant='outline' className='w-full' asChild>
            <Link href='/dashboard/freelancer/bids'>
              View All Proposals
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
