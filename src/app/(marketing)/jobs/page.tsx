'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  Briefcase,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Star,
  Calendar,
  ChevronRight
} from 'lucide-react'
import useSWR from 'swr'

import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes, refreshIntervals } from '@/config/app-routes'
import { useUnifiedWalletInfo } from '@/context'
import { cn } from '@/lib'
import { swrFetcher } from '@/lib/api/swr'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

export default function PublicJobsPage() {
  const router = useRouter()
  const { isConnected } = useUnifiedWalletInfo()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [experienceLevel, setExperienceLevel] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'price-high' | 'price-low'>(
    'recent'
  )

  // Fetch jobs
  const { data: jobsData, isLoading } = useSWR(
    apiEndpoints.jobs.list,
    swrFetcher,
    {
      refreshInterval: refreshIntervals.SLOW
    }
  )

  // Fetch featured jobs
  const { data: featuredData } = useSWR(
    apiEndpoints.jobs.featured,
    swrFetcher,
    {
      refreshInterval: refreshIntervals.SLOW
    }
  )

  // Fetch platform stats
  const { data: statsData } = useSWR(
    apiEndpoints.jobs.platformStats,
    swrFetcher,
    {
      refreshInterval: refreshIntervals.VERY_SLOW
    }
  )

  const jobs = jobsData?.jobs || []
  const featuredJobs = featuredData?.jobs || []
  const stats = statsData?.stats

  // Filter jobs
  const filteredJobs = jobs.filter((job: JobPostingWithRelations) => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return (
        job.title.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search) ||
        (Array.isArray(job.skillsRequired) &&
          job.skillsRequired.some((skill: string) =>
            skill.toLowerCase().includes(search)
          ))
      )
    }

    // Category filter
    if (category !== 'all' && job.category?.slug !== category) return false

    // Experience filter
    if (experienceLevel !== 'all' && job.experienceLevel !== experienceLevel) {
      return false
    }

    // Price range filter
    if (priceRange !== 'all') {
      const budget = job.budgetMax ? parseFloat(job.budgetMax) : 0
      switch (priceRange) {
        case 'under-100':
          if (budget >= 100) return false
          break
        case '100-500':
          if (budget < 100 || budget > 500) return false
          break
        case '500-1000':
          if (budget < 500 || budget > 1000) return false
          break
        case 'over-1000':
          if (budget < 1000) return false
          break
      }
    }

    return true
  })

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'price-high':
        return parseFloat(b.budgetMax || '0') - parseFloat(a.budgetMax || '0')
      case 'price-low':
        return parseFloat(a.budgetMax || '0') - parseFloat(b.budgetMax || '0')
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const handleJobClick = (job: JobPostingWithRelations) => {
    if (!isConnected) {
      return // Show connect wallet prompt
    }
    router.push(appRoutes.trades.jobs.detail(job.id))
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-foreground mb-4 text-4xl font-bold'>
            Find Your Next Project
          </h1>
          <p className='text-muted-foreground text-lg'>
            Browse thousands of freelance jobs from verified clients
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Open Jobs</CardTitle>
                <Briefcase className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.openJobs}</div>
                <p className='text-muted-foreground text-xs'>
                  Available right now
                </p>
              </CardContent>
            </Card>

            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Posted
                </CardTitle>
                <TrendingUp className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  ${stats.totalPosted?.toLocaleString() || 0}
                </div>
                <p className='text-muted-foreground text-xs'>
                  In project value
                </p>
              </CardContent>
            </Card>

            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Freelancers
                </CardTitle>
                <Users className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {stats.activeFreelancers}
                </div>
                <p className='text-muted-foreground text-xs'>Ready to work</p>
              </CardContent>
            </Card>

            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Avg. Budget
                </CardTitle>
                <DollarSign className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  ${stats.avgBudget?.toFixed(0) || 0}
                </div>
                <p className='text-muted-foreground text-xs'>Per project</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Featured Jobs */}
        {featuredJobs.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-foreground mb-4 text-2xl font-semibold'>
              Featured Jobs
            </h2>
            <div className='grid gap-4 sm:grid-cols-2'>
              {featuredJobs.slice(0, 4).map((job: JobPostingWithRelations) => (
                <Card
                  key={job.id}
                  className='border-border cursor-pointer border-2 bg-gradient-to-r from-blue-50 to-purple-50 transition-all hover:scale-105 dark:from-blue-950/20 dark:to-purple-950/20'
                  onClick={() => handleJobClick(job)}
                >
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-foreground text-lg'>
                          {job.title}
                        </CardTitle>
                        <div className='mt-2 flex items-center gap-2 text-sm'>
                          <Badge variant='secondary'>Featured</Badge>
                          <Badge variant='outline'>
                            {job.category?.name || 'General'}
                          </Badge>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-foreground text-lg font-bold'>
                          $
                          {job.budgetMax
                            ? parseFloat(job.budgetMax).toLocaleString()
                            : '0'}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {job.budgetType}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground line-clamp-2 text-sm'>
                      {job.description}
                    </p>
                    <div className='mt-4 flex items-center justify-between'>
                      <div className='flex items-center gap-4 text-xs'>
                        <span className='text-muted-foreground flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {job.projectDuration || 'Flexible'}
                        </span>
                        <span className='text-muted-foreground flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          Remote
                        </span>
                      </div>
                      {!isConnected && (
                        <Badge variant='outline' className='text-xs'>
                          Connect to Apply
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='mb-6 space-y-4'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            {/* Search */}
            <div className='relative flex-1 lg:max-w-md'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search jobs, skills, or keywords...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>

            {/* Filter Controls */}
            <div className='flex flex-wrap gap-2'>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='development'>Development</SelectItem>
                  <SelectItem value='design'>Design</SelectItem>
                  <SelectItem value='writing'>Writing</SelectItem>
                  <SelectItem value='marketing'>Marketing</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Budget' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Any Budget</SelectItem>
                  <SelectItem value='under-100'>Under $100</SelectItem>
                  <SelectItem value='100-500'>$100 - $500</SelectItem>
                  <SelectItem value='500-1000'>$500 - $1,000</SelectItem>
                  <SelectItem value='over-1000'>Over $1,000</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={experienceLevel}
                onValueChange={setExperienceLevel}
              >
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Experience' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Any Level</SelectItem>
                  <SelectItem value='entry'>Entry Level</SelectItem>
                  <SelectItem value='intermediate'>Intermediate</SelectItem>
                  <SelectItem value='expert'>Expert</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='recent'>Most Recent</SelectItem>
                  <SelectItem value='price-high'>Price: High to Low</SelectItem>
                  <SelectItem value='price-low'>Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className='flex min-h-[400px] items-center justify-center'>
            <Spinner size='lg' />
          </div>
        ) : sortedJobs.length === 0 ? (
          <Card className='border-border bg-card'>
            <CardContent className='flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8'>
              <Briefcase className='text-muted-foreground h-12 w-12' />
              <h3 className='text-foreground text-xl font-semibold'>
                No jobs found
              </h3>
              <p className='text-muted-foreground text-center'>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new opportunities'}
              </p>
              {!isConnected && (
                <div className='flex flex-col items-center gap-2'>
                  <p className='text-muted-foreground text-sm'>
                    Connect your wallet to post jobs or apply
                  </p>
                  <UnifiedConnectButton />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {sortedJobs.map((job: JobPostingWithRelations) => (
              <Card
                key={job.id}
                className={cn(
                  'border-border bg-card cursor-pointer transition-all hover:shadow-lg',
                  !isConnected && 'opacity-90'
                )}
                onClick={() => handleJobClick(job)}
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-foreground mb-2 text-xl'>
                        {job.title}
                      </CardTitle>
                      <div className='text-muted-foreground mb-3 flex flex-wrap items-center gap-4 text-sm'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-3.5 w-3.5' />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span className='flex items-center gap-1'>
                          <Clock className='h-3.5 w-3.5' />
                          {job.projectDuration || 'Flexible'}
                        </span>
                        <span className='flex items-center gap-1'>
                          <MapPin className='h-3.5 w-3.5' />
                          Remote
                        </span>
                        {job.client && (
                          <span className='flex items-center gap-1'>
                            <Star className='h-3.5 w-3.5 fill-yellow-400 text-yellow-400' />
                            New Client
                          </span>
                        )}
                      </div>
                      <p className='text-muted-foreground line-clamp-2'>
                        {job.description}
                      </p>
                    </div>
                    <div className='ml-4 text-right'>
                      <p className='text-foreground text-xl font-bold'>
                        $
                        {job.budgetMax
                          ? parseFloat(job.budgetMax).toLocaleString()
                          : '0'}
                      </p>
                      <p className='text-muted-foreground text-sm'>
                        {job.budgetType}
                      </p>
                      <Badge variant='outline' className='mt-2'>
                        {job.experienceLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <div className='flex flex-wrap gap-2'>
                      {Array.isArray(job.skillsRequired) &&
                        job.skillsRequired
                          .slice(0, 4)
                          .map((skill: string, index: number) => (
                            <Badge key={index} variant='secondary'>
                              {skill}
                            </Badge>
                          ))}
                      {Array.isArray(job.skillsRequired) &&
                        job.skillsRequired.length > 4 && (
                          <Badge variant='secondary'>
                            +{job.skillsRequired.length - 4} more
                          </Badge>
                        )}
                    </div>
                    {!isConnected ? (
                      <Badge variant='outline'>Connect to Apply</Badge>
                    ) : (
                      <Button size='sm' variant='ghost' className='gap-1'>
                        View Details
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                  <div className='text-muted-foreground mt-3 flex items-center gap-4 text-xs'>
                    <span>{job.bids?.length || 0} proposals</span>
                    <span>{job.viewCount || 0} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA for non-connected users */}
        {!isConnected && (
          <Card className='border-border bg-card mt-8'>
            <CardContent className='flex flex-col items-center justify-center space-y-4 p-8'>
              <h3 className='text-foreground text-xl font-semibold'>
                Start Your Freelance Journey
              </h3>
              <p className='text-muted-foreground text-center'>
                Connect your wallet to apply for jobs, post projects, and
                collaborate with top talent
              </p>
              <UnifiedConnectButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
