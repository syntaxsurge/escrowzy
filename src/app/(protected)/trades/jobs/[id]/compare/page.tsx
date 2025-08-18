'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Star,
  User,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { BidWithRelations } from '@/lib/db/queries/bids'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

export default function CompareFreelancersPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSession()
  const jobId = params.id as string

  const [selectedBids, setSelectedBids] = useState<number[]>([])
  const [comparisonMetric, setComparisonMetric] = useState<
    'overview' | 'skills' | 'experience' | 'pricing'
  >('overview')
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: true,
    skills: false,
    experience: false,
    pricing: false
  })

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useSWR<JobPostingWithRelations>(
    `/api/jobs/${jobId}`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).job : null
    }
  )

  // Fetch bids
  const { data: bids = [], isLoading: bidsLoading } = useSWR<
    BidWithRelations[]
  >(`/api/jobs/${jobId}/bids`, async (url: string) => {
    const response = await api.get(url)
    return response.success ? (response as any).bids : []
  })

  // Check ownership
  const isOwner = user?.id === job?.clientId

  if (!isOwner) {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <h3 className='mb-2 text-lg font-semibold'>Access Denied</h3>
            <p className='text-muted-foreground'>
              You don't have permission to compare freelancers for this job
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

  const toggleBidSelection = (bidId: number) => {
    if (selectedBids.includes(bidId)) {
      setSelectedBids(selectedBids.filter(id => id !== bidId))
    } else if (selectedBids.length < 4) {
      setSelectedBids([...selectedBids, bidId])
    } else {
      toast.error('You can compare up to 4 freelancers at a time')
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getSelectedBidsData = () => {
    return bids.filter(bid => selectedBids.includes(bid.id))
  }

  const handleAcceptBid = async (bidId: number) => {
    try {
      const response = await api.patch(`/api/jobs/${jobId}/bids/${bidId}`, {
        status: 'accepted'
      })

      if (response.success) {
        toast.success('Bid accepted successfully')
        router.push(`/trades/jobs/${jobId}/proposals`)
      } else {
        toast.error(response.error || 'Failed to accept bid')
      }
    } catch (error) {
      toast.error('Failed to accept bid')
    }
  }

  const selectedBidsData = getSelectedBidsData()

  if (jobLoading || bidsLoading) {
    return (
      <div className='container mx-auto space-y-6 py-6'>
        <Card>
          <CardContent className='py-12'>
            <div className='animate-pulse space-y-4'>
              <div className='bg-muted h-8 w-3/4 rounded' />
              <div className='bg-muted h-4 w-1/2 rounded' />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div>
        <Button
          variant='ghost'
          onClick={() => router.push(`/trades/jobs/${jobId}/proposals`)}
          className='mb-2'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Proposals
        </Button>
        <h1 className='text-3xl font-bold'>Compare Freelancers</h1>
        <p className='text-muted-foreground'>
          Compare up to 4 freelancers side-by-side for "{job?.title}"
        </p>
      </div>

      {/* Freelancer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Freelancers to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {bids.map(bid => (
              <div
                key={bid.id}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                  selectedBids.includes(bid.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleBidSelection(bid.id)}
              >
                {selectedBids.includes(bid.id) && (
                  <div className='bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full'>
                    <Check className='h-4 w-4' />
                  </div>
                )}
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage src={bid.freelancer?.avatarUrl || ''} />
                    <AvatarFallback>
                      {bid.freelancer?.name?.charAt(0) || 'F'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <p className='font-medium'>
                      {bid.freelancer?.name || 'Unknown'}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      ${bid.bidAmount} · {bid.deliveryDays} days
                    </p>
                    {bid.freelancerProfile?.rating && (
                      <div className='flex items-center gap-1'>
                        <Star className='h-3 w-3 fill-yellow-500 text-yellow-500' />
                        <span className='text-xs'>
                          {bid.freelancerProfile.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedBids.length > 0 && (
            <div className='mt-4 flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>
                {selectedBids.length} freelancer
                {selectedBids.length !== 1 ? 's' : ''} selected
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSelectedBids([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedBidsData.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Comparison Table</CardTitle>
              <Select
                value={comparisonMetric}
                onValueChange={(value: any) => setComparisonMetric(value)}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Select metric' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='overview'>Overview</SelectItem>
                  <SelectItem value='skills'>Skills & Experience</SelectItem>
                  <SelectItem value='experience'>Work History</SelectItem>
                  <SelectItem value='pricing'>Pricing & Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[200px]'>Criteria</TableHead>
                    {selectedBidsData.map(bid => (
                      <TableHead key={bid.id} className='text-center'>
                        <div className='flex flex-col items-center gap-2'>
                          <Avatar>
                            <AvatarImage
                              src={bid.freelancer?.avatarUrl || ''}
                            />
                            <AvatarFallback>
                              {bid.freelancer?.name?.charAt(0) || 'F'}
                            </AvatarFallback>
                          </Avatar>
                          <span className='font-medium'>
                            {bid.freelancer?.name || 'Unknown'}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Overview Metrics */}
                  {(comparisonMetric === 'overview' ||
                    expandedSections.overview) && (
                    <>
                      <TableRow>
                        <TableCell className='font-medium'>Rating</TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            {bid.freelancerProfile?.rating ? (
                              <div className='flex items-center justify-center gap-1'>
                                <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                                <span>
                                  {bid.freelancerProfile.rating.toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className='text-muted-foreground'>
                                No rating
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Completed Jobs
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <Award className='h-4 w-4' />
                              <span>
                                {bid.freelancerProfile?.completedJobs || 0}
                              </span>
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Bid Amount
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            <span className='font-semibold'>
                              ${bid.bidAmount}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Delivery Time
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <Calendar className='h-4 w-4' />
                              <span>{bid.deliveryDays} days</span>
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Skills Metrics */}
                  {(comparisonMetric === 'skills' ||
                    expandedSections.skills) && (
                    <>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Years of Experience
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            {bid.freelancerProfile?.yearsOfExperience || 0}{' '}
                            years
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Hourly Rate
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            {bid.freelancerProfile?.hourlyRate
                              ? `$${bid.freelancerProfile.hourlyRate}/hr`
                              : 'Not specified'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Verification Status
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            <Badge
                              variant={
                                bid.freelancerProfile?.verificationStatus ===
                                'verified'
                                  ? 'success'
                                  : 'secondary'
                              }
                            >
                              {bid.freelancerProfile?.verificationStatus ||
                                'Unverified'}
                            </Badge>
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Pricing Metrics */}
                  {(comparisonMetric === 'pricing' ||
                    expandedSections.pricing) && (
                    <>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Cost per Day
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            $
                            {(
                              parseFloat(bid.bidAmount) / bid.deliveryDays
                            ).toFixed(2)}
                            /day
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Has Attachments
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            {bid.attachments &&
                            (bid.attachments as any[]).length > 0 ? (
                              <Check className='mx-auto h-4 w-4 text-green-500' />
                            ) : (
                              <X className='text-muted-foreground mx-auto h-4 w-4' />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Cover Letter
                        </TableCell>
                        {selectedBidsData.map(bid => (
                          <TableCell key={bid.id} className='text-center'>
                            {bid.coverLetter ? (
                              <Check className='mx-auto h-4 w-4 text-green-500' />
                            ) : (
                              <X className='text-muted-foreground mx-auto h-4 w-4' />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </>
                  )}

                  {/* Actions Row */}
                  <TableRow>
                    <TableCell className='font-medium'>Actions</TableCell>
                    {selectedBidsData.map(bid => (
                      <TableCell key={bid.id} className='text-center'>
                        <div className='flex flex-col gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              router.push(`/freelancers/${bid.freelancerId}`)
                            }
                          >
                            <User className='mr-2 h-3 w-3' />
                            View Profile
                          </Button>
                          {bid.status === 'pending' && (
                            <Button
                              size='sm'
                              onClick={() => handleAcceptBid(bid.id)}
                            >
                              <Check className='mr-2 h-3 w-3' />
                              Accept Bid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Detailed Proposals */}
            <div className='mt-6 space-y-4'>
              <h3 className='text-lg font-semibold'>Proposal Details</h3>
              {selectedBidsData.map(bid => (
                <Collapsible key={bid.id}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-between'
                    >
                      <span>{bid.freelancer?.name}'s Proposal</span>
                      <ChevronDown className='h-4 w-4' />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className='mt-2'>
                    <Card>
                      <CardContent className='pt-6'>
                        <div className='space-y-4'>
                          <div>
                            <h4 className='mb-2 font-medium'>Proposal Text</h4>
                            <p className='text-muted-foreground whitespace-pre-wrap'>
                              {bid.proposalText}
                            </p>
                          </div>
                          {bid.coverLetter && (
                            <div>
                              <h4 className='mb-2 font-medium'>Cover Letter</h4>
                              <p className='text-muted-foreground whitespace-pre-wrap'>
                                {bid.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedBidsData.length === 0 && (
        <Card>
          <CardContent className='py-12 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>
              No Freelancers Selected
            </h3>
            <p className='text-muted-foreground'>
              Select up to 4 freelancers from above to compare them
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
