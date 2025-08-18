'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import {
  LayoutDashboard,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  Edit2,
  Menu,
  X,
  Users,
  ShoppingBag,
  Briefcase,
  Globe,
  DollarSign
} from 'lucide-react'
import { useTheme } from 'next-themes'
import useSWR from 'swr'

import { NetworkSelector } from '@/components/blocks/blockchain/network-selector'
import { SignMessageButton } from '@/components/blocks/blockchain/sign-message-button'
import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { WalletNetworkSection } from '@/components/blocks/blockchain/unified-wallet-network-section'
import { NotificationDropdown } from '@/components/blocks/notification-dropdown'
import { MobileMenu } from '@/components/blocks/responsive'
import { UserAvatar } from '@/components/blocks/user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { envPublic } from '@/config/env.public'
import { useUnifiedWalletInfo } from '@/context'
import { useUnifiedWalletAuth } from '@/hooks/blockchain/use-unified-wallet-auth'
import { useDialogState } from '@/hooks/use-dialog-state'
import { swrFetcher } from '@/lib/api/swr'
import type { User } from '@/lib/db/schema'

// TypeScript declarations for wallet providers
declare global {
  interface Window {
    ethereum?: any
    tronWeb?: any
  }
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const getThemeIcon = () => {
    if (!mounted) return <Sun className='h-4 w-4' />
    return theme === 'light' ? (
      <Sun className='h-4 w-4' />
    ) : (
      <Moon className='h-4 w-4' />
    )
  }

  if (!mounted) {
    return (
      <Button variant='ghost' size='sm' disabled>
        <Monitor className='h-4 w-4' />
      </Button>
    )
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={toggleTheme}
      className='hover:bg-muted relative h-9 w-9 rounded-xl transition-all duration-200'
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {getThemeIcon()}
    </Button>
  )
}

function UserMenu() {
  const menuState = useDialogState()
  const { address, isConnected, onAddressChange } = useUnifiedWalletInfo()
  const { isAuthenticating } = useUnifiedWalletAuth()
  const {
    data: userData,
    isLoading,
    error: _error,
    mutate: mutateUser
  } = useSWR<{ user: User | null }>(
    isConnected && address ? apiEndpoints.user.profile : null,
    swrFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true
    }
  )
  const user = userData?.user
  const [isWalletInitializing, setIsWalletInitializing] = useState(true)
  const [prevConnected, setPrevConnected] = useState(false)
  const [prevAddress, setPrevAddress] = useState<string | undefined>()

  // Wait for wallet provider to initialize and determine connection state
  useEffect(() => {
    let mounted = true

    // Track connection changes to know when auto-connect finishes
    const checkWalletInitialization = async () => {
      // Give Thirdweb ConnectButton time to mount and check for auto-connect
      // The ConnectButton has autoConnect with 15 second timeout
      await new Promise(resolve => setTimeout(resolve, 100))

      // Start checking if wallet is still trying to auto-connect
      let checkCount = 0
      const maxChecks = 25 // 2.5 seconds total (25 * 100ms)

      const checkInterval = setInterval(() => {
        checkCount++

        // If we're connected or we've checked enough times, we're done initializing
        if (isConnected || checkCount >= maxChecks) {
          clearInterval(checkInterval)
          if (mounted) {
            setIsWalletInitializing(false)
          }
        }
      }, 100)

      return () => {
        clearInterval(checkInterval)
      }
    }

    checkWalletInitialization()

    return () => {
      mounted = false
    }
  }, [isConnected])

  // Refresh user data when connection status changes
  useEffect(() => {
    if (isConnected && !prevConnected) {
      // Just connected, refresh user data
      mutateUser()
    }
    setPrevConnected(isConnected)
  }, [isConnected, prevConnected, mutateUser])

  // Detect wallet address changes and handle user synchronization
  useEffect(() => {
    if (address !== prevAddress && prevAddress !== undefined) {
      console.log('Address changed in header:', {
        from: prevAddress,
        to: address
      })

      // Clear current user data immediately
      mutateUser({ user: null }, false)

      // If we have a new address, fetch the new user
      if (address) {
        // Force re-fetch user data for the new address
        mutateUser()
      }
    }
    setPrevAddress(address)
  }, [address, prevAddress, mutateUser])

  // Register address change callback
  useEffect(() => {
    if (onAddressChange) {
      onAddressChange(async (newAddress?: string, oldAddress?: string) => {
        console.log('Address change callback triggered:', {
          from: oldAddress,
          to: newAddress
        })

        // Clear user data and session when address changes
        if (oldAddress !== newAddress && oldAddress !== undefined) {
          // Clear user data immediately
          mutateUser({ user: null }, false)

          // Clear the session on the server
          try {
            const response = await fetch(apiEndpoints.auth.wallet, {
              method: 'DELETE'
            })
            if (response.ok) {
              console.log('Session cleared successfully')
            }
          } catch (error) {
            console.error('Failed to clear session:', error)
          }

          // Force re-authentication for the new address
          if (newAddress) {
            mutateUser()
          }
        }
      })
    }
  }, [onAddressChange, mutateUser])

  // Determine if we're ready to show the UI
  const isReady =
    !isWalletInitializing &&
    (!isConnected || // Not connected, show connect button
      (isConnected && !isLoading)) // Connected and user data loaded

  // Show loading state while checking for auto-connect or authenticating
  if (!isReady || isAuthenticating) {
    return (
      <div className='bg-muted hover:bg-muted/80 flex items-center gap-2 rounded-xl px-3 py-2'>
        <Spinner size='sm' className='text-muted-foreground' />
        <span className='text-foreground text-sm font-medium'>Loading...</span>
      </div>
    )
  }

  // Once ready, show the appropriate final state
  return (
    <>
      {/* Show based on actual connection state */}
      {!isConnected ? (
        // Not connected - show connect button with auto-connect enabled
        <UnifiedConnectButton skipAutoConnect={false} />
      ) : (
        <div className='flex items-center'>
          <DropdownMenu
            open={menuState.isOpen}
            onOpenChange={open => (open ? menuState.open() : menuState.close())}
          >
            <DropdownMenuTrigger className='bg-muted hover:bg-muted/80 focus:ring-primary flex items-center gap-2 rounded-xl px-3 py-2 transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none'>
              {user ? (
                <>
                  <UserAvatar user={user} walletAddress={address} size='sm' />
                  <ChevronDown className='text-foreground h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180' />
                </>
              ) : (
                <>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-xs font-semibold text-white'>
                    !
                  </div>
                  <span className='text-foreground hidden text-sm font-medium sm:inline'>
                    Sign Required
                  </span>
                  <ChevronDown className='text-foreground h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180' />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='border-border bg-background/95 mt-2 w-80 rounded-2xl border shadow-2xl backdrop-blur-xl'
            >
              {user ? (
                // Authenticated User View
                <>
                  {/* User Profile Header */}
                  <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
                    <div className='absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl' />
                    {/* Edit Profile Button */}
                    <Link
                      href={appRoutes.dashboard.settings.base}
                      className='absolute top-4 right-4 z-10'
                      onClick={() => menuState.close()}
                    >
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full bg-white/80 shadow-sm transition-all hover:scale-105 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800'
                      >
                        <Edit2 className='h-4 w-4 text-gray-600 dark:text-gray-300' />
                      </Button>
                    </Link>
                    <div className='relative flex items-center gap-4'>
                      <div className='relative'>
                        <UserAvatar
                          user={user}
                          walletAddress={address}
                          size='lg'
                          showBorder
                        />
                        <div className='absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-sm dark:border-gray-700' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-foreground text-base font-semibold'>
                          {user.name || 'User'}
                        </p>
                        {user.email && (
                          <p className='text-muted-foreground text-sm'>
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wallet & Network Section */}
                  <WalletNetworkSection
                    address={address}
                    onCloseMenu={() => menuState.close()}
                  />

                  {/* Navigation Links */}
                  <div className='space-y-1 p-2'>
                    <DropdownMenuItem
                      className='text-foreground cursor-pointer rounded-xl border-0 px-4 py-3 text-sm font-medium transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50 focus:text-blue-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-blue-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-blue-400'
                      asChild
                    >
                      <Link
                        href={appRoutes.dashboard.base}
                        className='flex w-full items-center'
                        onClick={() => menuState.close()}
                      >
                        <div className='mr-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2'>
                          <LayoutDashboard className='h-4 w-4 text-white' />
                        </div>
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className='text-foreground cursor-pointer rounded-xl border-0 px-4 py-3 text-sm font-medium transition-all hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:text-indigo-700 focus:bg-gradient-to-r focus:from-indigo-50 focus:to-blue-50 focus:text-indigo-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-indigo-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-indigo-400'
                      asChild
                    >
                      <Link
                        href={appRoutes.chat.base}
                        className='flex w-full items-center'
                        onClick={() => menuState.close()}
                      >
                        <div className='mr-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 p-2'>
                          <MessageSquare className='h-4 w-4 text-white' />
                        </div>
                        <span>Chat</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className='text-foreground cursor-pointer rounded-xl border-0 px-4 py-3 text-sm font-medium transition-all hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 focus:bg-gradient-to-r focus:from-purple-50 focus:to-pink-50 focus:text-purple-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-purple-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-purple-400'
                      asChild
                    >
                      <Link
                        href='/profile/freelancer'
                        className='flex w-full items-center'
                        onClick={() => menuState.close()}
                      >
                        <div className='mr-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 p-2'>
                          <Users className='h-4 w-4 text-white' />
                        </div>
                        <span>Freelancer Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  {/* Disconnect Button - Now opens wallet modal */}
                  <div className='border-t border-gray-100/50 dark:border-gray-700/50'>
                    <WalletNetworkSection
                      address={address}
                      onCloseMenu={() => menuState.close()}
                      showWalletButton={true}
                    />
                  </div>
                </>
              ) : (
                // Unauthenticated User View (Connected but not signed)
                <>
                  {/* Sign Required Header */}
                  <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-50 via-white to-red-50 p-6 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
                    <div className='absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/20 blur-2xl' />
                    <div className='relative flex items-center gap-4'>
                      <div className='relative'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-orange-500 to-red-600 text-lg font-bold text-white shadow-lg dark:border-gray-700'>
                          !
                        </div>
                        <div className='absolute -right-1 -bottom-1 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-orange-500 shadow-sm dark:border-gray-700' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-foreground text-base font-semibold'>
                          Authentication Required
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Please sign to access dashboard
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Instructions & Sign Button */}
                  <div className='space-y-4 p-4'>
                    <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30'>
                      <div className='flex items-start gap-3'>
                        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white'>
                          i
                        </div>
                        <div className='flex-1'>
                          <p className='mb-1 text-sm font-medium text-amber-800 dark:text-amber-300'>
                            Sign to Access Dashboard
                          </p>
                          <p className='text-xs leading-relaxed text-amber-700 dark:text-amber-400'>
                            You need to sign a message to verify wallet
                            ownership before accessing dashboard features. This
                            is a one-time process per session.
                          </p>
                        </div>
                      </div>
                    </div>

                    <SignMessageButton className='w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-xl' />
                  </div>

                  {/* Wallet & Network Section */}
                  <WalletNetworkSection
                    address={address}
                    onCloseMenu={() => menuState.close()}
                  />

                  {/* Disconnect Button - Now opens wallet modal */}
                  <div className='border-t border-gray-100/50 dark:border-gray-700/50'>
                    <WalletNetworkSection
                      address={address}
                      onCloseMenu={() => menuState.close()}
                      showWalletButton={true}
                    />
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  )
}

function PublicNavigation({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  user
}: {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  user: User | null | undefined
}) {
  const [isBrowseOpen, setIsBrowseOpen] = useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className='hidden items-center gap-1 md:flex'>
        {/* Browse Dropdown */}
        <DropdownMenu open={isBrowseOpen} onOpenChange={setIsBrowseOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='text-muted-foreground hover:text-foreground hover:bg-muted h-9 gap-1 px-3 text-sm font-medium transition-all'
            >
              Browse
              <ChevronDown className='h-3.5 w-3.5 transition-transform duration-200 data-[state=open]:rotate-180' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            className='border-border bg-background/95 mt-2 w-56 rounded-xl border shadow-lg backdrop-blur-xl'
          >
            <DropdownMenuItem asChild>
              <Link
                href={appRoutes.freelancers}
                className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50 focus:text-blue-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-blue-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-blue-400'
              >
                <Users className='h-4 w-4' />
                <span>Freelancers</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href='/listings?category=p2p'
                className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 focus:bg-gradient-to-r focus:from-purple-50 focus:to-pink-50 focus:text-purple-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-purple-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-purple-400'
              >
                <ShoppingBag className='h-4 w-4' />
                <span>P2P Marketplace</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={appRoutes.domains}
                className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:text-indigo-700 focus:bg-gradient-to-r focus:from-indigo-50 focus:to-blue-50 focus:text-indigo-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-indigo-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-indigo-400'
              >
                <Globe className='h-4 w-4' />
                <span>Domain Names</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={appRoutes.services}
                className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 focus:bg-gradient-to-r focus:from-emerald-50 focus:to-green-50 focus:text-emerald-700 dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-emerald-400 dark:focus:from-gray-800 dark:focus:to-gray-700 dark:focus:text-emerald-400'
              >
                <Briefcase className='h-4 w-4' />
                <span>Services</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Pricing Link */}
        <Link
          href={appRoutes.pricing}
          className='text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-all'
        >
          Pricing
        </Link>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        className='bg-background/95 border-border top-[60px] border-t backdrop-blur-xl'
      >
        <div className='max-h-[calc(100vh-80px)] space-y-1 overflow-y-auto p-4'>
          <div className='text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wider uppercase'>
            Browse
          </div>
          <Link
            href={appRoutes.freelancers}
            className='text-foreground hover:bg-muted active:bg-muted flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Users className='text-primary h-5 w-5' />
            <span>Freelancers</span>
          </Link>
          <Link
            href='/listings?category=p2p'
            className='text-foreground hover:bg-muted active:bg-muted flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ShoppingBag className='h-5 w-5 text-purple-600' />
            <span>P2P Marketplace</span>
          </Link>
          <Link
            href={appRoutes.domains}
            className='text-foreground hover:bg-muted active:bg-muted flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Globe className='h-5 w-5 text-indigo-600' />
            <span>Domain Names</span>
          </Link>
          <Link
            href={appRoutes.services}
            className='text-foreground hover:bg-muted active:bg-muted flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Briefcase className='h-5 w-5 text-green-600' />
            <span>Services</span>
          </Link>

          <div className='border-border my-3 border-t' />

          <Link
            href={appRoutes.pricing}
            className='text-foreground hover:bg-muted active:bg-muted flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <DollarSign className='h-5 w-5 text-yellow-600' />
            <span>Pricing</span>
          </Link>

          <div className='border-border my-3 border-t' />

          {/* Settings Section - Mobile Only */}
          <div className='text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wider uppercase'>
            Settings
          </div>

          {/* Theme Toggle */}
          <div className='px-3 py-2'>
            <ThemeToggle />
          </div>

          {/* Network Selector */}
          <div className='px-3 py-2'>
            <NetworkSelector isAuthenticated={!!user} />
          </div>
        </div>
      </MobileMenu>
    </>
  )
}

export default function Header() {
  const { isConnected } = useUnifiedWalletInfo()
  const { data: userData } = useSWR<{ user: User | null }>(
    isConnected ? apiEndpoints.user.profile : null,
    swrFetcher
  )
  const user = userData?.user
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className='border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl'>
      <div className='relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link
          href={appRoutes.home}
          className='group flex items-center space-x-3 transition-all duration-200'
        >
          <div className='relative'>
            <Image
              src={appRoutes.assets.logo}
              alt={envPublic.NEXT_PUBLIC_APP_NAME}
              width={40}
              height={40}
              className='rounded-lg shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg'
            />
          </div>
          <span className='from-foreground to-muted-foreground hidden bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent sm:block'>
            {envPublic.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>

        {/* Center Navigation */}
        <PublicNavigation
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
        />

        {/* Right Side Actions */}
        <div className='flex items-center gap-2'>
          {/* Mobile Menu Button */}
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className='h-5 w-5' />
            ) : (
              <Menu className='h-5 w-5' />
            )}
          </Button>

          {/* Desktop Actions - Show theme and network on desktop only */}
          <div className='hidden items-center gap-2 md:flex'>
            <ThemeToggle />
            <NetworkSelector isAuthenticated={!!user} />
            {/* Only show notifications when user is authenticated */}
            {isConnected && user && <NotificationDropdown />}
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
