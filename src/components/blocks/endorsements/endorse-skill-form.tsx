'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { StarRating } from '@/components/ui/star-rating'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface EndorseSkillFormProps {
  userId: number
  userName?: string
  skills: Array<{ id: number; name: string }>
  jobId?: number
  onSuccess?: () => void
}

export function EndorseSkillForm({
  userId,
  userName,
  skills,
  jobId,
  onSuccess
}: EndorseSkillFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [rating, setRating] = useState(5)
  const [relationship, setRelationship] = useState<string>('')
  const [projectContext, setProjectContext] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSkill) {
      toast({
        title: 'Error',
        description: 'Please select a skill to endorse',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/endorsements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endorsedUserId: userId,
          skillId: parseInt(selectedSkill),
          rating,
          relationship: relationship || undefined,
          projectContext: projectContext || undefined,
          jobId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit endorsement')
      }

      toast({
        title: 'Success',
        description: `Successfully endorsed ${userName || 'user'}'s skills`
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error submitting endorsement:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit endorsement',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='skill'>Skill to Endorse</Label>
        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
          <SelectTrigger id='skill'>
            <SelectValue placeholder='Select a skill' />
          </SelectTrigger>
          <SelectContent>
            {skills.map(skill => (
              <SelectItem key={skill.id} value={skill.id.toString()}>
                {skill.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label>Skill Rating</Label>
        <div className='flex items-center gap-2'>
          <StarRating value={rating} onChange={setRating} size='lg' />
          <span className='text-muted-foreground text-sm'>{rating}/5</span>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='relationship'>Your Relationship (Optional)</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger id='relationship'>
            <SelectValue placeholder='Select relationship type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='client'>Client</SelectItem>
            <SelectItem value='freelancer'>Freelancer</SelectItem>
            <SelectItem value='colleague'>Colleague</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='context'>
          Project Context (Optional)
          <span className='text-muted-foreground ml-2 text-xs'>
            Describe the project or work you did together
          </span>
        </Label>
        <Textarea
          id='context'
          value={projectContext}
          onChange={e => setProjectContext(e.target.value)}
          placeholder='We worked together on a web development project where...'
          rows={3}
          maxLength={500}
        />
        <p className='text-muted-foreground text-right text-xs'>
          {projectContext.length}/500
        </p>
      </div>

      <Button
        type='submit'
        className='w-full'
        disabled={isSubmitting || !selectedSkill}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Endorsement'}
      </Button>
    </form>
  )
}
