import { Suspense } from 'react'

import { Star, DollarSign, Briefcase, Search, Users } from 'lucide-react'

import { FreelancerCard } from '@/components/blocks/freelancers/freelancer-card'
import {
  GamifiedHeader,
  GamifiedStatsCards,
  type StatCard
} from '@/components/blocks/trading'
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
import {
  searchFreelancers,
  getFreelancerPlatformStats
} from '@/lib/db/queries/freelancers'

interface SearchParams {
  search?: string
  skills?: string
  minRate?: string
  maxRate?: string
  experienceLevel?: 'entry' | 'intermediate' | 'expert'
  availability?: 'available' | 'busy' | 'away'
  sortBy?: 'newest' | 'rating' | 'price_low' | 'price_high' | 'experience'
}

async function FreelancersList({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: params.search,
    skills: params.skills?.split(',').map(Number).filter(Boolean),
    minRate: params.minRate ? parseInt(params.minRate) : undefined,
    maxRate: params.maxRate ? parseInt(params.maxRate) : undefined,
    experienceLevel: params.experienceLevel,
    availability: params.availability,
    sortBy: params.sortBy || 'newest',
    limit: 20
  }

  const { freelancers, total } = await searchFreelancers(filters)

  if (freelancers.length === 0) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-center'>
          <div className='mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20'>
            <Users className='h-12 w-12 text-blue-600 dark:text-blue-400' />
          </div>
          <h3 className='mb-2 text-2xl font-black'>NO FREELANCERS FOUND</h3>
          <p className='text-muted-foreground mb-6'>
            {params.search
              ? 'Try adjusting your search or filters'
              : 'Be the first to join as a freelancer'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {freelancers.map(freelancer => (
        <FreelancerCard
          key={freelancer.id}
          freelancer={freelancer}
          displayMode='full'
          showActions={true}
        />
      ))}
    </div>
  )
}

async function FreelancerStats() {
  const stats = await getFreelancerPlatformStats()

  const statsCards: StatCard[] = [
    {
      title: 'Active Freelancers',
      value: stats?.activeFreelancers ?? 0,
      subtitle: 'Available for hire',
      icon: <Users className='h-5 w-5 text-white' />,
      badge: 'TALENT',
      colorScheme: 'green'
    },
    {
      title: 'Success Rate',
      value: stats?.successRate ? `${Math.round(stats.successRate)}%` : '0%',
      subtitle: 'Completion rate',
      icon: <DollarSign className='h-5 w-5 text-white' />,
      badge: 'RELIABILITY',
      colorScheme: 'blue'
    },
    {
      title: 'Avg Rating',
      value: stats?.avgRating ? stats.avgRating.toFixed(1) : '0.0',
      subtitle: 'Quality assured',
      icon: <Star className='h-5 w-5 text-white' />,
      badge: 'QUALITY',
      colorScheme: 'purple'
    },
    {
      title: 'Top Skills',
      value: 15,
      subtitle: 'Categories covered',
      icon: <Briefcase className='h-5 w-5 text-white' />,
      badge: 'VARIETY',
      colorScheme: 'yellow'
    }
  ]

  return <GamifiedStatsCards cards={statsCards} />
}

export default async function FreelancersDirectoryPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title='FREELANCER DIRECTORY'
          subtitle='Connect with skilled professionals ready to bring your projects to life'
          icon={<Users className='h-8 w-8 text-white' />}
        />

        {/* Stats Cards */}
        <Suspense
          fallback={
            <div className='h-32 animate-pulse rounded-lg bg-gray-200' />
          }
        >
          <FreelancerStats />
        </Suspense>

        {/* Filters Section */}
        <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
          <CardContent className='p-6'>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <Search className='text-primary h-5 w-5' />
                <span className='text-lg font-bold'>SEARCH & FILTERS</span>
              </div>

              <form className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input
                  name='search'
                  placeholder='Search by name, title, or skills...'
                  defaultValue={params.search}
                  className='flex-1'
                />

                <Select
                  name='experienceLevel'
                  defaultValue={params.experienceLevel}
                >
                  <SelectTrigger className='w-full sm:w-[180px]'>
                    <SelectValue placeholder='Experience Level' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Levels</SelectItem>
                    <SelectItem value='entry'>Entry Level</SelectItem>
                    <SelectItem value='intermediate'>Intermediate</SelectItem>
                    <SelectItem value='expert'>Expert</SelectItem>
                  </SelectContent>
                </Select>

                <Select name='availability' defaultValue={params.availability}>
                  <SelectTrigger className='w-full sm:w-[140px]'>
                    <SelectValue placeholder='Availability' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='available'>Available</SelectItem>
                    <SelectItem value='busy'>Busy</SelectItem>
                    <SelectItem value='away'>Away</SelectItem>
                  </SelectContent>
                </Select>

                <Select name='sortBy' defaultValue={params.sortBy || 'newest'}>
                  <SelectTrigger className='w-full sm:w-[160px]'>
                    <SelectValue placeholder='Sort by' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='newest'>Newest</SelectItem>
                    <SelectItem value='rating'>Top Rated</SelectItem>
                    <SelectItem value='price_low'>
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value='price_high'>
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value='experience'>Most Experienced</SelectItem>
                  </SelectContent>
                </Select>

                <Button type='submit' className='w-full sm:w-auto'>
                  Search
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Freelancers Grid */}
        <Suspense
          fallback={
            <div className='h-96 animate-pulse rounded-lg bg-gray-200' />
          }
        >
          <FreelancersList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
