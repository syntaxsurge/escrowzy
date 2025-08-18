'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Briefcase } from 'lucide-react'
import useSWR from 'swr'

import { AuthRequiredModal } from '@/components/blocks/freelancers/auth-required-modal'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useUnifiedWalletInfo } from '@/context'
import { swrConfig, swrFetcher } from '@/lib/api/swr'

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
  isAuthenticated: _initialAuth, // Unused, we'll check auth internally
  className = 'w-full bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl',
  variant = 'default',
  showIcon = true,
  buttonText = 'Hire Me'
}: HireFreelancerButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Use SWR to check if user has a team (is authenticated with dashboard)
  const { data: teamData, isLoading: teamLoading } = useSWR(
    isConnected ? apiEndpoints.team : null,
    swrFetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      onError: () => {
        setHasCheckedAuth(true)
      },
      onSuccess: () => {
        setHasCheckedAuth(true)
      }
    }
  )

  useEffect(() => {
    if (!isConnected) {
      setHasCheckedAuth(false)
    }
  }, [isConnected])

  const isAuthenticated = !!teamData && !teamLoading && hasCheckedAuth

  const handleClick = (e: React.MouseEvent) => {
    if (!isConnected || !isAuthenticated) {
      e.preventDefault()
      setShowAuthModal(true)
      return
    }
  }

  // If fully authenticated, show as a link
  if (isAuthenticated) {
    return (
      <Button variant={variant} className={className} asChild>
        <Link
          href={appRoutes.trades.jobs.create + `?freelancer=${freelancerId}`}
        >
          {showIcon && <Briefcase className='mr-2 h-4 w-4' />}
          {buttonText}
        </Link>
      </Button>
    )
  }

  // Otherwise show as a button that opens auth modal
  return (
    <>
      <Button variant={variant} className={className} onClick={handleClick}>
        {showIcon && <Briefcase className='mr-2 h-4 w-4' />}
        {buttonText}
      </Button>
      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title={!isConnected ? 'Sign in to Hire' : 'Sign to Access Dashboard'}
        description={
          !isConnected
            ? 'Connect your wallet to hire this freelancer and create a job.'
            : 'Sign the message to access your dashboard and hire this freelancer.'
        }
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
      />
    </>
  )
}
