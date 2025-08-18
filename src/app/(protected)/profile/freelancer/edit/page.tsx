'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Loader2, Save, X, ArrowLeft } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/hooks/use-session'
// Portfolio upload will be implemented in future update
// Education form will be implemented in future update
import { freelancerProfileSchema } from '@/lib/schemas/freelancer'

type ProfileData = z.infer<typeof freelancerProfileSchema>

export default function EditFreelancerProfile() {
  const router = useRouter()
  const { user: session, isLoading: sessionLoading } = useSession()
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/login')
    }
  }, [session, sessionLoading, router])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/freelancer/profile')
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/profile/freelancer/setup')
            return
          }
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setProfileData(data.profile)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchProfile()
    }
  }, [session, router])

  const handleUpdate = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/freelancer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast.success('Profile updated successfully')
      setHasChanges(false)
      router.push('/profile/freelancer')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        router.push('/profile/freelancer')
      }
    } else {
      router.push('/profile/freelancer')
    }
  }

  if (sessionLoading || isLoading) {
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
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      <div className='mb-8'>
        <div className='mb-4 flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/profile/freelancer'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>Edit Profile</h1>
            <p className='text-muted-foreground mt-1'>
              Update your freelancer profile information
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue='basic' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='basic'>Basic Info</TabsTrigger>
          <TabsTrigger value='skills'>Skills</TabsTrigger>
          <TabsTrigger value='portfolio'>Portfolio</TabsTrigger>
          <TabsTrigger value='availability'>Availability</TabsTrigger>
          <TabsTrigger value='links'>Links</TabsTrigger>
        </TabsList>

        <TabsContent value='basic' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your professional identity and experience
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='professionalTitle'>Professional Title</Label>
                  <Input
                    id='professionalTitle'
                    placeholder='e.g., Full Stack Developer'
                    value={profileData.professionalTitle || ''}
                    onChange={e =>
                      handleUpdate({ professionalTitle: e.target.value })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='availabilityStatus'>
                    Availability Status
                  </Label>
                  <select
                    id='availabilityStatus'
                    className='border-input bg-background w-full rounded-md border px-3 py-2'
                    value={profileData.availability || ''}
                    onChange={e =>
                      handleUpdate({ availability: e.target.value as any })
                    }
                  >
                    <option value='available'>Available</option>
                    <option value='busy'>Busy</option>
                    <option value='away'>Away</option>
                  </select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bio'>Professional Bio</Label>
                <Textarea
                  id='bio'
                  placeholder='Describe your expertise and experience...'
                  rows={6}
                  value={profileData.bio || ''}
                  onChange={e => handleUpdate({ bio: e.target.value })}
                />
                <p className='text-muted-foreground text-xs'>
                  {profileData.bio?.length || 0}/500 characters
                </p>
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='hourlyRate'>Hourly Rate (USD)</Label>
                  <Input
                    id='hourlyRate'
                    type='number'
                    min='0'
                    step='5'
                    value={profileData.hourlyRate || ''}
                    onChange={e => handleUpdate({ hourlyRate: e.target.value })}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='yearsOfExperience'>Years of Experience</Label>
                  <Input
                    id='yearsOfExperience'
                    type='number'
                    min='0'
                    max='50'
                    value={profileData.yearsOfExperience || ''}
                    onChange={e =>
                      handleUpdate({
                        yearsOfExperience: parseInt(e.target.value)
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Input
                    id='timezone'
                    placeholder='e.g., America/New_York'
                    value={profileData.timezone || ''}
                    onChange={e => handleUpdate({ timezone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>
                Add your professional work history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-8 text-center'>
                Work experience section will be implemented in a future update.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Add your educational background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-8 text-center'>
                Education section will be implemented in a future update.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='skills' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>
                Select the skills that best represent your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-8 text-center'>
                Skills management will be available in the dedicated Skills
                page.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='portfolio' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>
                Showcase your best work to potential clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-8 text-center'>
                Portfolio management will be available in the dedicated
                Portfolio page.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='availability' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>
                Languages you can communicate in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSelector
                languages={profileData.languages || []}
                onChange={languages => handleUpdate({ languages })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                Set your typical weekly availability schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-8 text-center'>
                Weekly availability calendar will be available in the dedicated
                Availability page.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='links' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Professional Links</CardTitle>
              <CardDescription>
                Add links to your professional profiles and portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='portfolioUrl'>Portfolio Website</Label>
                <Input
                  id='portfolioUrl'
                  type='url'
                  placeholder='https://yourportfolio.com'
                  value={profileData.portfolioUrl || ''}
                  onChange={e => handleUpdate({ portfolioUrl: e.target.value })}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='linkedinUrl'>LinkedIn Profile</Label>
                <Input
                  id='linkedinUrl'
                  type='url'
                  placeholder='https://linkedin.com/in/yourprofile'
                  value={profileData.linkedinUrl || ''}
                  onChange={e => handleUpdate({ linkedinUrl: e.target.value })}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='githubUrl'>GitHub Profile</Label>
                <Input
                  id='githubUrl'
                  type='url'
                  placeholder='https://github.com/yourusername'
                  value={profileData.githubUrl || ''}
                  onChange={e => handleUpdate({ githubUrl: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className='bg-background sticky bottom-0 flex items-center justify-between border-t py-4'>
        <Button variant='outline' onClick={handleCancel}>
          <X className='mr-2 h-4 w-4' />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Save className='mr-2 h-4 w-4' />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
