'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import {
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Search,
  Star,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import useSWR from 'swr'

import { GamifiedHeader } from '@/components/blocks/trading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { appRoutes } from '@/config/app-routes'
import { cn, formatDate } from '@/lib/utils'

interface JobPosting {
  id: number
  title: string
  description: string
  budgetType: 'fixed' | 'hourly'
  budgetMin: string | null
  budgetMax: string | null
  currency: string
  deadline: string | null
  experienceLevel: string
  skillsRequired: string[]
  currentBidsCount: number
  viewsCount: number
  status: string
  createdAt: string
  client: {
    id: number
    name: string | null
    avatarPath: string | null
  }
  category: {
    id: number
    name: string
    icon: string | null
  } | null
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [experienceLevel, setExperienceLevel] = useState(
    searchParams.get('experience') || ''
  )
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  // Build query string
  const queryParams = new URLSearchParams()
  if (search) queryParams.append('search', search)
  if (category) queryParams.append('categoryId', category)
  if (experienceLevel) queryParams.append('experienceLevel', experienceLevel)
  queryParams.append('sortBy', sortBy)
  queryParams.append('status', 'open')

  const { data, error, isLoading } = useSWR(
    `/api/jobs?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  )

  const { data: categoriesData } = useSWR('/api/jobs/categories', fetcher)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (category) params.append('category', category)
    if (experienceLevel) params.append('experience', experienceLevel)
    if (sortBy !== 'newest') params.append('sort', sortBy)
    router.push(`/trades/jobs?${params.toString()}`)
  }

  const formatBudget = (job: JobPosting) => {
    if (job.budgetType === 'hourly') {
      if (job.budgetMin && job.budgetMax) {
        return `$${job.budgetMin}-$${job.budgetMax}/hr`
      }
      return job.budgetMin ? `$${job.budgetMin}/hr` : 'Budget TBD'
    } else {
      if (job.budgetMin && job.budgetMax) {
        return `$${job.budgetMin}-$${job.budgetMax}`
      }
      return job.budgetMin ? `$${job.budgetMin}` : 'Budget TBD'
    }
  }

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'entry':
        return 'bg-green-500/10 text-green-600 border-green-500/30'
      case 'intermediate':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      case 'expert':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/30'
    }
  }

  return (
    <div className='container mx-auto max-w-6xl space-y-6 p-4'>
      {/* Header */}
      <GamifiedHeader
        title='JOB MARKETPLACE'
        subtitle='Find your next opportunity or hire talented professionals'
        icon={<Briefcase className='h-8 w-8 text-white' />}
        actions={
          <Button
            onClick={() => router.push(appRoutes.trades.jobs.create)}
            className='bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
          >
            <Zap className='mr-2 h-4 w-4' />
            Post a Job
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card className='border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Active Jobs</p>
                <p className='text-2xl font-bold'>{data?.total || 0}</p>
              </div>
              <TrendingUp className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Avg Budget</p>
                <p className='text-2xl font-bold'>$2,500</p>
              </div>
              <DollarSign className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>Categories</p>
                <p className='text-2xl font-bold'>
                  {categoriesData?.categories?.length || 0}
                </p>
              </div>
              <Filter className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-xs'>New Today</p>
                <p className='text-2xl font-bold'>
                  {data?.jobs?.filter(
                    (job: JobPosting) =>
                      new Date(job.createdAt).toDateString() ===
                      new Date().toDateString()
                  ).length || 0}
                </p>
              </div>
              <Star className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className='p-6'>
          <form onSubmit={handleSearch} className='space-y-4'>
            <div className='flex gap-4'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search for jobs...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className='pl-10'
                />
              </div>
              <Button type='submit'>Search</Button>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>All Categories</SelectItem>
                  {categoriesData?.categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <span className='flex items-center gap-2'>
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={experienceLevel}
                onValueChange={setExperienceLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Experience Level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>All Levels</SelectItem>
                  <SelectItem value='entry'>Entry Level</SelectItem>
                  <SelectItem value='intermediate'>Intermediate</SelectItem>
                  <SelectItem value='expert'>Expert</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest First</SelectItem>
                  <SelectItem value='budget_high'>Highest Budget</SelectItem>
                  <SelectItem value='budget_low'>Lowest Budget</SelectItem>
                  <SelectItem value='deadline'>Deadline Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className='space-y-4'>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <Skeleton className='mb-2 h-6 w-3/4' />
                <Skeleton className='mb-4 h-4 w-full' />
                <div className='flex gap-2'>
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-6 w-20' />
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card>
            <CardContent className='p-6 text-center'>
              <p className='text-muted-foreground'>
                Failed to load jobs. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : data?.jobs?.length === 0 ? (
          <Card>
            <CardContent className='p-12 text-center'>
              <Briefcase className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>No jobs found</h3>
              <p className='text-muted-foreground'>
                Try adjusting your search filters or check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          data?.jobs?.map((job: JobPosting) => (
            <Card
              key={job.id}
              className='cursor-pointer transition-shadow hover:shadow-lg'
              onClick={() => router.push(appRoutes.trades.jobs.detail(job.id))}
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='mb-2 flex items-center gap-3'>
                      <h3 className='text-lg font-semibold'>{job.title}</h3>
                      <Badge
                        variant='outline'
                        className={cn(
                          getExperienceBadgeColor(job.experienceLevel)
                        )}
                      >
                        {job.experienceLevel}
                      </Badge>
                    </div>

                    <p className='text-muted-foreground mb-4 line-clamp-2'>
                      {job.description}
                    </p>

                    <div className='mb-4 flex flex-wrap gap-2'>
                      {job.skillsRequired.slice(0, 5).map((skill: string) => (
                        <Badge key={skill} variant='secondary'>
                          {skill}
                        </Badge>
                      ))}
                      {job.skillsRequired.length > 5 && (
                        <Badge variant='outline'>
                          +{job.skillsRequired.length - 5} more
                        </Badge>
                      )}
                    </div>

                    <div className='text-muted-foreground flex flex-wrap items-center gap-4 text-sm'>
                      <span className='flex items-center gap-1'>
                        <DollarSign className='h-4 w-4' />
                        {formatBudget(job)}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-4 w-4' />
                        {formatDate(job.createdAt, 'relative')}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Users className='h-4 w-4' />
                        {job.currentBidsCount} proposals
                      </span>
                      {job.deadline && (
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          Due {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {job.category && (
                        <Badge variant='outline'>
                          {job.category.icon} {job.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className='text-muted-foreground h-5 w-5' />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.pagination?.hasMore && (
        <div className='flex justify-center'>
          <Button variant='outline'>Load More</Button>
        </div>
      )}
    </div>
  )
}
