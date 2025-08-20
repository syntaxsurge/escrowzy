'use client'

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  isValid?: boolean
  isOptional?: boolean
}

interface WizardContextType {
  currentStep: number
  steps: WizardStep[]
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
  isFirstStep: boolean
  isLastStep: boolean
  canGoNext: boolean
  canGoPrev: boolean
  progress: number
  setStepValid: (stepId: string, isValid: boolean) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return context
}

interface WizardProviderProps {
  children: ReactNode
  steps: WizardStep[]
  initialStep?: number
  onStepChange?: (step: number) => void
}

export function WizardProvider({
  children,
  steps: initialSteps,
  initialStep = 0,
  onStepChange
}: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [steps, setSteps] = useState(initialSteps)
  const [isLoading, setIsLoading] = useState(false)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  const canGoNext =
    steps[currentStep]?.isOptional || steps[currentStep]?.isValid !== false
  const canGoPrev = !isFirstStep && !isLoading

  const nextStep = () => {
    if (!isLastStep && canGoNext) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const prevStep = () => {
    if (canGoPrev) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length && !isLoading) {
      // Allow going back to previous steps
      if (index < currentStep) {
        setCurrentStep(index)
        onStepChange?.(index)
        return
      }

      // For forward navigation, check if all steps before the target are valid
      let canNavigate = true
      for (let i = 0; i <= index - 1; i++) {
        if (!steps[i].isOptional && steps[i].isValid === false) {
          canNavigate = false
          break
        }
      }

      if (canNavigate) {
        setCurrentStep(index)
        onStepChange?.(index)
      }
    }
  }

  const setStepValid = useCallback((stepId: string, isValid: boolean) => {
    setSteps(prevSteps =>
      prevSteps.map(step => (step.id === stepId ? { ...step, isValid } : step))
    )
  }, [])

  useEffect(() => {
    setSteps(initialSteps)
  }, [initialSteps])

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        steps,
        nextStep,
        prevStep,
        goToStep,
        isFirstStep,
        isLastStep,
        canGoNext,
        canGoPrev,
        progress,
        setStepValid,
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

interface WizardHeaderProps {
  className?: string
  showProgress?: boolean
  showSteps?: boolean
}

export function WizardHeader({
  className,
  showProgress = true,
  showSteps = true
}: WizardHeaderProps) {
  const { steps, currentStep, progress, goToStep } = useWizard()

  return (
    <div className={cn('space-y-6', className)}>
      {showProgress && <Progress value={progress} className='h-2' />}

      {showSteps && (
        <div className='flex items-center justify-between'>
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = step.isValid === true

            // Allow going back to previous steps or current step
            // For forward navigation, check if all previous steps are valid
            let isClickable = index <= currentStep
            if (index > currentStep) {
              isClickable = true
              for (let i = 0; i < index; i++) {
                if (!steps[i].isOptional && steps[i].isValid !== true) {
                  isClickable = false
                  break
                }
              }
            }

            return (
              <button
                key={step.id}
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                  isClickable && !isActive && 'hover:bg-accent/50',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isActive && 'bg-accent font-medium',
                  !isActive && isCompleted && 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                    isActive &&
                      'border-primary bg-primary text-primary-foreground',
                    isCompleted &&
                      !isActive &&
                      'border-primary bg-primary/10 text-primary',
                    !isActive && !isCompleted && 'border-muted-foreground/30'
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className='h-4 w-4' />
                  ) : (
                    <span className='text-sm'>{index + 1}</span>
                  )}
                </div>
                <div className='hidden text-left md:block'>
                  <p className='text-sm'>{step.title}</p>
                  {step.description && (
                    <p className='text-muted-foreground text-xs'>
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface WizardContentProps {
  children: ReactNode
  className?: string
}

export function WizardContent({ children, className }: WizardContentProps) {
  const { currentStep } = useWizard()

  return (
    <div className={cn('min-h-[400px]', className)}>
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

interface WizardFooterProps {
  onNext?: () => void | Promise<void>
  onPrev?: () => void
  onComplete?: () => void | Promise<void>
  nextLabel?: string
  prevLabel?: string
  completeLabel?: string
  className?: string
  showSkip?: boolean
  onSkip?: () => void
}

export function WizardFooter({
  onNext,
  onPrev,
  onComplete,
  nextLabel = 'Next',
  prevLabel = 'Previous',
  completeLabel = 'Complete',
  className,
  showSkip = false,
  onSkip
}: WizardFooterProps) {
  const {
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    isLoading,
    setIsLoading,
    steps,
    currentStep
  } = useWizard()

  const handleNext = async () => {
    if (onNext) {
      setIsLoading(true)
      try {
        await onNext()
        nextStep()
      } finally {
        setIsLoading(false)
      }
    } else {
      nextStep()
    }
  }

  const handlePrev = () => {
    onPrev?.()
    prevStep()
  }

  const handleComplete = async () => {
    if (onComplete) {
      setIsLoading(true)
      try {
        await onComplete()
      } finally {
        setIsLoading(false)
      }
    }
  }

  const currentStepData = steps[currentStep]
  const isOptional = currentStepData?.isOptional

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className='flex items-center gap-2'>
        <Button variant='outline' onClick={handlePrev} disabled={!canGoPrev}>
          <ChevronLeft className='mr-2 h-4 w-4' />
          {prevLabel}
        </Button>

        {showSkip && isOptional && !isLastStep && (
          <Button
            variant='ghost'
            onClick={() => {
              onSkip?.()
              nextStep()
            }}
            disabled={isLoading}
          >
            Skip
          </Button>
        )}
      </div>

      {isLastStep ? (
        <Button onClick={handleComplete} disabled={!canGoNext || isLoading}>
          {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
          {completeLabel}
        </Button>
      ) : (
        <Button onClick={handleNext} disabled={!canGoNext || isLoading}>
          {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
          {nextLabel}
          {!isLoading && <ChevronRight className='ml-2 h-4 w-4' />}
        </Button>
      )}
    </div>
  )
}

interface WizardStepProps {
  stepId: string
  children: ReactNode
  className?: string
}

export function WizardStep({ stepId, children, className }: WizardStepProps) {
  const { steps, currentStep } = useWizard()
  const isActive = steps[currentStep]?.id === stepId

  if (!isActive) return null

  return <div className={className}>{children}</div>
}

interface WizardProps {
  steps: WizardStep[]
  children: ReactNode
  className?: string
  initialStep?: number
  onStepChange?: (step: number) => void
}

export function Wizard({
  steps,
  children,
  className,
  initialStep = 0,
  onStepChange
}: WizardProps) {
  return (
    <WizardProvider
      steps={steps}
      initialStep={initialStep}
      onStepChange={onStepChange}
    >
      <div className={cn('space-y-6', className)}>{children}</div>
    </WizardProvider>
  )
}
