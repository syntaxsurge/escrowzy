'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import {
  Briefcase,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  BookmarkCheck,
  FileText
} from 'lucide-react'
import useSWR from 'swr'

import {
  JobListingCard,
  JobListingCardSkeleton,
  JobFilters,
  FeaturedJobs,
  type JobFilterValues
} from '@/components/blocks/jobs'
import { PageHeader } from '@/components/blocks/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

type TabValue = 'all' | 'saved' | 'my-jobs' | 'drafts'

export default function JobsMarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useSession()

  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<JobFilterValues>({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('category')
      ? parseInt(searchParams.get('category')!)
      : undefined,
    sortBy: 'newest'
  })

  // Fetch platform stats
  const { data: platformStatsResponse } = useSWR(
    '/api/jobs/platform-stats',
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response : null
    }
  )

  const platformStats = platformStatsResponse?.success
    ? {
        openJobs: (platformStatsResponse as any).openJobs,
        averageBudget: (platformStatsResponse as any).averageBudget,
        activeFreelancers: (platformStatsResponse as any).activeFreelancers,
        jobsPostedToday: (platformStatsResponse as any).jobsPostedToday
      }
    : null

  // Fetch categories
  const { data: categoriesData } = useSWR(
    apiEndpoints.jobs.categories,
    async () => {
      const res = await api.get(apiEndpoints.jobs.categories)
      return res.success ? (res as any).categories : []
    }
  )

  // Build API URL based on filters
  const buildApiUrl = () => {
    const params = new URLSearchParams()

    if (activeTab === 'saved') {
      return `${apiEndpoints.jobs.base}/saved`
    }

    if (activeTab === 'my-jobs') {
      params.append('clientId', user?.id?.toString() || '')
    }

    if (activeTab === 'drafts') {
      return apiEndpoints.jobs.drafts
    }

    if (filters.search) params.append('search', filters.search)
    if (filters.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    if (filters.budgetMin)
      params.append('budgetMin', filters.budgetMin.toString())
    if (filters.budgetMax)
      params.append('budgetMax', filters.budgetMax.toString())
    if (filters.experienceLevel)
      params.append('experienceLevel', filters.experienceLevel)
    if (filters.skills?.length)
      params.append('skills', filters.skills.join(','))
    if (filters.sortBy) params.append('sortBy', filters.sortBy)

    return `${apiEndpoints.jobs.base}?${params.toString()}`
  }

  // Fetch jobs
  const {
    data: jobsData,
    isLoading,
    mutate
  } = useSWR([buildApiUrl(), activeTab], async ([url]) => {
    const res = await api.get(url)
    return res.success ? res : { jobs: [], total: 0 }
  })

  const jobs = (jobsData as any)?.jobs || []
  const total = (jobsData as any)?.total || 0

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.categoryId)
      params.set('category', filters.categoryId.toString())

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname

    window.history.replaceState({}, '', newUrl)
  }, [filters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchQuery }))
  }

  const handleCreateJob = () => {
    router.push(appRoutes.trades.jobs.create)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue)
    if (value === 'saved' || value === 'my-jobs' || value === 'drafts') {
      if (!user) {
        router.push('/login')
      }
    }
  }

  // Stats cards
  const stats = [
    {
      label: 'Open Jobs',
      value: platformStats?.openJobs?.toString() || total.toString(),
      icon: Briefcase,
      color: 'text-blue-600'
    },
    {
      label: 'Avg Budget',
      value: platformStats?.averageBudget
        ? `$${platformStats.averageBudget.toLocaleString()}`
        : jobs.length > 0
          ? `$${Math.round(
              jobs.reduce(
                (sum: number, job: JobPostingWithRelations) =>
                  sum + parseInt(job.budgetMax || job.budgetMin || '0'),
                0
              ) / jobs.length
            )}`
          : '$0',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Active Freelancers',
      value: platformStats?.activeFreelancers?.toLocaleString() || '0',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: 'Jobs Posted Today',
      value:
        platformStats?.jobsPostedToday?.toString() ||
        jobs
          .filter((job: JobPostingWithRelations) => {
            const today = new Date()
            const jobDate = new Date(job.createdAt)
            return jobDate.toDateString() === today.toDateString()
          })
          .length.toString(),
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <PageHeader
        title='Job Marketplace'
        subtitle='Find freelance opportunities or post your projects'
        icon={<Briefcase className='h-6 w-6' />}
        actions={
          user && (
            <Button onClick={handleCreateJob}>
              <Plus className='mr-2 h-4 w-4' />
              Post a Job
            </Button>
          )
        }
      />

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>{stat.label}</p>
                  <p className='text-2xl font-bold'>{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Jobs */}
      <FeaturedJobs />

      {/* Search and Tabs */}
      <div className='space-y-4'>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <form onSubmit={handleSearch} className='flex-1'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder='Search jobs by title or description...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pr-24 pl-10'
              />
              <Button
                type='submit'
                size='sm'
                className='absolute top-1/2 right-1 -translate-y-1/2 transform'
              >
                Search
              </Button>
            </div>
          </form>

          <Button
            variant='outline'
            onClick={() => setShowFilters(!showFilters)}
            className='sm:w-auto'
          >
            <Filter className='mr-2 h-4 w-4' />
            Filters
            {Object.keys(filters).length > 1 && (
              <Badge variant='secondary' className='ml-2'>
                {Object.keys(filters).length - 1}
              </Badge>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className='grid w-full grid-cols-4 sm:w-auto sm:grid-cols-none'>
            <TabsTrigger value='all' className='flex items-center gap-2'>
              <Briefcase className='h-4 w-4' />
              All Jobs
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value='saved' className='flex items-center gap-2'>
                  <BookmarkCheck className='h-4 w-4' />
                  Saved
                </TabsTrigger>
                <TabsTrigger
                  value='my-jobs'
                  className='flex items-center gap-2'
                >
                  <FileText className='h-4 w-4' />
                  My Jobs
                </TabsTrigger>
                <TabsTrigger value='drafts' className='flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  Drafts
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-4'>
        {/* Filters Sidebar */}
        {showFilters && (
          <div className='lg:col-span-1'>
            <JobFilters
              filters={filters}
              categories={categoriesData || []}
              availableSkills={[
                'JavaScript',
                'TypeScript',
                'React',
                'Node.js',
                'Python',
                'Java',
                'PHP',
                'Ruby',
                'Go',
                'UI/UX Design',
                'Graphic Design',
                'Logo Design',
                'Content Writing',
                'Copywriting',
                'SEO',
                'Digital Marketing',
                'Social Media',
                'Video Editing'
              ]}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {/* Jobs List */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <div className='space-y-4'>
            {/* Results Header */}
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    Showing {jobs.length} of {total} jobs
                    {filters.search && ` for "${filters.search}"`}
                  </>
                )}
              </p>

              <JobFilters
                filters={filters}
                categories={categoriesData || []}
                onFiltersChange={setFilters}
                showCompact
              />
            </div>

            {/* Jobs Grid */}
            {isLoading ? (
              <div className='space-y-4'>
                {[1, 2, 3].map(i => (
                  <JobListingCardSkeleton key={i} />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className='space-y-4'>
                {jobs.map((job: JobPostingWithRelations) => (
                  <JobListingCard
                    key={job.id}
                    job={job}
                    onSave={() => mutate()}
                    onApply={jobId => {
                      // Navigate to job details or open apply modal
                      router.push(appRoutes.trades.jobs.detail(jobId))
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className='py-12 text-center'>
                  <Briefcase className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
                  <h3 className='mb-2 text-lg font-semibold'>No jobs found</h3>
                  <p className='text-muted-foreground'>
                    {activeTab === 'saved'
                      ? "You haven't saved any jobs yet"
                      : activeTab === 'my-jobs'
                        ? "You haven't posted any jobs yet"
                        : activeTab === 'drafts'
                          ? "You don't have any draft jobs"
                          : 'Try adjusting your filters or search criteria'}
                  </p>
                  {activeTab === 'my-jobs' && (
                    <Button className='mt-4' onClick={handleCreateJob}>
                      <Plus className='mr-2 h-4 w-4' />
                      Post Your First Job
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Load More */}
            {(jobsData as any)?.pagination?.hasMore && (
              <div className='pt-4 text-center'>
                <Button variant='outline'>Load More Jobs</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
