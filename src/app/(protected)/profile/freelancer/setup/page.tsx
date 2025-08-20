'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { motion } from 'framer-motion'
import {
  Loader2,
  User,
  Briefcase,
  Globe,
  Link2,
  CheckCircle,
  UserPlus,
  Star,
  Target,
  Award
} from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { LanguageSelector } from '@/components/blocks/freelancers/language-selector'
import { PortfolioUpload } from '@/components/blocks/freelancers/portfolio-upload'
import { SkillSelector } from '@/components/blocks/freelancers/skill-selector'
import { TimezoneSelector } from '@/components/blocks/freelancers/timezone-selector'
import { PageHeader as GamifiedHeader } from '@/components/blocks/page-header'
import {
  GamifiedStatsCards,
  type StatCard
} from '@/components/blocks/trading/gamified-stats-cards'
import { navigationProgress } from '@/components/providers/navigation-progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Textarea } from '@/components/ui/textarea'
import {
  Wizard,
  WizardHeader,
  WizardContent,
  WizardFooter,
  WizardStep,
  useWizard
} from '@/components/ui/wizard'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import { freelancerProfileSchema } from '@/lib/schemas/freelancer'
import { cn } from '@/lib/utils'

type ProfileData = z.infer<typeof freelancerProfileSchema> & {
  skills?: any[]
  portfolioItems?: any[]
}

const getWizardSteps = (isEditMode: boolean) => [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Your professional identity',
    icon: <User className='h-4 w-4' />,
    isValid: isEditMode ? true : undefined
  },
  {
    id: 'skills',
    title: 'Skills & Expertise',
    description: 'Your technical abilities',
    icon: <Briefcase className='h-4 w-4' />,
    isValid: isEditMode ? true : undefined
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Showcase your work',
    icon: <Globe className='h-4 w-4' />,
    isOptional: true,
    isValid: isEditMode ? true : undefined
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'When you can work',
    icon: <Globe className='h-4 w-4' />,
    isValid: isEditMode ? true : undefined
  },
  {
    id: 'links',
    title: 'Professional Links',
    description: 'Your online presence',
    icon: <Link2 className='h-4 w-4' />,
    isOptional: true,
    isValid: isEditMode ? true : undefined
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Complete your profile',
    icon: <CheckCircle className='h-4 w-4' />,
    isValid: isEditMode ? true : undefined
  }
]

function BasicInfoStep({
  data,
  onChange
}: {
  data: Partial<ProfileData>
  onChange: (updates: Partial<ProfileData>) => void
}) {
  const { setStepValid } = useWizard()
  const [touched, setTouched] = useState({
    professionalTitle: false,
    bio: false,
    hourlyRate: false,
    yearsOfExperience: false
  })

  useEffect(() => {
    const isValid = !!(
      data.professionalTitle &&
      data.bio &&
      data.bio.length >= 20 &&
      data.hourlyRate &&
      data.yearsOfExperience !== undefined
    )
    setStepValid('basic', isValid)
  }, [data, setStepValid])

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='professionalTitle'>Professional Title *</Label>
        <Input
          id='professionalTitle'
          placeholder='e.g., Full Stack Developer, UI/UX Designer'
          value={data.professionalTitle || ''}
          onChange={e => onChange({ professionalTitle: e.target.value })}
          onBlur={() => handleBlur('professionalTitle')}
          className={cn(
            touched.professionalTitle &&
              !data.professionalTitle &&
              'border-red-500'
          )}
        />
        {touched.professionalTitle && !data.professionalTitle && (
          <p className='text-sm text-red-500'>Professional title is required</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='bio'>Professional Bio *</Label>
        <Textarea
          id='bio'
          placeholder='Describe your expertise, experience, and what makes you unique...'
          rows={6}
          value={data.bio || ''}
          onChange={e => onChange({ bio: e.target.value })}
          onBlur={() => handleBlur('bio')}
          className={cn(
            touched.bio &&
              (!data.bio || data.bio.length < 20) &&
              'border-red-500'
          )}
        />
        <div className='flex justify-between'>
          <p
            className={cn(
              'text-xs',
              touched.bio && (!data.bio || data.bio.length < 20)
                ? 'text-red-500'
                : 'text-muted-foreground'
            )}
          >
            {data.bio?.length || 0}/5000 characters (min 20)
          </p>
          {touched.bio && !data.bio && (
            <p className='text-xs text-red-500'>Bio is required</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='hourlyRate'>Hourly Rate (USD) *</Label>
          <Input
            id='hourlyRate'
            type='number'
            min='0'
            step='5'
            placeholder='50'
            value={data.hourlyRate || ''}
            onChange={e => onChange({ hourlyRate: e.target.value })}
            onBlur={() => handleBlur('hourlyRate')}
            className={cn(
              touched.hourlyRate && !data.hourlyRate && 'border-red-500'
            )}
          />
          {touched.hourlyRate && !data.hourlyRate && (
            <p className='text-xs text-red-500'>Hourly rate is required</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='yearsOfExperience'>Years of Experience *</Label>
          <Input
            id='yearsOfExperience'
            type='number'
            min='0'
            max='50'
            placeholder='5'
            value={data.yearsOfExperience || ''}
            onChange={e =>
              onChange({ yearsOfExperience: parseInt(e.target.value) })
            }
            onBlur={() => handleBlur('yearsOfExperience')}
            className={cn(
              touched.yearsOfExperience &&
                data.yearsOfExperience === undefined &&
                'border-red-500'
            )}
          />
          {touched.yearsOfExperience &&
            data.yearsOfExperience === undefined && (
              <p className='text-xs text-red-500'>
                Years of experience is required
              </p>
            )}
        </div>
      </div>
    </div>
  )
}

function SkillsStep({
  data,
  onChange
}: {
  data: Partial<ProfileData>
  onChange: (updates: Partial<ProfileData>) => void
}) {
  const { setStepValid } = useWizard()
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch available skills
    api
      .get(apiEndpoints.skills)
      .then(result => {
        if (result.success) {
          setSkills(result.data?.skills || [])
        }
      })
      .catch(err => {
        console.error('Failed to fetch skills:', err)
        toast.error('Failed to load skills')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Skills are optional during setup, so always valid
    setStepValid('skills', true)
  }, [setStepValid])

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label>Select Your Skills</Label>
        <p className='text-muted-foreground text-sm'>
          Choose the skills that best represent your expertise. You can specify
          your experience level for each skill.
        </p>
      </div>

      <SkillSelector
        skills={skills}
        selectedSkills={data.skills || []}
        onChange={skills => onChange({ skills })}
        maxSkills={20}
        showExperience={true}
        showLevel={true}
      />
    </div>
  )
}

function PortfolioStep({
  data,
  onChange
}: {
  data: Partial<ProfileData>
  onChange: (updates: Partial<ProfileData>) => void
}) {
  const { setStepValid } = useWizard()

  useEffect(() => {
    // Portfolio is optional, so always valid
    setStepValid('portfolio', true)
  }, [setStepValid])

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label>Portfolio Items</Label>
        <p className='text-muted-foreground text-sm'>
          Showcase your best work. Adding portfolio items helps clients
          understand your capabilities.
        </p>
      </div>

      <PortfolioUpload
        portfolioItems={data.portfolioItems || []}
        onChange={items => onChange({ portfolioItems: items })}
        maxItems={10}
      />
    </div>
  )
}

function AvailabilityStep({
  data,
  onChange
}: {
  data: Partial<ProfileData>
  onChange: (updates: Partial<ProfileData>) => void
}) {
  const { setStepValid } = useWizard()
  const [touched, setTouched] = useState({
    availability: false,
    timezone: false,
    languages: false
  })

  useEffect(() => {
    const isValid = !!(
      data.availability &&
      data.timezone &&
      data.languages &&
      data.languages.length > 0
    )
    setStepValid('availability', isValid)
  }, [data, setStepValid])

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='availability'>Availability Status *</Label>
        <select
          id='availability'
          className={cn(
            'border-input bg-background w-full rounded-md border px-3 py-2',
            touched.availability && !data.availability && 'border-red-500'
          )}
          value={data.availability || ''}
          onChange={e => onChange({ availability: e.target.value as any })}
          onBlur={() => handleBlur('availability')}
        >
          <option value=''>Select status...</option>
          <option value='available'>Available</option>
          <option value='busy'>Busy</option>
          <option value='away'>Away</option>
        </select>
        {touched.availability && !data.availability && (
          <p className='text-xs text-red-500'>
            Availability status is required
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='timezone'>Timezone *</Label>
        <div
          className={cn(
            touched.timezone && !data.timezone && '[&>*]:border-red-500'
          )}
        >
          <TimezoneSelector
            value={data.timezone}
            onChange={timezone => {
              onChange({ timezone })
              if (timezone) handleBlur('timezone')
            }}
            placeholder='Select your timezone'
          />
        </div>
        {touched.timezone && !data.timezone && (
          <p className='text-xs text-red-500'>Timezone is required</p>
        )}
      </div>

      <div className='space-y-2' onBlur={() => handleBlur('languages')}>
        <LanguageSelector
          languages={data.languages || []}
          onChange={languages => onChange({ languages })}
        />
        {touched.languages &&
          (!data.languages || data.languages.length === 0) && (
            <p className='text-xs text-red-500'>
              At least one language is required
            </p>
          )}
      </div>
    </div>
  )
}

function LinksStep({
  data,
  onChange
}: {
  data: Partial<ProfileData>
  onChange: (updates: Partial<ProfileData>) => void
}) {
  const { setStepValid } = useWizard()

  useEffect(() => {
    // Links are optional, so always valid
    setStepValid('links', true)
  }, [setStepValid])

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label>Professional Links</Label>
        <p className='text-muted-foreground text-sm'>
          Add links to your professional profiles and portfolio websites.
        </p>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='portfolioUrl'>Portfolio Website</Label>
          <Input
            id='portfolioUrl'
            type='url'
            placeholder='https://yourportfolio.com'
            value={data.portfolioUrl || ''}
            onChange={e => onChange({ portfolioUrl: e.target.value })}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='linkedinUrl'>LinkedIn Profile</Label>
          <Input
            id='linkedinUrl'
            type='url'
            placeholder='https://linkedin.com/in/yourprofile'
            value={data.linkedinUrl || ''}
            onChange={e => onChange({ linkedinUrl: e.target.value })}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='githubUrl'>GitHub Profile</Label>
          <Input
            id='githubUrl'
            type='url'
            placeholder='https://github.com/yourusername'
            value={data.githubUrl || ''}
            onChange={e => onChange({ githubUrl: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ data }: { data: Partial<ProfileData> }) {
  const { setStepValid } = useWizard()

  useEffect(() => {
    setStepValid('review', true)
  }, [setStepValid])

  // Profile completeness calculation will be implemented after profile creation

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
          <CardDescription>
            Review your profile information before completing setup
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-4 pt-4'>
            <div>
              <p className='text-sm font-medium'>Professional Title</p>
              <p className='text-muted-foreground text-sm'>
                {data.professionalTitle || 'Not set'}
              </p>
            </div>

            <div>
              <p className='text-sm font-medium'>Hourly Rate</p>
              <p className='text-muted-foreground text-sm'>
                {data.hourlyRate ? `$${data.hourlyRate}/hour` : 'Not set'}
              </p>
            </div>

            <div>
              <p className='text-sm font-medium'>Experience</p>
              <p className='text-muted-foreground text-sm'>
                {data.yearsOfExperience !== undefined
                  ? `${data.yearsOfExperience} years`
                  : 'Not set'}
              </p>
            </div>

            <div>
              <p className='text-sm font-medium'>Availability</p>
              <p className='text-muted-foreground text-sm'>
                {data.availability || 'Not set'}
              </p>
            </div>

            <div>
              <p className='text-sm font-medium'>Languages</p>
              <p className='text-muted-foreground text-sm'>
                {data.languages?.length
                  ? `${data.languages.length} languages`
                  : 'No languages added'}
              </p>
            </div>

            {data.skills && data.skills.length > 0 && (
              <div>
                <p className='text-sm font-medium'>Skills</p>
                <p className='text-muted-foreground text-sm'>
                  {data.skills.length} skills selected
                </p>
              </div>
            )}

            {data.portfolioItems && data.portfolioItems.length > 0 && (
              <div>
                <p className='text-sm font-medium'>Portfolio</p>
                <p className='text-muted-foreground text-sm'>
                  {data.portfolioItems.length} items added
                </p>
              </div>
            )}
          </div>

          <div className='bg-primary/10 rounded-lg p-4'>
            <p className='text-sm'>
              <strong>Ready to go!</strong> Your freelancer profile is ready to
              be created. You can always update your information later from your
              profile settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FreelancerProfileSetup() {
  const router = useRouter()
  const { user: session, isLoading: sessionLoading } = useSession()
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push(appRoutes.login)
    }
  }, [session, sessionLoading, router])

  // Load existing profile for editing
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!session) return

      try {
        const response = await api.get(apiEndpoints.freelancer.profile)
        if (response.success && response.data) {
          const data = response.data
          if (data.profile) {
            setProfileData({
              professionalTitle: data.profile.professionalTitle,
              bio: data.profile.bio,
              hourlyRate: data.profile.hourlyRate,
              yearsOfExperience: data.profile.yearsOfExperience,
              availability: data.profile.availability,
              timezone: data.profile.timezone,
              languages: data.profile.languages || [],
              portfolioUrl: data.profile.portfolioUrl,
              linkedinUrl: data.profile.linkedinUrl,
              githubUrl: data.profile.githubUrl,
              skills: data.profile.skills || [],
              portfolioItems: data.profile.portfolioItems || []
            })
            setIsEditMode(true)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (session) {
      loadExistingProfile()
    }
  }, [session])

  const handleProfileUpdate = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }))
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    navigationProgress.start()
    try {
      const response = isEditMode
        ? await api.put(apiEndpoints.freelancer.profile, profileData)
        : await api.post(apiEndpoints.freelancer.profile, profileData)

      if (!response.success) {
        throw new Error(
          response.error ||
            `Failed to ${isEditMode ? 'update' : 'create'} profile`
        )
      }

      toast.success(
        `Freelancer profile ${isEditMode ? 'updated' : 'created'} successfully!`
      )
      router.push(appRoutes.profile.freelancer.base)
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} profile:`,
        error
      )
      toast.error(
        `Failed to ${isEditMode ? 'update' : 'create'} profile. Please try again.`
      )
      navigationProgress.done()
    } finally {
      setIsSubmitting(false)
    }
  }

  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const saveDraft = async () => {
    setIsSavingDraft(true)
    try {
      const response = await api.post(
        apiEndpoints.freelancer.profileDraft,
        profileData
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to save draft')
      }

      toast.success('Draft saved successfully')
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  if (sessionLoading || isLoadingProfile) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Calculate profile completion stats
  const calculateProfileStats = (): StatCard[] => {
    let completedSteps = 0
    const totalSteps = getWizardSteps(isEditMode).filter(
      s => !s.isOptional
    ).length

    if (
      profileData.professionalTitle &&
      profileData.bio &&
      profileData.hourlyRate &&
      profileData.yearsOfExperience
    ) {
      completedSteps++
    }
    if (
      profileData.availability &&
      profileData.timezone &&
      profileData.languages?.length
    ) {
      completedSteps++
    }

    const completionPercentage = Math.round((completedSteps / totalSteps) * 100)

    return [
      {
        title: 'Profile Progress',
        value: `${completionPercentage}%`,
        subtitle: `${completedSteps} of ${totalSteps} steps`,
        icon: <Target className='h-5 w-5' />,
        badge: 'PROGRESS',
        colorScheme: 'blue'
      },
      {
        title: 'Required Fields',
        value:
          profileData.professionalTitle && profileData.bio
            ? '✓'
            : `${Object.values(profileData).filter(Boolean).length}`,
        subtitle: 'Basic info status',
        icon: <CheckCircle className='h-5 w-5' />,
        badge: 'REQUIRED',
        colorScheme:
          profileData.professionalTitle && profileData.bio ? 'green' : 'yellow'
      },
      {
        title: 'Skills Added',
        value: profileData.skills?.length || 0,
        subtitle: 'Technical abilities',
        icon: <Star className='h-5 w-5' />,
        badge: 'OPTIONAL',
        colorScheme: 'purple'
      },
      {
        title: 'Portfolio Items',
        value: profileData.portfolioItems?.length || 0,
        subtitle: 'Work samples',
        icon: <Award className='h-5 w-5' />,
        badge: 'OPTIONAL',
        colorScheme: 'orange'
      }
    ]
  }

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto max-w-5xl space-y-6 px-4 py-6'>
        {/* Gamified Header */}
        <GamifiedHeader
          title={
            isEditMode ? 'EDIT FREELANCER PROFILE' : 'CREATE FREELANCER PROFILE'
          }
          subtitle={
            isEditMode
              ? 'Update your professional profile and showcase your latest expertise'
              : 'Set up your professional profile to start bidding on projects and showcase your expertise'
          }
          icon={<UserPlus className='h-8 w-8 text-white' />}
        />

        {/* Stats Cards */}
        <GamifiedStatsCards cards={calculateProfileStats()} />

        <Wizard
          steps={getWizardSteps(isEditMode)}
          initialStep={currentStepIndex}
          onStepChange={setCurrentStepIndex}
        >
          <WizardHeader showProgress showSteps />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5 backdrop-blur-sm'>
              <CardContent className='pt-6'>
                <WizardContent>
                  <WizardStep stepId='basic'>
                    <BasicInfoStep
                      data={profileData}
                      onChange={handleProfileUpdate}
                    />
                  </WizardStep>

                  <WizardStep stepId='skills'>
                    <SkillsStep
                      data={profileData}
                      onChange={handleProfileUpdate}
                    />
                  </WizardStep>

                  <WizardStep stepId='portfolio'>
                    <PortfolioStep
                      data={profileData}
                      onChange={handleProfileUpdate}
                    />
                  </WizardStep>

                  <WizardStep stepId='availability'>
                    <AvailabilityStep
                      data={profileData}
                      onChange={handleProfileUpdate}
                    />
                  </WizardStep>

                  <WizardStep stepId='links'>
                    <LinksStep
                      data={profileData}
                      onChange={handleProfileUpdate}
                    />
                  </WizardStep>

                  <WizardStep stepId='review'>
                    <ReviewStep data={profileData} />
                  </WizardStep>
                </WizardContent>
              </CardContent>
            </Card>
          </motion.div>

          <div className='flex items-center justify-between'>
            <LoadingButton
              variant='outline'
              onClick={saveDraft}
              isLoading={isSavingDraft}
              loadingText='Saving...'
              disabled={isSubmitting}
              className='min-w-[120px]'
            >
              Save Draft
            </LoadingButton>
            <WizardFooter
              onNext={() => {
                // Validate current step before allowing next
                const currentStep = getWizardSteps(isEditMode)[currentStepIndex]
                if (currentStep.id === 'basic') {
                  if (
                    !profileData.professionalTitle ||
                    !profileData.bio ||
                    profileData.bio.length < 20 ||
                    !profileData.hourlyRate ||
                    profileData.yearsOfExperience === undefined
                  ) {
                    toast.error('Please fill in all required fields')
                    return Promise.reject()
                  }
                } else if (currentStep.id === 'availability') {
                  if (
                    !profileData.availability ||
                    !profileData.timezone ||
                    !profileData.languages ||
                    profileData.languages.length === 0
                  ) {
                    toast.error('Please fill in all required fields')
                    return Promise.reject()
                  }
                }
                return Promise.resolve()
              }}
              onComplete={handleComplete}
              completeLabel={
                isSubmitting
                  ? isEditMode
                    ? 'Updating Profile...'
                    : 'Creating Profile...'
                  : isEditMode
                    ? 'Update Profile'
                    : 'Create Profile'
              }
              showSkip
            />
          </div>
        </Wizard>
      </div>
    </div>
  )
}
