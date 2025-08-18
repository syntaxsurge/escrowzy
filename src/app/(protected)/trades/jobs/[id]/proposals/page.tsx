'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  MessageSquare,
  MoreVertical,
  Search,
  Star,
  User,
  X,
  Filter,
  Users,
  Award
} from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

// import { BidNegotiationChat } from '@/components/blocks/jobs/bid-negotiation-chat'
// import { InterviewScheduler } from '@/components/blocks/jobs/interview-scheduler'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { BidWithRelations } from '@/lib/db/queries/bids'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

// Dynamic import for markdown preview
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className='bg-muted h-[200px] animate-pulse rounded' />
  }
)

export default function JobProposalsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSession()
  const jobId = params.id as string

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedBid, setExpandedBid] = useState<number | null>(null)
  const [selectedBids, setSelectedBids] = useState<number[]>([])
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    bidId: number | null
  }>({
    open: false,
    bidId: null
  })
  const [rejectReason, setRejectReason] = useState('')

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useSWR<JobPostingWithRelations>(
    `/api/jobs/${jobId}`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).job : null
    }
  )

  // Fetch bids for the job
  const {
    data: bids = [],
    isLoading: bidsLoading,
    mutate: mutateBids
  } = useSWR<BidWithRelations[]>(
    `/api/jobs/${jobId}/bids`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).bids : []
    }
  )

  // Check if user is the job owner
  const isOwner = user?.id === job?.clientId

  if (!isOwner) {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <h3 className='mb-2 text-lg font-semibold'>Access Denied</h3>
            <p className='text-muted-foreground'>
              You don't have permission to view proposals for this job
            </p>
            <Button
              onClick={() => router.push(appRoutes.trades.jobs.base)}
              className='mt-4'
            >
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter and sort bids
  let filteredBids = [...bids]

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredBids = filteredBids.filter(
      bid =>
        bid.freelancer?.name?.toLowerCase().includes(query) ||
        bid.proposalText?.toLowerCase().includes(query)
    )
  }

  if (filterStatus !== 'all') {
    filteredBids = filteredBids.filter(bid => bid.status === filterStatus)
  }

  // Sort bids
  filteredBids.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'price_low':
        return parseFloat(a.bidAmount) - parseFloat(b.bidAmount)
      case 'price_high':
        return parseFloat(b.bidAmount) - parseFloat(a.bidAmount)
      case 'rating':
        return (
          (b.freelancerProfile?.rating || 0) -
          (a.freelancerProfile?.rating || 0)
        )
      default:
        return 0
    }
  })

  const handleBidAction = async (
    bidId: number,
    action: 'shortlist' | 'accept' | 'reject'
  ) => {
    try {
      const response = await api.patch(`/api/jobs/${jobId}/bids/${bidId}`, {
        status:
          action === 'shortlist'
            ? 'shortlisted'
            : action === 'accept'
              ? 'accepted'
              : 'rejected',
        reason: action === 'reject' ? rejectReason : undefined
      })

      if (response.success) {
        toast.success(`Bid ${action}ed successfully`)
        mutateBids()
        if (action === 'reject') {
          setRejectDialog({ open: false, bidId: null })
          setRejectReason('')
        }
      } else {
        toast.error(response.error || `Failed to ${action} bid`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} bid`)
    }
  }

  const handleBulkAction = async (action: 'shortlist' | 'reject') => {
    if (selectedBids.length === 0) {
      toast.error('Please select bids first')
      return
    }

    try {
      const promises = selectedBids.map(bidId =>
        api.patch(`/api/jobs/${jobId}/bids/${bidId}`, {
          status: action === 'shortlist' ? 'shortlisted' : 'rejected'
        })
      )

      await Promise.all(promises)
      toast.success(`${selectedBids.length} bids ${action}ed`)
      setSelectedBids([])
      mutateBids()
    } catch (error) {
      toast.error(`Failed to ${action} bids`)
    }
  }

  const stats = {
    total: bids.length,
    shortlisted: bids.filter(b => b.status === 'shortlisted').length,
    avgBid:
      bids.length > 0
        ? bids.reduce((sum, b) => sum + parseFloat(b.bidAmount), 0) /
          bids.length
        : 0,
    avgDelivery:
      bids.length > 0
        ? Math.round(
            bids.reduce((sum, b) => sum + b.deliveryDays, 0) / bids.length
          )
        : 0
  }

  if (jobLoading || bidsLoading) {
    return (
      <div className='container mx-auto space-y-6 py-6'>
        <Card>
          <CardContent className='py-12'>
            <div className='text-center'>
              <div className='animate-pulse space-y-4'>
                <div className='bg-muted mx-auto h-8 w-3/4 rounded' />
                <div className='bg-muted mx-auto h-4 w-1/2 rounded' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-2'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Job
          </Button>
          <h1 className='text-3xl font-bold'>Proposals for {job?.title}</h1>
          <p className='text-muted-foreground'>
            Review and manage freelancer proposals
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Proposals
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Shortlisted</CardTitle>
            <Star className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.shortlisted}</div>
            <Progress
              value={(stats.shortlisted / stats.total) * 100}
              className='mt-2'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Bid</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${stats.avgBid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Delivery</CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.avgDelivery} days</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>All Proposals ({filteredBids.length})</CardTitle>
            <div className='flex items-center gap-2'>
              {bids.length > 1 && (
                <Button
                  variant='outline'
                  onClick={() => router.push(`/trades/jobs/${jobId}/compare`)}
                >
                  <Users className='mr-2 h-4 w-4' />
                  Compare
                </Button>
              )}
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                <Input
                  placeholder='Search freelancers...'
                  className='w-[200px] pl-8'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-[130px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Filter' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='shortlisted'>Shortlisted</SelectItem>
                  <SelectItem value='accepted'>Accepted</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className='w-[130px]'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest First</SelectItem>
                  <SelectItem value='oldest'>Oldest First</SelectItem>
                  <SelectItem value='price_low'>Lowest Price</SelectItem>
                  <SelectItem value='price_high'>Highest Price</SelectItem>
                  <SelectItem value='rating'>Best Rating</SelectItem>
                </SelectContent>
              </Select>

              {selectedBids.length > 0 && (
                <div className='flex items-center gap-2 border-l pl-2'>
                  <span className='text-muted-foreground text-sm'>
                    {selectedBids.length} selected
                  </span>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleBulkAction('shortlist')}
                  >
                    Shortlist All
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleBulkAction('reject')}
                  >
                    Reject All
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredBids.length === 0 ? (
              <Card>
                <CardContent className='py-12 text-center'>
                  <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <h3 className='mb-2 text-lg font-semibold'>
                    No proposals yet
                  </h3>
                  <p className='text-muted-foreground'>
                    Freelancers will start submitting proposals soon
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBids.map(bid => (
                <Card key={bid.id} className='overflow-hidden'>
                  <CardContent className='p-0'>
                    <div className='p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-4'>
                          <input
                            type='checkbox'
                            checked={selectedBids.includes(bid.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedBids([...selectedBids, bid.id])
                              } else {
                                setSelectedBids(
                                  selectedBids.filter(id => id !== bid.id)
                                )
                              }
                            }}
                            className='mt-1'
                          />

                          <Avatar>
                            <AvatarImage
                              src={bid.freelancer?.avatarUrl || ''}
                            />
                            <AvatarFallback>
                              {bid.freelancer?.name?.charAt(0) || 'F'}
                            </AvatarFallback>
                          </Avatar>

                          <div className='flex-1 space-y-2'>
                            <div className='flex items-center gap-2'>
                              <Link
                                href={`/freelancers/${bid.freelancerId}`}
                                className='font-medium hover:underline'
                              >
                                {bid.freelancer?.name || 'Unknown Freelancer'}
                              </Link>
                              <Badge
                                variant={
                                  bid.status === 'shortlisted'
                                    ? 'default'
                                    : bid.status === 'accepted'
                                      ? 'success'
                                      : bid.status === 'rejected'
                                        ? 'destructive'
                                        : 'secondary'
                                }
                              >
                                {bid.status}
                              </Badge>
                            </div>

                            {bid.freelancerProfile && (
                              <p className='text-muted-foreground text-sm'>
                                {bid.freelancerProfile.professionalTitle}
                              </p>
                            )}

                            <div className='flex items-center gap-4 text-sm'>
                              <span className='flex items-center gap-1'>
                                <DollarSign className='h-3 w-3' />
                                <strong>${bid.bidAmount}</strong>
                              </span>
                              <span className='flex items-center gap-1'>
                                <Calendar className='h-3 w-3' />
                                {bid.deliveryDays} days
                              </span>
                              {bid.freelancerProfile?.rating && (
                                <span className='flex items-center gap-1'>
                                  <Star className='h-3 w-3 fill-yellow-500 text-yellow-500' />
                                  {bid.freelancerProfile.rating.toFixed(1)}
                                </span>
                              )}
                              {bid.freelancerProfile?.completedJobs &&
                                bid.freelancerProfile.completedJobs > 0 && (
                                  <span className='flex items-center gap-1'>
                                    <Award className='h-3 w-3' />
                                    {bid.freelancerProfile?.completedJobs} jobs
                                  </span>
                                )}
                            </div>

                            <Collapsible
                              open={expandedBid === bid.id}
                              onOpenChange={open =>
                                setExpandedBid(open ? bid.id : null)
                              }
                            >
                              <CollapsibleTrigger asChild>
                                <Button variant='ghost' size='sm'>
                                  {expandedBid === bid.id ? (
                                    <>
                                      <ChevronUp className='mr-2 h-4 w-4' />
                                      Hide Proposal
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className='mr-2 h-4 w-4' />
                                      View Proposal
                                    </>
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className='mt-4 space-y-4'>
                                <div>
                                  <h4 className='mb-2 font-medium'>Proposal</h4>
                                  <div data-color-mode='light'>
                                    <MDEditor
                                      value={bid.proposalText}
                                      preview='preview'
                                      hideToolbar
                                      height={200}
                                    />
                                  </div>
                                </div>

                                {bid.coverLetter && (
                                  <div>
                                    <h4 className='mb-2 font-medium'>
                                      Cover Letter
                                    </h4>
                                    <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                                      {bid.coverLetter}
                                    </p>
                                  </div>
                                )}

                                {bid.attachments &&
                                (bid.attachments as any[]).length > 0 ? (
                                  <div>
                                    <h4 className='mb-2 font-medium'>
                                      Attachments
                                    </h4>
                                    <div className='flex flex-wrap gap-2'>
                                      {(bid.attachments as any[]).map(
                                        (attachment, idx) => (
                                          <Badge key={idx} variant='outline'>
                                            <FileText className='mr-1 h-3 w-3' />
                                            {(attachment as any).name}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </div>

                        <div className='flex items-center gap-2'>
                          {bid.status === 'pending' && (
                            <>
                              <BidNegotiationChat
                                bid={bid}
                                jobTitle={job?.title || ''}
                                isClient={true}
                                onTermsAccepted={() =>
                                  handleBidAction(bid.id, 'accept')
                                }
                              />
                              <InterviewScheduler
                                jobId={parseInt(jobId)}
                                bidId={bid.id}
                                freelancerId={bid.freelancerId}
                                freelancerName={
                                  bid.freelancer?.name || 'Freelancer'
                                }
                                onScheduled={() => mutateBids()}
                              />
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  handleBidAction(bid.id, 'shortlist')
                                }
                              >
                                <Star className='mr-2 h-4 w-4' />
                                Shortlist
                              </Button>
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleBidAction(bid.id, 'accept')
                                }
                              >
                                <Check className='mr-2 h-4 w-4' />
                                Accept
                              </Button>
                            </>
                          )}

                          {bid.status === 'shortlisted' && (
                            <>
                              <InterviewScheduler
                                jobId={parseInt(jobId)}
                                bidId={bid.id}
                                freelancerId={bid.freelancerId}
                                freelancerName={
                                  bid.freelancer?.name || 'Freelancer'
                                }
                                onScheduled={() => mutateBids()}
                              />
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleBidAction(bid.id, 'accept')
                                }
                              >
                                <Check className='mr-2 h-4 w-4' />
                                Accept
                              </Button>
                            </>
                          )}

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
                                <Link href={`/freelancers/${bid.freelancerId}`}>
                                  <User className='mr-2 h-4 w-4' />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className='mr-2 h-4 w-4' />
                                Send Message
                              </DropdownMenuItem>
                              {bid.status !== 'rejected' && (
                                <DropdownMenuItem
                                  className='text-destructive'
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      bidId: bid.id
                                    })
                                  }
                                >
                                  <X className='mr-2 h-4 w-4' />
                                  Reject
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    <div className='bg-muted/50 text-muted-foreground border-t px-4 py-2 text-xs'>
                      Submitted{' '}
                      {formatDistanceToNow(new Date(bid.createdAt), {
                        addSuffix: true
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={open => setRejectDialog({ open, bidId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this proposal (optional)
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='reason'>Reason</Label>
              <Textarea
                id='reason'
                placeholder="Your skills don't match our requirements..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRejectDialog({ open: false, bidId: null })}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                rejectDialog.bidId &&
                handleBidAction(rejectDialog.bidId, 'reject')
              }
            >
              Reject Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
