import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Award,
  MessageSquare,
  Globe,
  Github,
  Linkedin,
  CheckCircle,
  Share2,
  Flag
} from 'lucide-react'

import { PortfolioGallery } from '@/components/blocks/freelancers/portfolio-gallery'
import { SaveProfileButton } from '@/components/blocks/freelancers/save-profile-button'
import { VerifiedBadge } from '@/components/blocks/freelancers/verified-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAuth } from '@/lib/auth/auth-utils'
import {
  getFreelancerProfile,
  getFreelancerStats,
  getFreelancerReviews,
  isFreelancerSaved
} from '@/lib/db/queries/freelancers'

export default async function PublicFreelancerProfilePage({
  params
}: {
  params: { id: string }
}) {
  const userId = parseInt(params.id)
  if (isNaN(userId)) {
    notFound()
  }

  const profile = await getFreelancerProfile(userId)

  if (!profile) {
    notFound()
  }

  const [stats, reviews, auth] = await Promise.all([
    getFreelancerStats(userId),
    getFreelancerReviews(userId, { limit: 10 }),
    getAuth()
  ])

  const isOwnProfile = auth?.id === userId
  const isSaved = auth ? await isFreelancerSaved(auth.id, profile.id) : false
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length
      : 0

  // Calculate real stats
  const calculateProfileCompleteness = () => {
    let score = 0
    const weights = {
      bio: 15,
      skills: 20,
      portfolio: 20,
      hourlyRate: 10,
      languages: 10,
      portfolioUrl: 5,
      linkedinUrl: 5,
      githubUrl: 5,
      yearsOfExperience: 10
    }

    if (profile.bio) score += weights.bio
    if (profile.freelancerSkills && profile.freelancerSkills.length > 0)
      score += weights.skills
    if (profile.portfolioItems && profile.portfolioItems.length > 0)
      score += weights.portfolio
    if (profile.hourlyRate) score += weights.hourlyRate
    if (profile.languages && (profile.languages as any[]).length > 0)
      score += weights.languages
    if (profile.portfolioUrl) score += weights.portfolioUrl
    if (profile.linkedinUrl) score += weights.linkedinUrl
    if (profile.githubUrl) score += weights.githubUrl
    if (profile.yearsOfExperience > 0) score += weights.yearsOfExperience

    return Math.min(100, score)
  }

  const calculateResponseRate = () => {
    // Use response time from profile or default to 95%
    if (profile.responseTime && profile.responseTime <= 24) {
      return 100
    } else if (profile.responseTime && profile.responseTime <= 48) {
      return 90
    } else if (profile.responseTime && profile.responseTime <= 72) {
      return 80
    }
    return 95 // Default for profiles without data
  }

  const calculateOnTimeDelivery = () => {
    // Use completion rate from profile or default to 100%
    return profile.completionRate || 100
  }

  const profileCompleteness = calculateProfileCompleteness()
  const responseRate = calculateResponseRate()
  const onTimeDelivery = calculateOnTimeDelivery()

  const skillsByCategory =
    profile.skills?.reduce(
      (acc: Record<string, any[]>, skill: any) => {
        const category = skill.skill.categoryId ? 'Categorized' : 'Other'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(skill)
        return acc
      },
      {} as Record<string, any[]>
    ) || {}

  return (
    <div className='from-background to-muted/20 min-h-screen bg-gradient-to-b'>
      <div className='container mx-auto px-4 py-8'>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-start gap-6'>
                  <Avatar className='h-24 w-24'>
                    <AvatarImage src={profile.user?.avatarUrl || undefined} />
                    <AvatarFallback className='text-2xl'>
                      {profile.user?.name?.substring(0, 2).toUpperCase() ||
                        'FL'}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='mb-1 flex items-center gap-2'>
                          <h1 className='text-2xl font-bold'>
                            {profile.user?.name}
                          </h1>
                          {profile.verificationStatus === 'verified' && (
                            <VerifiedBadge />
                          )}
                        </div>
                        <p className='text-muted-foreground mb-3 text-lg'>
                          {profile.professionalTitle}
                        </p>
                        <div className='flex flex-wrap items-center gap-4 text-sm'>
                          {profile.timezone && (
                            <div className='flex items-center gap-1'>
                              <MapPin className='h-4 w-4' />
                              <span>{profile.timezone}</span>
                            </div>
                          )}
                          <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            <span>
                              {profile.yearsOfExperience} years experience
                            </span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <DollarSign className='h-4 w-4' />
                            <span>${profile.hourlyRate}/hour</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={
                          profile.availability === 'available'
                            ? 'default'
                            : profile.availability === 'busy'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {profile.availability}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className='mt-6'>
                  <p className='text-muted-foreground leading-relaxed'>
                    {profile.bio}
                  </p>
                </div>

                <div className='mt-6 flex flex-wrap gap-3'>
                  {!isOwnProfile && (
                    <>
                      <Button asChild>
                        <Link href={`/messages?user=${params.id}`}>
                          <MessageSquare className='mr-2 h-4 w-4' />
                          Contact Me
                        </Link>
                      </Button>
                      <SaveProfileButton
                        freelancerId={params.id}
                        isSaved={isSaved}
                        isAuthenticated={!!auth}
                      />
                    </>
                  )}
                  {isOwnProfile && (
                    <Button asChild>
                      <Link href='/profile/freelancer/edit'>Edit Profile</Link>
                    </Button>
                  )}
                  <Button variant='ghost' size='icon'>
                    <Share2 className='h-4 w-4' />
                  </Button>
                  {!isOwnProfile && (
                    <Button variant='ghost' size='icon'>
                      <Flag className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue='overview' className='space-y-4'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='portfolio'>Portfolio</TabsTrigger>
                <TabsTrigger value='reviews'>Reviews</TabsTrigger>
                <TabsTrigger value='skills'>Skills</TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                      <div className='text-center'>
                        <div className='text-2xl font-bold'>
                          {stats.completedJobs}
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Jobs Completed
                        </p>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold'>
                          {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Average Rating
                        </p>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold'>
                          {stats.activeBids > 0
                            ? `${((stats.completedJobs / stats.activeBids) * 100).toFixed(0)}%`
                            : 'N/A'}
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Success Rate
                        </p>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold'>
                          ${parseFloat(stats.totalEarnings).toFixed(0)}
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Total Earned
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {Array.isArray(profile.languages) &&
                profile.languages.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {((profile.languages as any[]) || []).map(
                          (lang: any) => (
                            <div
                              key={lang.language}
                              className='flex items-center justify-between'
                            >
                              <span className='font-medium'>
                                {lang.language}
                              </span>
                              <Badge variant='outline'>
                                {lang.proficiency}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>

              <TabsContent value='portfolio' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                    <CardDescription>
                      {profile.portfolioItems?.length || 0} projects showcased
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profile.portfolioItems &&
                    profile.portfolioItems.length > 0 ? (
                      <PortfolioGallery items={profile.portfolioItems} />
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        No portfolio items available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='reviews' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle>Client Reviews</CardTitle>
                      <div className='flex items-center gap-2'>
                        <div className='flex items-center'>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(averageRating)
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className='font-semibold'>
                          {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                        </span>
                        <span className='text-muted-foreground text-sm'>
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <div className='space-y-4'>
                        {reviews.map((review: any) => (
                          <div
                            key={review.id}
                            className='border-b pb-4 last:border-0'
                          >
                            <div className='mb-2 flex items-start justify-between'>
                              <div>
                                <p className='font-medium'>
                                  {review.client.username}
                                </p>
                                <div className='mt-1 flex items-center gap-2'>
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
                                  <span className='text-muted-foreground text-sm'>
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {review.wouldHireAgain && (
                                <Badge variant='success'>
                                  Would Hire Again
                                </Badge>
                              )}
                            </div>
                            <p className='text-muted-foreground text-sm'>
                              {review.reviewText}
                            </p>
                            {review.skillsRating && (
                              <div className='mt-3 flex flex-wrap gap-4 text-sm'>
                                <div>
                                  Communication:{' '}
                                  {review.communicationRating || 0}/5
                                </div>
                                <div>
                                  Quality: {review.qualityRating || 0}/5
                                </div>
                                <div>
                                  Deadline: {review.deadlineRating || 0}/5
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        No reviews yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='skills' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                    <CardDescription>
                      {profile.skills?.length || 0} skills listed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(skillsByCategory).length > 0 ? (
                      <div className='space-y-6'>
                        {Object.entries(skillsByCategory).map(
                          ([category, skills]) => (
                            <div key={category}>
                              <h3 className='mb-3 font-semibold'>{category}</h3>
                              <div className='flex flex-wrap gap-2'>
                                {(skills as any[]).map((skillItem: any) => (
                                  <Badge
                                    key={skillItem.skillId}
                                    variant={
                                      skillItem.isVerified
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {skillItem.skill.name}
                                    {skillItem.skillLevel === 'expert' && (
                                      <Award className='ml-1 h-3 w-3' />
                                    )}
                                    {skillItem.isVerified && (
                                      <CheckCircle className='ml-1 h-3 w-3' />
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        No skills listed
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Profile Completeness</span>
                    <span className='font-semibold'>
                      {profileCompleteness}%
                    </span>
                  </div>
                  <Progress value={profileCompleteness} className='h-2' />
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Response Rate</span>
                    <span className='font-semibold'>{responseRate}%</span>
                  </div>
                  <Progress value={responseRate} className='h-2' />
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>On-Time Delivery</span>
                    <span className='font-semibold'>{onTimeDelivery}%</span>
                  </div>
                  <Progress value={onTimeDelivery} className='h-2' />
                </div>
              </CardContent>
            </Card>

            {(profile.portfolioUrl ||
              profile.linkedinUrl ||
              profile.githubUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Professional Links</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {profile.portfolioUrl && (
                    <Button
                      variant='outline'
                      className='w-full justify-start'
                      asChild
                    >
                      <a
                        href={profile.portfolioUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Globe className='mr-2 h-4 w-4' />
                        Portfolio Website
                      </a>
                    </Button>
                  )}
                  {profile.linkedinUrl && (
                    <Button
                      variant='outline'
                      className='w-full justify-start'
                      asChild
                    >
                      <a
                        href={profile.linkedinUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Linkedin className='mr-2 h-4 w-4' />
                        LinkedIn Profile
                      </a>
                    </Button>
                  )}
                  {profile.githubUrl && (
                    <Button
                      variant='outline'
                      className='w-full justify-start'
                      asChild
                    >
                      <a
                        href={profile.githubUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Github className='mr-2 h-4 w-4' />
                        GitHub Profile
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Status</span>
                  <Badge
                    variant={
                      profile.availability === 'available'
                        ? 'default'
                        : profile.availability === 'busy'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {profile.availability}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Response Time</span>
                  <span className='text-sm font-medium'>Within 24 hours</span>
                </div>
                {profile.timezone && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Timezone</span>
                    <span className='text-sm font-medium'>
                      {profile.timezone}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hire This Freelancer</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center'>
                  <p className='text-3xl font-bold'>${profile.hourlyRate}</p>
                  <p className='text-muted-foreground text-sm'>per hour</p>
                </div>
                {!isOwnProfile && (
                  <Button className='w-full' asChild>
                    <Link href={`/jobs/create?freelancer=${params.id}`}>
                      <Briefcase className='mr-2 h-4 w-4' />
                      Hire Me
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
