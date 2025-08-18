'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Briefcase } from 'lucide-react'

import { SignInModal } from '@/components/blocks/auth/sign-in-modal'
import { Button } from '@/components/ui/button'
import { appRoutes } from '@/config/app-routes'

interface HireFreelancerButtonProps {
  freelancerId: string
  isAuthenticated: boolean
  className?: string
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  showIcon?: boolean
  buttonText?: string
}

export function HireFreelancerButton({
  freelancerId,
  isAuthenticated,
  className = 'w-full bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl',
  variant = 'default',
  showIcon = true,
  buttonText = 'Hire Me'
}: HireFreelancerButtonProps) {
  const [showSignInModal, setShowSignInModal] = useState(false)

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant={variant}
          className={className}
          onClick={() => setShowSignInModal(true)}
        >
          {showIcon && <Briefcase className='mr-2 h-4 w-4' />}
          {buttonText}
        </Button>
        <SignInModal
          open={showSignInModal}
          onOpenChange={setShowSignInModal}
          title='Sign in to Hire'
          description='Connect your wallet to hire this freelancer and create a job.'
        />
      </>
    )
  }

  return (
    <Button variant={variant} className={className} asChild>
      <Link href={appRoutes.trades.jobs.create + `?freelancer=${freelancerId}`}>
        {showIcon && <Briefcase className='mr-2 h-4 w-4' />}
        {buttonText}
      </Link>
    </Button>
  )
}
