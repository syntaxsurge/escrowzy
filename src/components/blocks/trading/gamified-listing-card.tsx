'use client'

import { useState } from 'react'

import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Shield,
  Coins,
  DollarSign,
  ArrowRightLeft,
  Zap,
  Trophy,
  CheckCircle,
  Globe,
  Calendar,
  Users,
  BarChart
} from 'lucide-react'

import { AcceptListingDialog } from '@/app/(protected)/trades/listings/accept-listing-dialog'
import { UpdateListingDialog } from '@/app/(protected)/trades/listings/update-listing-dialog'
import { UserAvatar } from '@/components/blocks/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib'
import { formatRelativeTime } from '@/lib/utils/string'
import { getUserDisplayName } from '@/lib/utils/user'
import type { EscrowListingWithUser, DomainMetadata } from '@/types/listings'
import { PAYMENT_METHODS } from '@/types/listings'

interface GamifiedListingCardProps {
  listing: EscrowListingWithUser
  onAccept?: () => void
  onUpdate?: () => void
  showManageButton?: boolean
}

export function GamifiedListingCard({
  listing,
  onAccept,
  onUpdate,
  showManageButton = false
}: GamifiedListingCardProps) {
  const { user } = useSession()
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isOwnListing = user?.id === listing.userId
  const isDomainListing = listing.listingCategory === 'domain'
  const domainMetadata = isDomainListing
    ? (listing.metadata as DomainMetadata)
    : null

  const totalValue = isDomainListing
    ? parseFloat(listing.amount || '0')
    : parseFloat(listing.amount || '0') *
      parseFloat(listing.pricePerUnit || '0')

  // Parse payment methods from JSON
  const paymentMethods = Array.isArray(listing.paymentMethods)
    ? listing.paymentMethods
    : typeof listing.paymentMethods === 'string'
      ? JSON.parse(listing.paymentMethods)
      : []

  const handleAcceptSuccess = () => {
    setAcceptDialogOpen(false)
    if (onAccept) onAccept()
    // Navigation is handled in the dialog itself
  }

  const handleUpdateSuccess = () => {
    setUpdateDialogOpen(false)
    if (onUpdate) onUpdate()
  }

  // Get listing type config
  const getListingTypeConfig = () => {
    if (isDomainListing) {
      return {
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/50',
        borderColor: 'border-purple-500/60',
        shadowColor: 'shadow-purple-500/20',
        icon: <Globe className='h-4 w-4' />,
        label: 'DOMAIN',
        actionLabel: 'Buy Domain',
        actionColor:
          'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
      }
    } else if (listing.listingType === 'sell') {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/50',
        borderColor: 'border-green-500/60',
        shadowColor: 'shadow-green-500/20',
        icon: <TrendingDown className='h-4 w-4' />,
        label: 'SELLING',
        actionLabel: 'Buy Now',
        actionColor:
          'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
      }
    } else {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/50',
        borderColor: 'border-blue-500/60',
        shadowColor: 'shadow-blue-500/20',
        icon: <TrendingUp className='h-4 w-4' />,
        label: 'BUYING',
        actionLabel: 'Sell Now',
        actionColor:
          'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
      }
    }
  }

  const typeConfig = getListingTypeConfig()

  return (
    <>
      <Card
        className={cn(
          'group relative flex h-full flex-col overflow-hidden transition-all duration-500',
          'hover:scale-[1.02] hover:shadow-2xl',
          'from-background via-muted/50 to-primary/5 dark:to-primary/10 bg-gradient-to-br',
          'border-2 backdrop-blur-sm',
          isHovered && typeConfig.borderColor,
          isHovered && 'shadow-xl',
          isHovered && typeConfig.shadowColor,
          !isHovered && 'border-border/50 hover:border-border'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gaming Progress Bar */}
        <div className='absolute top-0 right-0 left-0 h-3 bg-black/20 dark:bg-white/10'>
          <div className='relative h-full overflow-hidden'>
            <div
              className='from-primary relative h-full bg-gradient-to-r via-purple-600 to-pink-600 transition-all duration-1000'
              style={{ width: listing.isActive ? '100%' : '0%' }}
            >
              <div className='animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent' />
            </div>
          </div>
          <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
            <span className='text-[8px] font-bold text-white/80 drop-shadow-md'>
              {listing.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* Own Listing Badge */}
        {isOwnListing && (
          <div className='absolute top-6 right-6 z-10'>
            <div className='relative'>
              <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 opacity-75 blur-lg' />
              <div className='relative rounded-full border border-white/20 bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2 text-xs font-black text-white uppercase shadow-xl'>
                <Shield className='mr-1 inline h-3 w-3' />
                YOUR LISTING
              </div>
            </div>
          </div>
        )}

        <CardHeader className='pt-12 pb-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <div className='from-primary/20 absolute inset-0 rounded-full bg-gradient-to-r to-purple-600/20 blur-xl' />
                <UserAvatar
                  user={listing.user}
                  size='lg'
                  className='border-primary/20 relative border-2'
                />
                {listing.isActive && (
                  <div className='absolute -right-1 -bottom-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 p-1.5 shadow-lg'>
                    <CheckCircle className='h-3 w-3 text-white' />
                  </div>
                )}
              </div>
              <div className='max-w-[60%]'>
                <p className='text-foreground mb-3 text-xl font-black'>
                  {getUserDisplayName(listing.user)}
                </p>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className={cn(
                      'border-2 text-xs font-bold',
                      listing.listingType === 'sell'
                        ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {typeConfig.icon}
                    <span className='ml-1'>{typeConfig.label}</span>
                  </Badge>
                  {!isDomainListing && (
                    <Badge
                      variant='outline'
                      className='from-primary/10 border-primary/30 bg-gradient-to-r to-purple-600/10 font-bold'
                    >
                      {listing.tokenOffered}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className='text-right'>
              <Badge
                variant='outline'
                className='from-primary/10 border-primary/30 mb-2 bg-gradient-to-r to-purple-600/10 font-bold'
              >
                ID #{listing.id}
              </Badge>
              <p className='text-muted-foreground text-xs font-medium'>
                {formatRelativeTime(listing.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className='flex-1 space-y-4'>
          {/* Gaming Trade Amount Card */}
          {isDomainListing ? (
            <div className='from-primary/20 border-primary/30 relative overflow-hidden rounded-xl border-2 bg-gradient-to-br via-purple-600/20 to-pink-600/20 p-5 backdrop-blur-sm'>
              <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
              <div className='relative'>
                <div className='mb-3 text-center'>
                  <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                    <Globe className='mr-1 inline h-3 w-3' />
                    Domain Name
                  </p>
                  <p className='from-primary truncate bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text px-2 text-2xl font-black text-transparent'>
                    {domainMetadata?.domainName || 'N/A'}
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                      <DollarSign className='mr-1 inline h-3 w-3' />
                      Price
                    </p>
                    <p className='from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-xl font-black text-transparent'>
                      ${listing.amount}
                    </p>
                  </div>
                  <div className='overflow-hidden text-center'>
                    <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                      <Users className='mr-1 inline h-3 w-3' />
                      Registrar
                    </p>
                    <p className='from-primary truncate bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text px-2 text-xl font-black text-transparent'>
                      {domainMetadata?.registrar || 'Unknown'}
                    </p>
                  </div>
                </div>
                {(domainMetadata?.monthlyTraffic !== undefined ||
                  domainMetadata?.monthlyRevenue !== undefined) && (
                  <div className='mt-3 grid grid-cols-2 gap-4'>
                    {domainMetadata?.monthlyTraffic !== undefined && (
                      <div className='text-center'>
                        <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                          <BarChart className='mr-1 inline h-3 w-3' />
                          Traffic/Mo
                        </p>
                        <p className='text-sm font-bold text-purple-600 dark:text-purple-400'>
                          {domainMetadata.monthlyTraffic.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {domainMetadata?.monthlyRevenue !== undefined && (
                      <div className='text-center'>
                        <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                          <DollarSign className='mr-1 inline h-3 w-3' />
                          Revenue/Mo
                        </p>
                        <p className='text-sm font-bold text-green-600 dark:text-green-400'>
                          ${domainMetadata.monthlyRevenue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {domainMetadata?.expiryDate && (
                  <div className='mt-3 text-center'>
                    <div className='inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-4 py-2 dark:from-yellow-500/20 dark:to-amber-500/20'>
                      <Calendar className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
                      <span className='text-sm font-bold text-yellow-600 dark:text-yellow-400'>
                        EXPIRES:{' '}
                        {new Date(
                          domainMetadata.expiryDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='from-primary/20 border-primary/30 relative overflow-hidden rounded-xl border-2 bg-gradient-to-br via-purple-600/20 to-pink-600/20 p-5 backdrop-blur-sm'>
              <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
              <div className='relative'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                      <Coins className='mr-1 inline h-3 w-3' />
                      Amount
                    </p>
                    <p className='from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-2xl font-black text-transparent'>
                      {listing.amount} {listing.tokenOffered}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase'>
                      <DollarSign className='mr-1 inline h-3 w-3' />
                      Price/Unit
                    </p>
                    <p className='from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-2xl font-black text-transparent'>
                      ${listing.pricePerUnit}
                    </p>
                  </div>
                </div>
                <div className='mt-3 text-center'>
                  <div className='inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-4 py-2 dark:from-yellow-500/20 dark:to-amber-500/20'>
                    <Trophy className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
                    <span className='text-sm font-bold text-yellow-600 dark:text-yellow-400'>
                      TOTAL VALUE: ${totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Limits - only for P2P */}
          {!isDomainListing && (listing.minAmount || listing.maxAmount) && (
            <div className='border-border/50 bg-muted/50 flex items-center justify-center gap-2 rounded-lg border p-3'>
              <ArrowRightLeft className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground text-sm font-bold uppercase'>
                Limits:
              </span>
              <Badge className='bg-primary/20 text-primary border-0 font-bold'>
                {listing.minAmount || '0'} - {listing.maxAmount || '∞'}{' '}
                {listing.tokenOffered}
              </Badge>
            </div>
          )}

          {/* Gaming Payment Methods - Only show for P2P listings */}
          {!isDomainListing && paymentMethods.length > 0 && (
            <div className='from-muted/50 to-muted/30 border-border/50 rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm'>
              <p className='text-muted-foreground mb-3 text-center text-xs font-bold tracking-wider uppercase'>
                <CreditCard className='mr-1 inline h-3 w-3' />
                Payment Methods
              </p>
              <div className='flex flex-wrap justify-center gap-2'>
                {paymentMethods.map((method: string) => {
                  const methodKey = Object.keys(PAYMENT_METHODS).find(
                    key =>
                      PAYMENT_METHODS[key as keyof typeof PAYMENT_METHODS] ===
                      method
                  )
                  const displayName = methodKey
                    ? methodKey
                        .split('_')
                        .map(
                          word =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(' ')
                    : method
                  return (
                    <Badge
                      key={method}
                      className='border-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 font-bold text-blue-600 dark:text-blue-400'
                    >
                      <Zap className='mr-1 h-3 w-3' />
                      {displayName}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className='mt-auto flex flex-col gap-3 pt-6 pb-6'>
          {isOwnListing && showManageButton ? (
            <Button
              variant='outline'
              size='lg'
              className='from-background/80 to-muted/80 border-primary/30 hover:border-primary/50 hover:bg-primary/10 w-full border-2 bg-gradient-to-r font-bold backdrop-blur-sm transition-all hover:scale-105'
              onClick={() => setUpdateDialogOpen(true)}
            >
              MANAGE LISTING
            </Button>
          ) : !isOwnListing ? (
            <Button
              size='lg'
              className={cn(
                'group relative h-12 w-full overflow-hidden border-0 bg-gradient-to-r text-base font-black text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl',
                typeConfig.actionColor
              )}
              onClick={() => setAcceptDialogOpen(true)}
            >
              <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full' />
              <Zap className='mr-2 h-5 w-5' />
              <span className='tracking-wider uppercase'>
                {typeConfig.actionLabel}
              </span>
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      {/* Accept Listing Dialog */}
      <AcceptListingDialog
        open={acceptDialogOpen}
        onOpenChange={setAcceptDialogOpen}
        listing={listing}
        onSuccess={handleAcceptSuccess}
      />

      {/* Update Listing Dialog */}
      {isOwnListing && (
        <UpdateListingDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          listing={listing}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  )
}
