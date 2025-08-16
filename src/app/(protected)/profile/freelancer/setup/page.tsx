'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import {
  Loader2,
  User,
  Briefcase,
  Globe,
  Link2,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { LanguageSelector } from '@/components/blocks/freelancers/language-selector'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Wizard,
  WizardHeader,
  WizardContent,
  WizardFooter,
  WizardStep,
  useWizard
} from '@/components/ui/wizard'
import { useSession } from '@/hooks/use-session'

// Portfolio upload will be implemented in future update
import { freelancerProfileSchema } from '@/lib/schemas/freelancer'

type ProfileData = z.infer<typeof freelancerProfileSchema>

const wizardSteps = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Your professional identity',
    icon: <User className='h-4 w-4' />
  },
  {
    id: 'skills',
    title: 'Skills & Expertise',
    description: 'Your technical abilities',
    icon: <Briefcase className='h-4 w-4' />
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Showcase your work',
    icon: <Globe className='h-4 w-4' />,
    isOptional: true
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'When you can work',
    icon: <Globe className='h-4 w-4' />
  },
  {
    id: 'links',
    title: 'Professional Links',
    description: 'Your online presence',
    icon: <Link2 className='h-4 w-4' />,
    isOptional: true
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Complete your profile',
    icon: <CheckCircle className='h-4 w-4' />
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

  useEffect(() => {
    const isValid = !!(
      data.professionalTitle &&
      data.bio &&
      data.hourlyRate &&
      data.yearsOfExperience !== undefined
    )
    setStepValid('basic', isValid)
  }, [data, setStepValid])

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='professionalTitle'>Professional Title *</Label>
        <Input
          id='professionalTitle'
          placeholder='e.g., Full Stack Developer, UI/UX Designer'
          value={data.professionalTitle || ''}
          onChange={e => onChange({ professionalTitle: e.target.value })}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='bio'>Professional Bio *</Label>
        <Textarea
          id='bio'
          placeholder='Describe your expertise, experience, and what makes you unique...'
          rows={6}
          value={data.bio || ''}
          onChange={e => onChange({ bio: e.target.value })}
        />
        <p className='text-muted-foreground text-xs'>
          {data.bio?.length || 0}/500 characters
        </p>
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
          />
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
          />
        </div>
      </div>

      <div className='text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center'>
        Work experience and education sections will be available after profile
        setup.
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

  useEffect(() => {
    setStepValid('skills', true)
  }, [setStepValid])

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label>Select Your Skills *</Label>
        <p className='text-muted-foreground text-sm'>
          Choose the skills that best represent your expertise. You can specify
          your experience level for each skill.
        </p>
      </div>

      <div className='text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center'>
        Skills selection will be available after initial profile setup.
      </div>
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

      <div className='text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center'>
        Portfolio items can be added after profile setup.
      </div>
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

  useEffect(() => {
    const isValid = !!(
      data.availability &&
      data.timezone &&
      data.languages &&
      data.languages.length > 0
    )
    setStepValid('availability', isValid)
  }, [data, setStepValid])

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='availability'>Availability Status *</Label>
        <select
          id='availability'
          className='border-input bg-background w-full rounded-md border px-3 py-2'
          value={data.availability || ''}
          onChange={e => onChange({ availability: e.target.value as any })}
        >
          <option value=''>Select status...</option>
          <option value='available'>Available</option>
          <option value='busy'>Busy</option>
          <option value='away'>Away</option>
        </select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='timezone'>Timezone *</Label>
        <Input
          id='timezone'
          placeholder='e.g., America/New_York, Europe/London'
          value={data.timezone || ''}
          onChange={e => onChange({ timezone: e.target.value })}
        />
      </div>

      <div className='space-y-2'>
        <Label>Languages *</Label>
        <LanguageSelector
          languages={data.languages || []}
          onChange={languages => onChange({ languages })}
        />
      </div>

      {/* Weekly availability calendar will be added in a future update */}
      <div className='space-y-2'>
        <Label>Timezone</Label>
        <Input
          value={data.timezone || ''}
          onChange={e => onChange({ timezone: e.target.value })}
          placeholder='e.g., America/New_York'
        />
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

            <div>
              <p className='text-sm font-medium'>Languages</p>
              <p className='text-muted-foreground text-sm'>
                {data.languages?.length
                  ? `${data.languages.length} languages`
                  : 'No languages added'}
              </p>
            </div>
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

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/login')
    }
  }, [session, sessionLoading, router])

  const handleProfileUpdate = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }))
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/freelancer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      toast.success('Freelancer profile created successfully!')
      router.push('/profile/freelancer')
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error('Failed to create profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveDraft = async () => {
    try {
      const response = await fetch('/api/freelancer/profile/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      toast.success('Draft saved successfully')
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    }
  }

  if (sessionLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Create Your Freelancer Profile</h1>
        <p className='text-muted-foreground mt-2'>
          Complete your profile to start bidding on projects and showcase your
          expertise
        </p>
      </div>

      <Wizard
        steps={wizardSteps}
        initialStep={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      >
        <WizardHeader showProgress showSteps />

        <Card>
          <CardContent className='pt-6'>
            <WizardContent>
              <WizardStep stepId='basic'>
                <BasicInfoStep
                  data={profileData}
                  onChange={handleProfileUpdate}
                />
              </WizardStep>

              <WizardStep stepId='skills'>
                <SkillsStep data={profileData} onChange={handleProfileUpdate} />
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
                <LinksStep data={profileData} onChange={handleProfileUpdate} />
              </WizardStep>

              <WizardStep stepId='review'>
                <ReviewStep data={profileData} />
              </WizardStep>
            </WizardContent>
          </CardContent>
        </Card>

        <div className='flex items-center justify-between'>
          <Button variant='outline' onClick={saveDraft} disabled={isSubmitting}>
            Save Draft
          </Button>
          <WizardFooter
            onComplete={handleComplete}
            completeLabel={
              isSubmitting ? 'Creating Profile...' : 'Create Profile'
            }
            showSkip
          />
        </div>
      </Wizard>
    </div>
  )
}
