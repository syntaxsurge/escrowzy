import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  Star,
  Briefcase,
  TrendingUp,
  Award,
  FileText,
  Edit,
  Plus,
  Calendar,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  CheckCircle
} from 'lucide-react'

import { PortfolioGallery } from '@/components/blocks/freelancers/portfolio-gallery'
import { ProfileCompleteness } from '@/components/blocks/freelancers/profile-completeness'
import { VerifiedBadge } from '@/components/blocks/freelancers/verified-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getAuth } from '@/lib/auth/auth-utils'
import {
  getFreelancerProfile,
  getFreelancerStats,
  getFreelancerReviews
} from '@/lib/db/queries/freelancers'

export default async function FreelancerProfilePage() {
  const auth = await getAuth()
  if (!auth) {
    redirect('/login')
  }

  const profile = await getFreelancerProfile(auth.id)
  if (!profile) {
    redirect('/profile/freelancer/setup')
  }

  const stats = await getFreelancerStats(auth.id)
  const reviews = await getFreelancerReviews(auth.id, { limit: 5 })

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Freelancer Profile</h1>
          <p className='text-muted-foreground mt-2'>
            Manage your freelancer profile and track your performance
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' asChild>
            <Link href={`/freelancers/${auth.id}`}>
              <ExternalLink className='mr-2 h-4 w-4' />
              View Public Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href='/profile/freelancer/edit'>
              <Edit className='mr-2 h-4 w-4' />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <CardTitle className='text-2xl'>
                      {profile.professionalTitle}
                    </CardTitle>
                    {profile.verificationStatus === 'verified' && (
                      <VerifiedBadge />
                    )}
                  </div>
                  <CardDescription className='text-base'>
                    {profile.bio}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    profile.availability === 'available'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {profile.availability}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm'>Hourly Rate</p>
                  <p className='text-xl font-semibold'>
                    ${profile.hourlyRate}/hr
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm'>Experience</p>
                  <p className='text-xl font-semibold'>
                    {profile.yearsOfExperience} years
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm'>Rating</p>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                    <span className='text-xl font-semibold'>
                      {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm'>
                    Jobs Completed
                  </p>
                  <p className='text-xl font-semibold'>{stats.completedJobs}</p>
                </div>
              </div>

              <ProfileCompleteness profile={profile} />

              <div className='space-y-3'>
                <h3 className='font-semibold'>Skills</h3>
                <div className='flex flex-wrap gap-2'>
                  {profile.skills?.slice(0, 10).map(skill => (
                    <Badge key={skill.skillId} variant='secondary'>
                      {skill.skill.name}
                      {skill.skillLevel === 'expert' && (
                        <Award className='ml-1 h-3 w-3' />
                      )}
                    </Badge>
                  ))}
                  {profile.skills && profile.skills.length > 10 && (
                    <Button variant='ghost' size='sm' asChild>
                      <Link href='/profile/freelancer/skills'>
                        +{profile.skills.length - 10} more
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className='space-y-3'>
                <h3 className='font-semibold'>Languages</h3>
                <div className='flex flex-wrap gap-2'>
                  {((profile.languages as any[]) || []).map((lang: any) => (
                    <Badge key={lang.language} variant='outline'>
                      {lang.language} - {lang.proficiency}
                    </Badge>
                  ))}
                </div>
              </div>

              {(profile.portfolioUrl ||
                profile.linkedinUrl ||
                profile.githubUrl) && (
                <div className='space-y-3'>
                  <h3 className='font-semibold'>Professional Links</h3>
                  <div className='flex flex-wrap gap-3'>
                    {profile.portfolioUrl && (
                      <Button variant='outline' size='sm' asChild>
                        <a
                          href={profile.portfolioUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Globe className='mr-2 h-4 w-4' />
                          Portfolio
                        </a>
                      </Button>
                    )}
                    {profile.linkedinUrl && (
                      <Button variant='outline' size='sm' asChild>
                        <a
                          href={profile.linkedinUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Linkedin className='mr-2 h-4 w-4' />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {profile.githubUrl && (
                      <Button variant='outline' size='sm' asChild>
                        <a
                          href={profile.githubUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Github className='mr-2 h-4 w-4' />
                          GitHub
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Portfolio</CardTitle>
                <Button size='sm' asChild>
                  <Link href='/profile/freelancer/portfolio'>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Item
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profile.portfolioItems && profile.portfolioItems.length > 0 ? (
                <PortfolioGallery items={profile.portfolioItems} />
              ) : (
                <div className='rounded-lg border border-dashed p-8 text-center'>
                  <FileText className='text-muted-foreground mx-auto h-12 w-12' />
                  <p className='text-muted-foreground mt-2 text-sm'>
                    No portfolio items yet
                  </p>
                  <Button className='mt-4' asChild>
                    <Link href='/profile/freelancer/portfolio'>
                      Add Your First Project
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className='space-y-4'>
                  {reviews.map(review => (
                    <div
                      key={review.id}
                      className='border-b pb-4 last:border-0'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium'>
                              {review.client.username}
                            </p>
                            <div className='flex items-center'>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className='text-muted-foreground text-sm'>
                            {review.reviewText}
                          </p>
                        </div>
                        <time className='text-muted-foreground text-xs'>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground py-8 text-center text-sm'>
                  No reviews yet. Complete your first job to get reviewed!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Total Earnings</span>
                  <span className='font-semibold'>
                    ${parseFloat(stats.totalEarnings).toFixed(2)}
                  </span>
                </div>
                <Progress value={100} className='h-2' />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Active Jobs</span>
                  <span className='font-semibold'>{stats.activeBids}</span>
                </div>
                <Progress
                  value={(stats.activeBids / 10) * 100}
                  className='h-2'
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Proposals Sent</span>
                  <span className='font-semibold'>{stats.activeBids}</span>
                </div>
                <Progress
                  value={(stats.activeBids / 50) * 100}
                  className='h-2'
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span>Win Rate</span>
                  <span className='font-semibold'>
                    {stats.activeBids > 0
                      ? (
                          (stats.completedJobs / stats.activeBids) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    stats.activeBids > 0
                      ? (stats.completedJobs / stats.activeBids) * 100
                      : 0
                  }
                  className='h-2'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button
                variant='outline'
                className='w-full justify-start'
                asChild
              >
                <Link href='/jobs'>
                  <Briefcase className='mr-2 h-4 w-4' />
                  Browse Jobs
                </Link>
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                asChild
              >
                <Link href='/profile/freelancer/skills'>
                  <Award className='mr-2 h-4 w-4' />
                  Manage Skills
                </Link>
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                asChild
              >
                <Link href='/profile/freelancer/availability'>
                  <Calendar className='mr-2 h-4 w-4' />
                  Update Availability
                </Link>
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                asChild
              >
                <Link href='/profile/freelancer/portfolio'>
                  <FileText className='mr-2 h-4 w-4' />
                  Manage Portfolio
                </Link>
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                asChild
              >
                <Link href='/dashboard/freelancer'>
                  <TrendingUp className='mr-2 h-4 w-4' />
                  View Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Tips</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 text-green-500' />
                <div className='text-sm'>
                  <p className='font-medium'>Add more portfolio items</p>
                  <p className='text-muted-foreground'>
                    Showcase at least 3-5 of your best projects
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 text-green-500' />
                <div className='text-sm'>
                  <p className='font-medium'>Get verified</p>
                  <p className='text-muted-foreground'>
                    Complete identity verification for trust
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 text-green-500' />
                <div className='text-sm'>
                  <p className='font-medium'>Keep availability updated</p>
                  <p className='text-muted-foreground'>
                    Let clients know when you're available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
