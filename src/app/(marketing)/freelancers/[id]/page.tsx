import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  Star,
  Clock,
  DollarSign,
  Briefcase,
  Award,
  Globe,
  Github,
  Linkedin,
  CheckCircle,
  User,
  Target,
  Eye,
  Users as UsersIcon,
  Trophy,
  Zap,
  Shield,
  Sparkles,
  Activity,
  MessageSquare
} from 'lucide-react'

import { PortfolioGallery } from '@/components/blocks/freelancers/portfolio-gallery'
import { SaveProfileButton } from '@/components/blocks/freelancers/save-profile-button'
import { SendMessageButton } from '@/components/blocks/freelancers/send-message-button'
import { VerifiedBadge } from '@/components/blocks/freelancers/verified-badge'
import {
  GamifiedStatsCards,
  type StatCard
} from '@/components/blocks/trading/gamified-stats-cards'
import { UserAvatar } from '@/components/blocks/user-avatar'
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
import { appRoutes } from '@/config/app-routes'
import { getAuth } from '@/lib/auth/auth-utils'
import {
  getFreelancerProfile,
  getFreelancerStats,
  getFreelancerReviews,
  isFreelancerSaved
} from '@/lib/db/queries/freelancers'
import { RewardsService } from '@/services/rewards'

export default async function PublicFreelancerProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) {
    notFound()
  }

  const profile = await getFreelancerProfile(userId)

  if (!profile) {
    notFound()
  }

  const rewardsService = new RewardsService()
  const [stats, reviews, auth, userGameData] = await Promise.all([
    getFreelancerStats(userId),
    getFreelancerReviews(userId, { limit: 10 }),
    getAuth(),
    rewardsService.getOrCreateGameData(userId).catch(() => null)
  ])

  const userStats = userGameData
    ? {
        level: userGameData.level,
        xp: userGameData.xp,
        achievements: []
      }
    : null

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
    if (profile.skills && profile.skills.length > 0) score += weights.skills
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

  // Calculate stats for gamified cards with enhanced design
  const statsCards: StatCard[] = [
    {
      title: 'Revenue Generated',
      value: `$${parseFloat(stats.totalEarnings).toLocaleString()}`,
      subtitle: 'Total lifetime earnings',
      icon: <DollarSign className='h-5 w-5' />,
      badge: 'WEALTH',
      colorScheme: parseFloat(stats.totalEarnings) >= 10000 ? 'green' : 'yellow'
    },
    {
      title: 'Win Rate',
      value: `${stats.completionRate}%`,
      subtitle: `${stats.completedJobs} victories`,
      icon: <Trophy className='h-5 w-5' />,
      badge: 'CHAMPION',
      colorScheme:
        stats.completionRate >= 95
          ? 'purple'
          : stats.completionRate >= 90
            ? 'blue'
            : 'yellow'
    },
    {
      title: 'Reputation Score',
      value: averageRating > 0 ? `${averageRating.toFixed(1)} ⭐` : 'New',
      subtitle: `${reviews.length} testimonials`,
      icon: <Star className='h-5 w-5' />,
      badge: 'LEGENDARY',
      colorScheme:
        averageRating >= 4.8
          ? 'purple'
          : averageRating >= 4.5
            ? 'blue'
            : averageRating > 0
              ? 'orange'
              : 'yellow'
    },
    {
      title: 'Battle Power',
      value: userStats ? `${Math.round(userStats.xp / 100)}` : '0',
      subtitle: `Level ${userStats?.level || 1} Warrior`,
      icon: <Zap className='h-5 w-5' />,
      badge: 'POWER',
      colorScheme:
        userStats && userStats.level >= 50
          ? 'purple'
          : userStats && userStats.level >= 25
            ? 'blue'
            : 'yellow'
    }
  ]

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-6 px-4 py-6'>
        {/* Gamified Social Media Header */}
        <div className='border-primary/20 from-primary/20 relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br via-purple-600/20 to-cyan-600/20 p-8'>
          <div className='bg-grid-white/5 absolute inset-0' />
          <div className='relative z-10'>
            <div className='flex flex-col items-center gap-6 md:flex-row md:items-start'>
              {/* Profile Avatar */}
              <div className='relative'>
                <div className='absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 blur' />
                <div className='relative'>
                  <UserAvatar
                    user={{
                      ...profile.user,
                      walletAddress: profile.user.walletAddress || undefined
                    }}
                    size='xl'
                    className='h-32 w-32 border-4 border-white shadow-2xl dark:border-gray-800'
                  />
                  {profile.availability === 'available' && (
                    <div className='absolute right-2 bottom-2 h-6 w-6 rounded-full border-4 border-white bg-green-500 dark:border-gray-800' />
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className='flex-1 text-center md:text-left'>
                <div className='flex items-center justify-center gap-3 md:justify-start'>
                  <h1 className='text-3xl font-bold text-white'>
                    {profile.user?.name || 'Anonymous Freelancer'}
                  </h1>
                  {profile.verificationStatus === 'verified' && (
                    <VerifiedBadge />
                  )}
                  {userStats && userStats.level >= 50 && (
                    <Badge className='bg-gradient-to-r from-yellow-500 to-orange-500 text-white'>
                      <Trophy className='mr-1 h-3 w-3' />
                      Elite
                    </Badge>
                  )}
                </div>
                <p className='mt-1 text-xl text-gray-300'>
                  {profile.professionalTitle || 'Professional Freelancer'}
                </p>

                {/* Social Stats */}
                <div className='mt-4 flex flex-wrap items-center justify-center gap-6 md:justify-start'>
                  <div className='flex items-center gap-2'>
                    <Eye className='h-4 w-4 text-gray-400' />
                    <span className='font-semibold text-white'>
                      {stats.profileViews.toLocaleString()}
                    </span>
                    <span className='text-gray-400'>views</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <UsersIcon className='h-4 w-4 text-gray-400' />
                    <span className='font-semibold text-white'>
                      {stats.savedByClients}
                    </span>
                    <span className='text-gray-400'>followers</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-4 w-4 text-gray-400' />
                    <span className='font-semibold text-white'>
                      {stats.completedJobs}
                    </span>
                    <span className='text-gray-400'>completed</span>
                  </div>
                  {userStats && (
                    <div className='flex items-center gap-2'>
                      <Zap className='h-4 w-4 text-yellow-400' />
                      <span className='font-semibold text-white'>
                        Level {userStats.level}
                      </span>
                      <span className='text-gray-400'>
                        ({userStats.xp.toLocaleString()} XP)
                      </span>
                    </div>
                  )}
                </div>

                {/* XP Progress Bar */}
                {userStats && (
                  <div className='mt-4 max-w-md'>
                    <div className='mb-1 flex justify-between text-sm'>
                      <span className='text-gray-400'>Level Progress</span>
                      <span className='text-gray-400'>
                        {Math.round(((userStats.xp % 1000) / 1000) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={((userStats.xp % 1000) / 1000) * 100}
                      className='h-2 bg-gray-700'
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col gap-2 sm:flex-row md:flex-col'>
                {!isOwnProfile && (
                  <>
                    <SendMessageButton
                      currentUserId={auth?.id}
                      targetUserId={userId}
                      isAuthenticated={!!auth}
                    />
                    <SaveProfileButton
                      freelancerId={id}
                      isSaved={isSaved}
                      isAuthenticated={!!auth}
                    />
                  </>
                )}
                {isOwnProfile && (
                  <Button
                    asChild
                    className='border-0 bg-gradient-to-r from-blue-600 to-cyan-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-cyan-800 hover:shadow-xl'
                  >
                    <Link href='/profile/freelancer/setup'>Edit Profile</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />
        {/* Achievement Badges Section */}
        {userStats &&
          userStats.achievements &&
          userStats.achievements.length > 0 && (
            <Card className='border-primary/20 from-primary/10 border-2 bg-gradient-to-br via-purple-600/10 to-cyan-600/10 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Award className='h-5 w-5 text-yellow-500' />
                  Achievement Showcase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-3'>
                  {userStats.achievements
                    .slice(0, 8)
                    .map((achievement: any, index: number) => (
                      <div
                        key={index}
                        className='group border-primary/20 from-primary/5 hover:border-primary/40 relative overflow-hidden rounded-lg border bg-gradient-to-br to-purple-600/5 p-3 transition-all hover:scale-105'
                      >
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 p-1.5'>
                            <Trophy className='h-4 w-4 text-white' />
                          </div>
                          <div>
                            <p className='text-sm font-semibold'>
                              {achievement.name}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform group-hover:translate-x-full' />
                      </div>
                    ))}
                  {userStats.achievements.length > 8 && (
                    <Badge
                      variant='outline'
                      className='border-primary/20 self-center'
                    >
                      +{userStats.achievements.length - 8} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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
                        : profile.availability === 'busy'
                          ? 'secondary'
                          : 'outline'
                    }
                    className='text-sm'
                  >
                    {profile.availability === 'available'
                      ? 'Available'
                      : profile.availability === 'busy'
                        ? 'Busy'
                        : 'Away'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-3 gap-4'>
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
                    <p className='text-muted-foreground text-sm'>Timezone</p>
                    <p className='text-sm font-semibold'>
                      {profile.timezone || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Skills Section */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className='space-y-3'>
                    <h3 className='font-semibold'>Skills</h3>
                    <div className='flex flex-wrap gap-2'>
                      {profile.skills.slice(0, 10).map((skill: any) => (
                        <Badge
                          key={skill.skillId}
                          variant='secondary'
                          className='bg-gradient-to-r from-blue-500/10 to-purple-500/10'
                        >
                          {skill.skill.name}
                          {skill.skillLevel === 'expert' && (
                            <Award className='ml-1 h-3 w-3' />
                          )}
                        </Badge>
                      ))}
                      {profile.skills.length > 10 && (
                        <Badge variant='outline' className='border-primary/20'>
                          +{profile.skills.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Languages Section */}
                {Array.isArray(profile.languages) &&
                  profile.languages.length > 0 && (
                    <div className='space-y-3'>
                      <h3 className='font-semibold'>Languages</h3>
                      <div className='flex flex-wrap gap-2'>
                        {((profile.languages as any[]) || []).map(
                          (lang: any) => (
                            <Badge
                              key={lang.language}
                              variant='outline'
                              className='border-primary/20'
                            >
                              {lang.language} - {lang.proficiency}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Professional Links */}
                {(profile.portfolioUrl ||
                  profile.linkedinUrl ||
                  profile.githubUrl) && (
                  <div className='space-y-3'>
                    <h3 className='font-semibold'>Professional Links</h3>
                    <div className='flex flex-wrap gap-3'>
                      {profile.portfolioUrl && (
                        <Button
                          variant='outline'
                          size='sm'
                          asChild
                          className='border-primary/20 hover:bg-primary/10'
                        >
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
                        <Button
                          variant='outline'
                          size='sm'
                          asChild
                          className='border-primary/20 hover:bg-primary/10'
                        >
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
                        <Button
                          variant='outline'
                          size='sm'
                          asChild
                          className='border-primary/20 hover:bg-primary/10'
                        >
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

            <Tabs defaultValue='overview' className='space-y-4'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='portfolio'>Portfolio</TabsTrigger>
                <TabsTrigger value='reviews'>Reviews</TabsTrigger>
                <TabsTrigger value='skills'>Skills</TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-6'>
                <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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
                  <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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
                <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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
                <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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
                <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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
            {/* Gamified Performance Stats Card */}
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5 text-cyan-500' />
                  Battle Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='flex items-center gap-1'>
                      <Shield className='h-3 w-3 text-blue-500' />
                      Mission Success Rate
                    </span>
                    <span className='font-bold text-blue-500'>
                      {stats.completionRate}%
                    </span>
                  </div>
                  <Progress
                    value={stats.completionRate}
                    className='h-3 bg-gray-700'
                    style={{
                      background: `linear-gradient(to right, #3b82f6 ${stats.completionRate}%, #1f2937 ${stats.completionRate}%)`
                    }}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Response Time</span>
                    <span className='font-medium'>
                      {stats.avgResponseTime || 'Within 24 hours'}
                    </span>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3'>
                    <div className='flex items-center gap-2'>
                      <Trophy className='h-4 w-4 text-green-500' />
                      <p className='text-muted-foreground text-xs'>Victories</p>
                    </div>
                    <p className='mt-1 text-2xl font-bold text-green-500'>
                      {stats.completedJobs}
                    </p>
                  </div>
                  <div className='rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 p-3'>
                    <div className='flex items-center gap-2'>
                      <Target className='h-4 w-4 text-orange-500' />
                      <p className='text-muted-foreground text-xs'>
                        Active Quests
                      </p>
                    </div>
                    <p className='mt-1 text-2xl font-bold text-orange-500'>
                      {stats.activeBids}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3'>
                    <div className='flex items-center gap-2'>
                      <Sparkles className='h-4 w-4 text-purple-500' />
                      <p className='text-muted-foreground text-xs'>
                        Gold Earned
                      </p>
                    </div>
                    <p className='mt-1 text-xl font-bold text-purple-500'>
                      ${parseFloat(stats.totalEarnings).toLocaleString()}
                    </p>
                  </div>
                  <div className='rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3'>
                    <div className='flex items-center gap-2'>
                      <Eye className='h-4 w-4 text-blue-500' />
                      <p className='text-muted-foreground text-xs'>
                        Fame Points
                      </p>
                    </div>
                    <p className='mt-1 text-xl font-bold text-blue-500'>
                      {stats.profileViews.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Stats Card */}
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5 text-yellow-500' />
                  Player Stats
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-1'>
                        <User className='h-3 w-3' />
                        Profile Power
                      </span>
                      <span className='font-bold'>{profileCompleteness}%</span>
                    </div>
                    <div className='relative h-3 overflow-hidden rounded-full bg-gray-700'>
                      <div
                        className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500'
                        style={{ width: `${profileCompleteness}%` }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-1'>
                        <MessageSquare className='h-3 w-3' />
                        Response Speed
                      </span>
                      <span className='font-bold text-green-500'>
                        {responseRate}%
                      </span>
                    </div>
                    <div className='relative h-3 overflow-hidden rounded-full bg-gray-700'>
                      <div
                        className='absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500'
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        Reliability
                      </span>
                      <span className='font-bold text-cyan-500'>
                        {onTimeDelivery}%
                      </span>
                    </div>
                    <div className='relative h-3 overflow-hidden rounded-full bg-gray-700'>
                      <div
                        className='absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500'
                        style={{ width: `${onTimeDelivery}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Level & XP Display */}
                {userStats && (
                  <div className='mt-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 p-1.5'>
                          <Zap className='h-4 w-4 text-white' />
                        </div>
                        <div>
                          <p className='text-sm font-bold'>
                            Level {userStats.level}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {userStats.xp.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                      <Badge className='bg-gradient-to-r from-yellow-500 to-orange-500 text-white'>
                        {userStats.level >= 75
                          ? 'Master'
                          : userStats.level >= 50
                            ? 'Expert'
                            : userStats.level >= 25
                              ? 'Advanced'
                              : 'Beginner'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability Card */}
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Availability
                </CardTitle>
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
                    {profile.availability === 'available'
                      ? 'Available'
                      : profile.availability === 'busy'
                        ? 'Busy'
                        : 'Away'}
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

            {(profile.portfolioUrl ||
              profile.linkedinUrl ||
              profile.githubUrl) && (
              <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
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

            {/* Hire This Freelancer Card */}
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Briefcase className='h-5 w-5' />
                  Hire This Freelancer
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center'>
                  <p className='text-3xl font-bold'>${profile.hourlyRate}</p>
                  <p className='text-muted-foreground text-sm'>per hour</p>
                </div>
                {!isOwnProfile && (
                  <Button
                    className='w-full bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl'
                    asChild
                  >
                    <Link
                      href={appRoutes.trades.jobs.create + `?freelancer=${id}`}
                    >
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
