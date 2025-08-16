'use client'

import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  calculateProfileCompleteness,
  type FreelancerProfileWithRelations
} from '@/lib/db/queries/freelancers'

interface ProfileCompletenessProps {
  profile: FreelancerProfileWithRelations
  showDetails?: boolean
}

export function ProfileCompleteness({
  profile,
  showDetails = true
}: ProfileCompletenessProps) {
  const completeness = calculateProfileCompleteness(profile)

  const checkItems = [
    {
      label: 'Basic Information',
      completed: !!(
        profile.professionalTitle &&
        profile.bio &&
        profile.hourlyRate
      ),
      required: true
    },
    {
      label: 'Skills (3+)',
      completed: profile.skills && profile.skills.length >= 3,
      required: true
    },
    {
      label: 'Portfolio (1+)',
      completed: profile.portfolioItems && profile.portfolioItems.length >= 1,
      required: false
    },
    {
      label: 'Profile Photo',
      completed: !!profile.user.avatarUrl,
      required: false
    },
    {
      label: 'Experience',
      completed: profile.yearsOfExperience > 0,
      required: false
    },
    {
      label: 'Languages',
      completed: !!(
        profile.languages &&
        Array.isArray(profile.languages) &&
        (profile.languages as any).length > 0
      ),
      required: true
    },
    {
      label: 'Professional Links',
      completed: !!(
        profile.portfolioUrl ||
        profile.linkedinUrl ||
        profile.githubUrl
      ),
      required: false
    }
  ]

  const getCompletenessColor = () => {
    if (completeness >= 80) return 'text-green-600'
    if (completeness >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = () => {
    if (completeness >= 80) return 'bg-green-600'
    if (completeness >= 60) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  if (!showDetails) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Profile Completeness</span>
          <span className={`font-semibold ${getCompletenessColor()}`}>
            {completeness}%
          </span>
        </div>
        <Progress value={completeness} className='h-2' />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Profile Completeness</span>
          <span className={`text-2xl font-bold ${getCompletenessColor()}`}>
            {completeness}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Progress value={completeness} className='h-3' />

        {completeness < 100 && (
          <div className='flex items-start gap-2 rounded-lg bg-yellow-50 p-3'>
            <AlertCircle className='mt-0.5 h-5 w-5 text-yellow-600' />
            <div className='text-sm'>
              <p className='font-medium text-yellow-900'>
                Complete your profile to stand out
              </p>
              <p className='mt-1 text-yellow-700'>
                Profiles with 100% completion get 3x more views and hire
                requests.
              </p>
            </div>
          </div>
        )}

        <div className='space-y-2'>
          {checkItems.map((item, index) => (
            <div key={index} className='flex items-center gap-3'>
              {item.completed ? (
                <CheckCircle2 className='h-5 w-5 text-green-600' />
              ) : (
                <Circle className='h-5 w-5 text-gray-400' />
              )}
              <span
                className={`text-sm ${item.completed ? '' : 'text-muted-foreground'}`}
              >
                {item.label}
                {item.required && !item.completed && (
                  <span className='ml-1 text-red-500'>*</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
