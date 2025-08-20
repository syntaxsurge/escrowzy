'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Globe,
  MapPin,
  MessageSquare,
  Share2,
  Shield,
  Star,
  Target,
  Users,
  Zap
} from 'lucide-react'
import useSWR from 'swr'

// import { FeaturedJobsMini } from '@/components/blocks/jobs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

interface BidWithFreelancer {
  id: number
  jobId: number
  freelancerId: number
  bidAmount: string
  deliveryTimeDays: number
  proposalText: string
  attachments: any
  status: string
  coverLetter: string | null
  createdAt: Date
  updatedAt: Date
  freelancer: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
    username: string | null
  }
  freelancerProfile?: {
    professionalTitle: string | null
    hourlyRate: string | null
    yearsOfExperience: number | null
    verificationStatus: string
  }
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSession()
  const jobId = params.id as string

  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  // Fetch job details
  const {
    data: job,
    isLoading,
    mutate
  } = useSWR<JobPostingWithRelations>(
    apiEndpoints.jobs.byId(jobId),
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : null
    }
  )

  // Fetch bids if user is the client
  const { data: bidsData } = useSWR(
    job?.clientId === user?.id ? `${apiEndpoints.jobs.byId(jobId)}/bids` : null,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response : { bids: [], total: 0 }
    }
  )

  // Fetch client stats
  const { data: clientStatsResponse } = useSWR(
    job?.clientId ? `/api/users/${job.clientId}/stats` : null,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response : null
    }
  )

  const clientStats = clientStatsResponse?.success
    ? {
        avgRating: (clientStatsResponse as any).avgRating,
        reviewCount: (clientStatsResponse as any).reviewCount,
        jobsPosted: (clientStatsResponse as any).jobsPosted,
        hireRate: (clientStatsResponse as any).hireRate,
        location: (clientStatsResponse as any).location
      }
    : null

  // Check if user has already saved this job
  const isSaved = false // Will be implemented later

  // Check if user has already applied
  const hasApplied = false // Will be implemented later

  const handleSave = async () => {
    if (!user) {
      router.push(appRoutes.login)
      return
    }

    setIsSaving(true)
    try {
      const response = await api.post(apiEndpoints.jobs.save(jobId))
      if (response.success) {
        mutate()
      }
    } catch (error) {
      console.error('Failed to save job:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApply = () => {
    if (!user) {
      router.push(appRoutes.login)
      return
    }

    // Navigate to apply page or open modal
    router.push(`${appRoutes.trades.jobs.detail(jobId)}/apply`)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: job?.description?.substring(0, 100),
          url
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url)
    }
  }

  if (isLoading) {
    return (
      <div className='container mx-auto space-y-6 py-6'>
        <Card>
          <CardContent className='py-12'>
            <div className='text-center'>
              <div className='animate-pulse space-y-4'>
                <div className='bg-muted mx-auto h-8 w-3/4 rounded' />
                <div className='bg-muted mx-auto h-4 w-1/2 rounded' />
                <div className='bg-muted mx-auto h-4 w-2/3 rounded' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!job) {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <Briefcase className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>Job not found</h3>
            <p className='text-muted-foreground mb-4'>
              This job may have been removed or is no longer available
            </p>
            <Button onClick={() => router.push(appRoutes.trades.jobs.base)}>
              Browse Other Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = job.clientId === user?.id
  const isFreelancer = user && !isOwner

  // Calculate job stats
  const daysPosted = Math.ceil(
    (new Date().getTime() - new Date(job.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const experienceLevelConfig = {
    entry: { label: 'Entry Level', color: 'text-green-600', icon: Zap },
    intermediate: {
      label: 'Intermediate',
      color: 'text-blue-600',
      icon: Target
    },
    expert: { label: 'Expert', color: 'text-purple-600', icon: Shield }
  }

  const expLevel =
    experienceLevelConfig[
      job.experienceLevel as keyof typeof experienceLevelConfig
    ] || experienceLevelConfig.intermediate

  return (
    <div className='container mx-auto py-6'>
      {/* Back Navigation */}
      <Button variant='ghost' onClick={() => router.back()} className='mb-4'>
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Jobs
      </Button>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Job Header */}
          <Card>
            <CardHeader>
              <div className='space-y-4'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-1'>
                    <h1 className='text-2xl font-bold'>{job.title}</h1>
                    <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-4 w-4' />
                        Posted{' '}
                        {formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true
                        })}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Globe className='h-4 w-4' />
                        {job.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Users className='h-4 w-4' />
                        {job.currentBidsCount} proposals
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaved ? (
                              <BookmarkCheck className='h-4 w-4' />
                            ) : (
                              <Bookmark className='h-4 w-4' />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isSaved ? 'Remove from saved' : 'Save job'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={handleShare}
                          >
                            <Share2 className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share job</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {!isOwner && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant='outline' size='icon'>
                              <Flag className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Report job</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className='flex flex-wrap gap-2'>
                  <Badge
                    variant={job.status === 'open' ? 'default' : 'secondary'}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                  <Badge variant='outline'>
                    {job.category?.icon} {job.category?.name}
                  </Badge>
                  <Badge variant='outline' className={expLevel.color}>
                    <expLevel.icon className='mr-1 h-3 w-3' />
                    {expLevel.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs for Details/Proposals/Activity */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='details'>Details</TabsTrigger>
              <TabsTrigger value='milestones'>
                Milestones ({job.milestones?.length || 0})
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value='proposals'>
                  Proposals ({(bidsData as any)?.total || 0})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='details' className='space-y-6'>
              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='prose prose-sm max-w-none'>
                    {job.description.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Required */}
              {job.skillsRequired && job.skillsRequired.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      {job.skillsRequired.map((skill: string) => (
                        <Badge key={skill} variant='secondary'>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              {job.attachments && job.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {job.attachments.map((attachment: any, index: number) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded-lg border p-2'
                        >
                          <div className='flex items-center gap-2'>
                            <FileText className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm'>{attachment.name}</span>
                            <span className='text-muted-foreground text-xs'>
                              ({attachment.size})
                            </span>
                          </div>
                          <Button variant='ghost' size='sm'>
                            <ExternalLink className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value='milestones' className='space-y-4'>
              {job.milestones && job.milestones.length > 0 ? (
                job.milestones.map((milestone: any) => (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div>
                          <CardTitle className='text-lg'>
                            {milestone.title}
                          </CardTitle>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            Due:{' '}
                            {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-lg font-bold'>
                            ${milestone.amount}
                          </p>
                          <Badge
                            variant={
                              milestone.status === 'approved'
                                ? 'default'
                                : milestone.status === 'in_progress'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm'>{milestone.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className='py-8 text-center'>
                    <Target className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
                    <p className='text-muted-foreground'>
                      No milestones defined for this project
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {isOwner && (
              <TabsContent value='proposals' className='space-y-4'>
                {bidsData && (bidsData as any).bids.length > 0 ? (
                  (bidsData as any).bids.map((bid: BidWithFreelancer) => (
                    <Card key={bid.id}>
                      <CardHeader>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarImage
                                src={bid.freelancer.avatarUrl || ''}
                              />
                              <AvatarFallback>
                                {bid.freelancer.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-semibold'>
                                {bid.freelancer.name}
                              </p>
                              {bid.freelancerProfile && (
                                <p className='text-muted-foreground text-sm'>
                                  {bid.freelancerProfile.professionalTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='text-lg font-bold'>
                              ${bid.bidAmount}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              in {bid.deliveryTimeDays} days
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div>
                          <p className='mb-2 text-sm font-medium'>Proposal</p>
                          <p className='text-muted-foreground text-sm'>
                            {bid.proposalText}
                          </p>
                        </div>
                        {bid.coverLetter && (
                          <div>
                            <p className='mb-2 text-sm font-medium'>
                              Cover Letter
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              {bid.coverLetter}
                            </p>
                          </div>
                        )}
                        <div className='flex gap-2'>
                          <Button size='sm'>View Profile</Button>
                          <Button size='sm' variant='outline'>
                            <MessageSquare className='mr-2 h-4 w-4' />
                            Message
                          </Button>
                          {bid.status === 'pending' && (
                            <>
                              <Button size='sm' variant='default'>
                                Accept Bid
                              </Button>
                              <Button size='sm' variant='destructive'>
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className='py-8 text-center'>
                      <Users className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
                      <p className='text-muted-foreground'>
                        No proposals received yet
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Job Budget & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <p className='text-muted-foreground mb-1 text-sm'>Budget</p>
                <p className='text-2xl font-bold'>
                  {job.budgetType === 'fixed' ? (
                    <>
                      ${job.budgetMin}
                      {job.budgetMax &&
                        job.budgetMax !== job.budgetMin &&
                        ` - $${job.budgetMax}`}
                    </>
                  ) : (
                    <>
                      ${job.budgetMin}/hr
                      {job.budgetMax &&
                        job.budgetMax !== job.budgetMin &&
                        ` - $${job.budgetMax}/hr`}
                    </>
                  )}
                </p>
                <Badge variant='outline' className='mt-2'>
                  {job.budgetType === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                </Badge>
              </div>

              {job.deadline && (
                <div>
                  <p className='text-muted-foreground mb-1 text-sm'>Deadline</p>
                  <p className='font-medium'>
                    {new Date(job.deadline).toLocaleDateString()}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDistanceToNow(new Date(job.deadline), {
                      addSuffix: true
                    })}
                  </p>
                </div>
              )}

              <Separator />

              <div className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Views</span>
                  <span className='font-medium'>{job.viewsCount}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Proposals</span>
                  <span className='font-medium'>{job.currentBidsCount}</span>
                </div>
              </div>

              {isFreelancer && !hasApplied && job.status === 'open' && (
                <>
                  <Separator />
                  <LoadingButton
                    onClick={handleApply}
                    isLoading={isApplying}
                    className='w-full'
                  >
                    Apply Now
                  </LoadingButton>
                </>
              )}

              {hasApplied && (
                <>
                  <Separator />
                  <div className='text-center'>
                    <CheckCircle2 className='mx-auto mb-2 h-8 w-8 text-green-600' />
                    <p className='text-sm font-medium'>
                      You've applied to this job
                    </p>
                    <Button variant='outline' size='sm' className='mt-2'>
                      View Your Proposal
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>About the Client</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage src={(job.client as any).avatarPath || ''} />
                  <AvatarFallback>
                    {job.client.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{job.client.name}</p>
                  {clientStats && clientStats.reviewCount > 0 && (
                    <div className='flex items-center gap-1'>
                      <Star className='h-3 w-3 fill-yellow-500 text-yellow-500' />
                      <span className='text-sm'>{clientStats.avgRating}</span>
                      <span className='text-muted-foreground text-sm'>
                        ({clientStats.reviewCount} review
                        {clientStats.reviewCount !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className='space-y-2 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Member since</span>
                  <span>
                    {new Date(job.client.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Jobs posted</span>
                  <span>{clientStats?.jobsPosted || 0}</span>
                </div>
                {clientStats && clientStats.jobsPosted > 0 && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Hire rate</span>
                    <span>{clientStats.hireRate}%</span>
                  </div>
                )}
                {clientStats?.location && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Location</span>
                    <span className='flex items-center gap-1'>
                      <MapPin className='h-3 w-3' />
                      {clientStats.location}
                    </span>
                  </div>
                )}
              </div>

              {!isOwner && (
                <Button variant='outline' className='w-full'>
                  <MessageSquare className='mr-2 h-4 w-4' />
                  Contact Client
                </Button>
              )}
            </CardContent>
          </Card>

          {/* TODO: Implement FeaturedJobsMini component */}
          {/* <FeaturedJobsMini className='lg:sticky lg:top-4' /> */}
        </div>
      </div>
    </div>
  )
}
