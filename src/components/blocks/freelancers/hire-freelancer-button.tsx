'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Briefcase } from 'lucide-react'

import { SignMessageButton } from '@/components/blocks/blockchain/sign-message-button'
import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useUnifiedWalletInfo } from '@/context'
import { api } from '@/lib/api/http-client'

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
  isAuthenticated: initialAuth,
  className = 'w-full bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl',
  variant = 'default',
  showIcon = true,
  buttonText = 'Hire Me'
}: HireFreelancerButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  // Check authentication status when wallet connection changes
  useEffect(() => {
    const checkAuth = async () => {
      if (isConnected && !isAuthenticated) {
        setIsCheckingAuth(true)
        try {
          const response = await api.get(apiEndpoints.user.profile)
          if (response.success && response.data) {
            setIsAuthenticated(true)
          }
        } catch (error) {
          // User not authenticated
        } finally {
          setIsCheckingAuth(false)
        }
      }
    }
    checkAuth()
  }, [isConnected, isAuthenticated])

  // Not connected - show connect wallet button
  if (!isConnected) {
    return (
      <div className='w-full'>
        <UnifiedConnectButton />
      </div>
    )
  }

  // Connected but not authenticated - show sign message button
  if (isConnected && !isAuthenticated && !isCheckingAuth) {
    return (
      <SignMessageButton variant={variant} className={className}>
        Sign to Access Dashboard
      </SignMessageButton>
    )
  }

  // Authenticated - show hire button
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

  return null
}
