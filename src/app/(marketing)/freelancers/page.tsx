import { Suspense } from 'react'

import { Search, Users, Award, Star, Filter } from 'lucide-react'

import { FreelancerCard } from '@/components/blocks/freelancers/freelancer-card'
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
import { searchFreelancers } from '@/lib/db/queries/freelancers'

async function FreelancersList({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters = {
    search: params.search as string,
    skills: params.skills
      ? (params.skills as string).split(',').map(Number).filter(Boolean)
      : undefined,
    minRate: params.minRate ? parseFloat(params.minRate as string) : undefined,
    maxRate: params.maxRate ? parseFloat(params.maxRate as string) : undefined,
    experienceLevel: params.experienceLevel as
      | 'entry'
      | 'intermediate'
      | 'expert'
      | undefined,
    availability: params.availability as
      | 'available'
      | 'busy'
      | 'away'
      | undefined,
    languages: params.languages
      ? (params.languages as string).split(',')
      : undefined,
    minRating: params.minRating
      ? parseFloat(params.minRating as string)
      : undefined,
    verified: params.verified === 'true' ? true : undefined,
    sortBy:
      (params.sortBy as
        | 'newest'
        | 'rating'
        | 'price_low'
        | 'price_high'
        | 'experience') || 'newest',
    limit: 12,
    offset: params.page ? (parseInt(params.page as string) - 1) * 12 : 0
  }

  const result = await searchFreelancers(filters)

  if (!result.freelancers || result.freelancers.length === 0) {
    return (
      <div className='col-span-full'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Users className='text-muted-foreground mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>No Freelancers Found</h3>
            <p className='text-muted-foreground text-center text-sm'>
              Try adjusting your filters or search criteria
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {result.freelancers.map(freelancer => (
        <FreelancerCard
          key={freelancer.userId}
          freelancer={freelancer}
          displayMode='full'
        />
      ))}

      {Math.ceil(result.total / 12) > 1 && (
        <div className='col-span-full mt-8 flex justify-center gap-2'>
          {Array.from(
            { length: Math.ceil(result.total / 12) },
            (_, i) => i + 1
          ).map(page => {
            const currentPage = filters.offset
              ? Math.floor(filters.offset / 12) + 1
              : 1
            const urlParams = new URLSearchParams()
            Object.entries({
              search: params.search,
              skills: params.skills,
              minRate: params.minRate,
              maxRate: params.maxRate,
              experienceLevel: params.experienceLevel,
              availability: params.availability,
              languages: params.languages,
              minRating: params.minRating,
              verified: params.verified,
              sortBy: params.sortBy,
              page: page.toString()
            }).forEach(([key, value]) => {
              if (value) urlParams.set(key, value as string)
            })
            return (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size='sm'
                asChild
              >
                <a href={`?${urlParams.toString()}`}>{page}</a>
              </Button>
            )
          })}
        </div>
      )}
    </>
  )
}

function FreelancersLoading() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className='animate-pulse'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <div className='bg-muted h-16 w-16 rounded-full' />
                <div className='flex-1 space-y-3'>
                  <div className='bg-muted h-5 w-3/4 rounded' />
                  <div className='bg-muted h-4 w-full rounded' />
                  <div className='bg-muted h-4 w-1/2 rounded' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  )
}

export default async function FreelancersDirectoryPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  return (
    <div className='from-background to-muted/20 min-h-screen bg-gradient-to-b'>
      <div className='container mx-auto px-4 py-12'>
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-4xl font-bold'>Find Expert Freelancers</h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>
            Connect with skilled professionals ready to bring your projects to
            life
          </p>
        </div>

        <div className='mb-8'>
          <form className='mx-auto flex max-w-2xl gap-4'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                name='search'
                placeholder='Search by skills, title, or keywords...'
                defaultValue={params.search as string}
                className='pl-10'
              />
            </div>
            <Select
              name='sortBy'
              defaultValue={(params.sortBy as string) || 'relevance'}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='relevance'>Relevance</SelectItem>
                <SelectItem value='rating'>Highest Rated</SelectItem>
                <SelectItem value='rate_low'>Lowest Rate</SelectItem>
                <SelectItem value='rate_high'>Highest Rate</SelectItem>
                <SelectItem value='experience'>Most Experienced</SelectItem>
                <SelectItem value='recent'>Recently Active</SelectItem>
              </SelectContent>
            </Select>
            <Button type='submit'>
              <Search className='mr-2 h-4 w-4' />
              Search
            </Button>
          </form>
        </div>

        <div className='grid gap-8 lg:grid-cols-4'>
          <div className='lg:col-span-1'>
            <div className='sticky top-4'>
              <h2 className='mb-4 flex items-center gap-2 font-semibold'>
                <Filter className='h-4 w-4' />
                Filters
              </h2>
              {/* Filters will be implemented with proper props */}
              <div className='text-muted-foreground text-sm'>
                Use the search and sort options above to filter results.
              </div>
            </div>
          </div>

          <div className='lg:col-span-3'>
            <div className='mb-6'>
              <Card className='bg-primary/5 border-primary/20'>
                <CardContent className='p-4'>
                  <div className='grid grid-cols-1 gap-4 text-center md:grid-cols-3'>
                    <div>
                      <div className='mb-1 flex items-center justify-center gap-2'>
                        <Users className='text-primary h-4 w-4' />
                        <span className='text-2xl font-bold'>500+</span>
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        Active Freelancers
                      </p>
                    </div>
                    <div>
                      <div className='mb-1 flex items-center justify-center gap-2'>
                        <Star className='h-4 w-4 text-yellow-500' />
                        <span className='text-2xl font-bold'>4.8</span>
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        Average Rating
                      </p>
                    </div>
                    <div>
                      <div className='mb-1 flex items-center justify-center gap-2'>
                        <Award className='h-4 w-4 text-green-500' />
                        <span className='text-2xl font-bold'>95%</span>
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        Success Rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              <Suspense fallback={<FreelancersLoading />}>
                <FreelancersList searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
