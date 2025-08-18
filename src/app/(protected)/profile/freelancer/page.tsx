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
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  User,
  DollarSign,
  Clock,
  Target
} from 'lucide-react'

import { PortfolioGallery } from '@/components/blocks/freelancers/portfolio-gallery'
import { ProfileCompleteness } from '@/components/blocks/freelancers/profile-completeness'
import { VerifiedBadge } from '@/components/blocks/freelancers/verified-badge'
import { PageHeader as GamifiedHeader } from '@/components/blocks/page-header'
import {
  GamifiedStatsCards,
  type StatCard
} from '@/components/blocks/trading/gamified-stats-cards'
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
import { getFreelancerPlatformStats } from '@/lib/db/queries/user-stats'

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
  const platformStats = await getFreelancerPlatformStats()

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  // Calculate stats for gamified cards
  const totalJobs = stats.completedJobs + stats.activeBids
  const statsCards: StatCard[] = [
    {
      title: 'Total Earnings',
      value: `$${parseFloat(stats.totalEarnings).toFixed(0)}`,
      subtitle: 'Lifetime earnings',
      icon: <DollarSign className='h-5 w-5' />,
      badge: 'EARNINGS',
      colorScheme: 'green'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      subtitle: `${stats.completedJobs} completed`,
      icon: <Target className='h-5 w-5' />,
      badge: 'PERFORMANCE',
      colorScheme: stats.completionRate >= 90 ? 'blue' : 'yellow'
    },
    {
      title: 'Average Rating',
      value: averageRating > 0 ? averageRating.toFixed(1) : 'N/A',
      subtitle: `${reviews.length} reviews`,
      icon: <Star className='h-5 w-5' />,
      badge: 'REPUTATION',
      colorScheme:
        averageRating >= 4.5
          ? 'purple'
          : averageRating > 0
            ? 'orange'
            : 'yellow'
    },
    {
      title: 'Active Bids',
      value: stats.activeBids,
      subtitle: 'Pending proposals',
      icon: <Briefcase className='h-5 w-5' />,
      badge: 'ACTIVE',
      colorScheme: 'blue'
    }
  ]

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-6 px-4 py-6'>
        {/* Gamified Header */}
        <GamifiedHeader
          title='FREELANCER PROFILE'
          subtitle='Manage your professional profile and track your performance'
          icon={<User className='h-8 w-8 text-white' />}
          actions={
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                asChild
                className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
              >
                <Link href={`/freelancers/${auth.id}`}>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  View Public Profile
                </Link>
              </Button>
              <Button
                asChild
                className='border-0 bg-gradient-to-r from-blue-600 to-cyan-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-cyan-800 hover:shadow-xl'
              >
                <Link href='/profile/freelancer/setup'>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Profile
                </Link>
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />

        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            {/* Main Profile Card */}
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
                    <p className='text-muted-foreground text-sm'>Rating</p>
                    <div className='flex items-center gap-1'>
                      <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                      <span className='text-xl font-semibold'>
                        {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <ProfileCompleteness profile={profile as any} />

                <div className='space-y-3'>
                  <h3 className='font-semibold'>Skills</h3>
                  <div className='flex flex-wrap gap-2'>
                    {profile.skills?.slice(0, 10).map(skill => (
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
                      <Badge
                        key={lang.language}
                        variant='outline'
                        className='border-primary/20'
                      >
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

            {/* Portfolio Section */}
            {profile.portfolioItems && profile.portfolioItems.length > 0 && (
              <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle>Portfolio</CardTitle>
                    <Button size='sm' variant='outline' asChild>
                      <Link href='/profile/freelancer/portfolio'>
                        <Plus className='mr-2 h-4 w-4' />
                        Add Items
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <PortfolioGallery items={profile.portfolioItems as any} />
                </CardContent>
              </Card>
            )}

            {/* Placeholder for Work Experience and Education - will be available after profile setup */}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Stats Card */}
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Completion Rate</span>
                    <span className='font-medium'>{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} className='h-2' />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Response Time</span>
                    <span className='font-medium'>
                      {stats.avgResponseTime || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Completed</p>
                    <p className='text-xl font-bold'>{stats.completedJobs}</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Active Bids</p>
                    <p className='text-xl font-bold'>{stats.activeBids}</p>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Earnings</p>
                    <p className='text-lg font-bold'>
                      ${parseFloat(stats.totalEarnings).toFixed(0)}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>
                      Profile Views
                    </p>
                    <p className='text-lg font-bold'>{stats.profileViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
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
                {profile.timezone && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Timezone</span>
                    <span className='text-muted-foreground text-sm'>
                      {profile.timezone}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            {reviews.length > 0 && (
              <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      <Star className='h-5 w-5' />
                      Recent Reviews
                    </CardTitle>
                    <Link
                      href='/profile/freelancer/reviews'
                      className='text-muted-foreground hover:text-primary text-sm'
                    >
                      View all
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {reviews.slice(0, 3).map(review => (
                      <div key={review.id} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <p className='text-sm font-medium'>
                            {review.client?.name || 'Anonymous'}
                          </p>
                          <div className='flex items-center gap-1'>
                            {Array.from({ length: 5 }).map((_, i) => (
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
                        {review.reviewText && (
                          <p className='text-muted-foreground text-sm'>
                            {review.reviewText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid gap-2'>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    asChild
                  >
                    <Link href='/profile/freelancer/skills'>
                      <Briefcase className='mr-2 h-4 w-4' />
                      Manage Skills
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
