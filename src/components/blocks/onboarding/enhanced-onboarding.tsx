'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Trophy,
  Gift
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils/cn'

interface OnboardingStep {
  id: number
  key: string
  title: string
  description: string
  targetElement?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  content?: any
  requiredAction?: string
  xpReward: number
  category: string
  completed?: boolean
  skipped?: boolean
}

interface OnboardingProgress {
  steps: OnboardingStep[]
  totalSteps: number
  completedSteps: number
  skippedSteps: number
  progressPercentage: number
  isComplete: boolean
}

interface EnhancedOnboardingProps {
  category?: 'new_user' | 'freelancer' | 'client' | 'trader'
  onComplete?: () => void
  className?: string
}

export function EnhancedOnboarding({
  category = 'new_user',
  onComplete,
  className
}: EnhancedOnboardingProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const completeStep = async (stepKey: string) => {
    try {
      const response = await api.post(apiEndpoints.onboarding.complete, {
        stepKey
      })

      if (response.success) {
        updateStepStatus(currentStepIndex, 'completed')
        toast({
          title: 'Step Completed!',
          description: `You earned ${response.data?.xpReward} XP!`
        })
      }
    } catch (error) {
      console.error('Failed to complete step:', error)
    }
  }

  const skipStep = async (stepKey: string) => {
    try {
      const response = await api.post(apiEndpoints.onboarding.skip, { stepKey })

      if (response.success) {
        updateStepStatus(currentStepIndex, 'skipped')
      }
    } catch (error) {
      console.error('Failed to skip step:', error)
    }
  }

  // Fetch onboarding progress
  useEffect(() => {
    fetchOnboardingProgress()
  }, [category])

  const fetchOnboardingProgress = async () => {
    try {
      const response = await api.get(
        `/api/onboarding/progress?category=${category}`
      )

      if (response.success) {
        const data = response.data
        setProgress(data)

        // Find first incomplete step
        const firstIncomplete = data.steps.findIndex(
          (s: any) => !s.progress?.completedAt && !s.progress?.skippedAt
        )
        if (firstIncomplete !== -1) {
          setCurrentStepIndex(firstIncomplete)
        }

        // Check if should show onboarding
        if (!data.isComplete && data.completedSteps < 3) {
          setIsOpen(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStepStatus = (index: number, status: 'completed' | 'skipped') => {
    if (!progress) return

    const updatedSteps = [...progress.steps]
    if (status === 'completed') {
      updatedSteps[index].completed = true
      setProgress({
        ...progress,
        steps: updatedSteps,
        completedSteps: progress.completedSteps + 1,
        progressPercentage:
          ((progress.completedSteps + 1) / progress.totalSteps) * 100
      })
    } else {
      updatedSteps[index].skipped = true
      setProgress({
        ...progress,
        steps: updatedSteps,
        skippedSteps: progress.skippedSteps + 1
      })
    }
  }

  const handleNext = () => {
    if (!progress) return

    // Complete current step
    const currentStep = progress.steps[currentStepIndex]
    if (currentStep && !currentStep.completed && !currentStep.skipped) {
      completeStep(currentStep.key)
    }

    // Move to next step
    if (currentStepIndex < progress.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    if (!progress) return

    const currentStep = progress.steps[currentStepIndex]
    if (currentStep) {
      skipStep(currentStep.key)
    }

    // Move to next step or complete
    if (currentStepIndex < progress.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    setIsOpen(false)
    onComplete?.()

    // Show completion celebration
    toast({
      title: '🎉 Onboarding Complete!',
      description: "You're all set to start using the platform."
    })
  }

  const handleStepClick = (index: number) => {
    setCurrentStepIndex(index)
  }

  if (loading || !progress) {
    return null
  }

  const currentStep = progress.steps[currentStepIndex]

  return (
    <>
      {/* Onboarding trigger button */}
      {!isOpen && !progress.isComplete && (
        <Button
          onClick={() => setIsOpen(true)}
          variant='outline'
          size='sm'
          className={cn('gap-2', className)}
        >
          <Sparkles className='h-4 w-4' />
          Resume Onboarding ({progress.completedSteps}/{progress.totalSteps})
        </Button>
      )}

      {/* Onboarding dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-yellow-500' />
              Getting Started with Escrowzy
            </DialogTitle>
            <DialogDescription>
              Complete these steps to unlock all features and earn rewards
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Progress bar */}
            <div className='space-y-2'>
              <div className='text-muted-foreground flex justify-between text-sm'>
                <span>
                  Progress: {progress.completedSteps}/{progress.totalSteps}{' '}
                  steps
                </span>
                <span>{Math.round(progress.progressPercentage)}%</span>
              </div>
              <Progress value={progress.progressPercentage} className='h-2' />
            </div>

            {/* Steps navigation */}
            <div className='flex gap-2 overflow-x-auto pb-2'>
              {progress.steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                    index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : step.completed
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : step.skipped
                          ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {step.completed ? (
                    <CheckCircle2 className='h-3 w-3' />
                  ) : (
                    <Circle className='h-3 w-3' />
                  )}
                  {step.title}
                </button>
              ))}
            </div>

            {/* Current step content */}
            <AnimatePresence mode='wait'>
              {currentStep && (
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                          <CardTitle className='text-xl'>
                            Step {currentStepIndex + 1}: {currentStep.title}
                          </CardTitle>
                          <CardDescription>
                            {currentStep.description}
                          </CardDescription>
                        </div>
                        {currentStep.xpReward > 0 && (
                          <Badge variant='secondary' className='gap-1'>
                            <Gift className='h-3 w-3' />
                            {currentStep.xpReward} XP
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Dynamic step content */}
                      {currentStep.content && (
                        <div className='space-y-4'>
                          {renderStepContent(currentStep)}
                        </div>
                      )}

                      {/* Required action indicator */}
                      {currentStep.requiredAction && (
                        <div className='mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                          <p className='text-sm text-blue-700 dark:text-blue-400'>
                            <strong>Action Required:</strong>{' '}
                            {currentStep.requiredAction}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className='flex justify-between'>
              <Button
                variant='ghost'
                onClick={handleSkip}
                disabled={currentStepIndex === progress.steps.length - 1}
              >
                Skip
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() =>
                    setCurrentStepIndex(Math.max(0, currentStepIndex - 1))
                  }
                  disabled={currentStepIndex === 0}
                >
                  Previous
                </Button>
                <Button onClick={handleNext} className='gap-2'>
                  {currentStepIndex === progress.steps.length - 1 ? (
                    'Complete'
                  ) : (
                    <>
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper function to render dynamic step content
function renderStepContent(step: OnboardingStep) {
  // This can be extended to render different types of content
  // based on the step.content structure
  if (typeof step.content === 'string') {
    return <p>{step.content}</p>
  }

  if (step.content?.type === 'video') {
    return (
      <div className='aspect-video overflow-hidden rounded-lg bg-black'>
        <iframe
          src={step.content.url}
          className='h-full w-full'
          allowFullScreen
        />
      </div>
    )
  }

  if (step.content?.type === 'checklist') {
    return (
      <div className='space-y-2'>
        {step.content.items.map((item: any, index: number) => (
          <div key={index} className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-green-500' />
            <span className='text-sm'>{item}</span>
          </div>
        ))}
      </div>
    )
  }

  if (step.content?.type === 'action') {
    return (
      <Button
        onClick={() => window.open(step.content.url, '_blank')}
        className='w-full'
      >
        {step.content.label}
      </Button>
    )
  }

  return null
}

// Onboarding progress widget
export function OnboardingProgressWidget() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await api.get(apiEndpoints.onboarding.progress)
      if (response.success) {
        setProgress(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch onboarding progress:', error)
    }
  }

  if (!progress || progress.isComplete) {
    return null
  }

  return (
    <Card className='p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-sm font-medium'>Getting Started</span>
        <Badge variant='outline'>
          {progress.completedSteps}/{progress.totalSteps}
        </Badge>
      </div>
      <Progress value={progress.progressPercentage} className='mb-2 h-2' />
      <EnhancedOnboarding />
    </Card>
  )
}
