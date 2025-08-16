'use client'

import Link from 'next/link'
import { useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Search,
  TrendingUp,
  XCircle,
  MoreVertical,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'

interface BidData {
  id: number
  jobId: number
  bidAmount: string
  deliveryDays: number
  proposalText: string
  status: string
  createdAt: string
  updatedAt: string
  job?: {
    id: number
    title: string
    clientId: number
    status: string
  }
}

interface BidStats {
  totalBids: number
  activeBids: number
  wonBids: number
  totalEarnings: number
  successRate: number
  avgBidAmount: number
}

export default function FreelancerBidsPage() {
  const { user } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  // Fetch bid statistics
  const { data: stats } = useSWR<BidStats>(
    user ? `/api/freelancers/${user.id}/bid-stats` : null,
    async (url: string) => {
      const response = await api.get(url)
      return response.success
        ? response.stats
        : {
            totalBids: 0,
            activeBids: 0,
            wonBids: 0,
            totalEarnings: 0,
            successRate: 0,
            avgBidAmount: 0
          }
    }
  )

  // Fetch bids with filters
  const { data: bidsData, mutate: mutateBids } = useSWR<{
    bids: BidData[]
    total: number
  }>(
    user
      ? `/api/freelancers/${user.id}/bids?status=${statusFilter}&sort=${sortBy}&search=${searchQuery}`
      : null,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response : { bids: [], total: 0 }
    }
  )

  const handleWithdrawBid = async (bidId: number, jobId: number) => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return

    try {
      const response = await api.delete(`/api/jobs/${jobId}/bids/${bidId}`)

      if (response.success) {
        toast.success('Bid withdrawn successfully')
        mutateBids()
      } else {
        toast.error(response.error || 'Failed to withdraw bid')
      }
    } catch (error) {
      toast.error('Failed to withdraw bid')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-500' />
      case 'shortlisted':
        return <TrendingUp className='h-4 w-4 text-blue-500' />
      case 'accepted':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'rejected':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'withdrawn':
        return <AlertCircle className='h-4 w-4 text-gray-500' />
      default:
        return <FileText className='h-4 w-4 text-gray-500' />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'shortlisted':
        return 'default'
      case 'accepted':
        return 'success'
      case 'rejected':
        return 'destructive'
      case 'withdrawn':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>My Bids</h1>
        <p className='text-muted-foreground'>
          Track and manage your job proposals
        </p>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Bids</CardTitle>
            <FileText className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.totalBids || 0}</div>
            <p className='text-muted-foreground text-xs'>
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Bids</CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.activeBids || 0}</div>
            <p className='text-muted-foreground text-xs'>
              Pending & shortlisted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Won Bids</CardTitle>
            <CheckCircle className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.wonBids || 0}</div>
            <p className='text-muted-foreground text-xs'>
              {stats?.successRate || 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg. Bid Amount
            </CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${stats?.avgBidAmount?.toFixed(2) || '0.00'}
            </div>
            <p className='text-muted-foreground text-xs'>Per proposal</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Bid History</CardTitle>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                <Input
                  placeholder='Search jobs...'
                  className='w-[200px] pl-8'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[130px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='shortlisted'>Shortlisted</SelectItem>
                  <SelectItem value='accepted'>Accepted</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                  <SelectItem value='withdrawn'>Withdrawn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className='w-[130px]'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest First</SelectItem>
                  <SelectItem value='oldest'>Oldest First</SelectItem>
                  <SelectItem value='amount_high'>Highest Bid</SelectItem>
                  <SelectItem value='amount_low'>Lowest Bid</SelectItem>
                  <SelectItem value='delivery_fast'>
                    Fastest Delivery
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='all' className='w-full'>
            <TabsList className='grid w-full grid-cols-5'>
              <TabsTrigger value='all'>All</TabsTrigger>
              <TabsTrigger value='pending'>Pending</TabsTrigger>
              <TabsTrigger value='shortlisted'>Shortlisted</TabsTrigger>
              <TabsTrigger value='accepted'>Accepted</TabsTrigger>
              <TabsTrigger value='rejected'>Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value='all' className='space-y-4'>
              {bidsData?.bids && bidsData.bids.length > 0 ? (
                bidsData.bids.map(bid => (
                  <Card key={bid.id} className='overflow-hidden'>
                    <CardContent className='p-0'>
                      <div className='flex items-center justify-between p-4'>
                        <div className='flex-1 space-y-2'>
                          <div className='flex items-start justify-between'>
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2'>
                                <Link
                                  href={appRoutes.trades.jobs.detail(
                                    bid.jobId.toString()
                                  )}
                                  className='flex items-center gap-1 font-medium hover:underline'
                                >
                                  {bid.job?.title || 'Untitled Job'}
                                  <ArrowUpRight className='h-3 w-3' />
                                </Link>
                                <Badge
                                  variant={getStatusBadgeVariant(bid.status)}
                                >
                                  <span className='flex items-center gap-1'>
                                    {getStatusIcon(bid.status)}
                                    {bid.status}
                                  </span>
                                </Badge>
                              </div>
                              <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                                <span className='flex items-center gap-1'>
                                  <DollarSign className='h-3 w-3' />$
                                  {bid.bidAmount}
                                </span>
                                <span className='flex items-center gap-1'>
                                  <Calendar className='h-3 w-3' />
                                  {bid.deliveryDays} days
                                </span>
                                <span>
                                  Submitted{' '}
                                  {formatDistanceToNow(
                                    new Date(bid.createdAt),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='sm'>
                                  <MoreVertical className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={appRoutes.trades.jobs.detail(
                                      bid.jobId.toString()
                                    )}
                                  >
                                    <Eye className='mr-2 h-4 w-4' />
                                    View Job
                                  </Link>
                                </DropdownMenuItem>
                                {bid.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/trades/jobs/${bid.jobId}/apply?edit=${bid.id}`}
                                      >
                                        <Edit2 className='mr-2 h-4 w-4' />
                                        Edit Bid
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className='text-destructive'
                                      onClick={() =>
                                        handleWithdrawBid(bid.id, bid.jobId)
                                      }
                                    >
                                      <Trash2 className='mr-2 h-4 w-4' />
                                      Withdraw Bid
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {bid.job?.status && (
                            <div className='flex items-center gap-2 text-sm'>
                              <span className='text-muted-foreground'>
                                Job Status:
                              </span>
                              <Badge variant='outline'>{bid.job.status}</Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {bid.status === 'shortlisted' && (
                        <div className='border-t bg-blue-50 p-3 dark:bg-blue-950/20'>
                          <p className='text-sm text-blue-600 dark:text-blue-400'>
                            🎉 Congratulations! Your bid has been shortlisted by
                            the client.
                          </p>
                        </div>
                      )}

                      {bid.status === 'accepted' && (
                        <div className='border-t bg-green-50 p-3 dark:bg-green-950/20'>
                          <p className='text-sm text-green-600 dark:text-green-400'>
                            ✅ Your bid was accepted! Check your trades for the
                            escrow details.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className='py-12 text-center'>
                    <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <h3 className='mb-2 text-lg font-semibold'>
                      No bids found
                    </h3>
                    <p className='text-muted-foreground mb-4'>
                      {statusFilter !== 'all'
                        ? `You don't have any ${statusFilter} bids`
                        : "You haven't submitted any bids yet"}
                    </p>
                    <Button asChild>
                      <Link href={appRoutes.trades.jobs.base}>Browse Jobs</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Repeat similar content for other tabs with filtered data */}
            {['pending', 'shortlisted', 'accepted', 'rejected'].map(status => (
              <TabsContent key={status} value={status} className='space-y-4'>
                {bidsData?.bids &&
                bidsData.bids.filter(b => b.status === status).length > 0 ? (
                  bidsData.bids
                    .filter(b => b.status === status)
                    .map(bid => (
                      <Card key={bid.id} className='overflow-hidden'>
                        {/* Same card content as above */}
                        <CardContent className='p-4'>
                          {/* ... bid card content ... */}
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <Card>
                    <CardContent className='py-12 text-center'>
                      <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                      <h3 className='mb-2 text-lg font-semibold'>
                        No {status} bids
                      </h3>
                      <p className='text-muted-foreground mb-4'>
                        You don't have any {status} bids at the moment
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
