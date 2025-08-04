'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ArrowRightLeft,
  User,
  Clock,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Shield
} from 'lucide-react'

import { UserAvatar } from '@/components/blocks/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { formatRelativeTime } from '@/lib/utils/string'
import { getUserDisplayName } from '@/lib/utils/user'
import type { P2PListingWithUser } from '@/types/p2p-listings'
import { PAYMENT_METHODS } from '@/types/p2p-listings'

import { AcceptListingDialog } from './accept-listing-dialog'

interface ListingCardProps {
  listing: P2PListingWithUser
  onAccept?: () => void
}

export function ListingCard({ listing, onAccept }: ListingCardProps) {
  const router = useRouter()
  const { user } = useSession()
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)

  const isOwnListing = user?.id === listing.userId
  const totalValue =
    parseFloat(listing.amount) * parseFloat(listing.pricePerUnit)

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

  return (
    <>
      <Card className='transition-shadow hover:shadow-lg'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <UserAvatar user={listing.user} size='md' />
              <div>
                <p className='text-sm font-semibold'>
                  {getUserDisplayName(listing.user)}
                </p>
                <div className='mt-1 flex items-center gap-2'>
                  <Badge
                    variant={
                      listing.listingType === 'sell' ? 'default' : 'secondary'
                    }
                    className='text-xs'
                  >
                    {listing.listingType === 'sell' ? (
                      <>
                        <TrendingDown className='mr-1 h-3 w-3' />
                        Selling
                      </>
                    ) : (
                      <>
                        <TrendingUp className='mr-1 h-3 w-3' />
                        Buying
                      </>
                    )}
                  </Badge>
                  <Badge variant='outline' className='text-xs'>
                    {listing.tokenOffered}
                  </Badge>
                </div>
              </div>
            </div>
            {isOwnListing && (
              <Badge variant='outline' className='text-xs'>
                <Shield className='mr-1 h-3 w-3' />
                Your listing
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          {/* Amount and Price */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='text-muted-foreground mb-1 text-xs'>Amount</p>
              <p className='font-semibold'>
                {listing.amount} {listing.tokenOffered}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground mb-1 text-xs'>Price/Unit</p>
              <p className='font-semibold'>${listing.pricePerUnit}</p>
            </div>
          </div>

          {/* Total Value */}
          <div className='bg-muted rounded-lg p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Total Value</span>
              <span className='text-lg font-bold'>
                ${totalValue.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Limits */}
          {(listing.minAmount || listing.maxAmount) && (
            <div className='flex items-center gap-2 text-sm'>
              <ArrowRightLeft className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground'>Limits:</span>
              <span>
                {listing.minAmount || '0'} - {listing.maxAmount || '∞'}{' '}
                {listing.tokenOffered}
              </span>
            </div>
          )}

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div>
              <p className='text-muted-foreground mb-2 text-xs'>
                Payment Methods
              </p>
              <div className='flex flex-wrap gap-1'>
                {paymentMethods.map((method: string) => {
                  // Find the key for this payment method value
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
                    <Badge key={method} variant='secondary' className='text-xs'>
                      <CreditCard className='mr-1 h-3 w-3' />
                      {displayName}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Footer Info */}
          <div className='text-muted-foreground flex items-center justify-between text-xs'>
            <div className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              {formatRelativeTime(listing.createdAt)}
            </div>
            <div className='flex items-center gap-1'>
              <User className='h-3 w-3' />
              ID: {listing.id}
            </div>
          </div>
        </CardContent>

        <CardFooter className='pt-0'>
          {isOwnListing ? (
            <Button
              variant='outline'
              className='w-full'
              onClick={() =>
                router.push(appRoutes.trades.listings.withTab('my-listings'))
              }
            >
              Manage Listing
            </Button>
          ) : (
            <Button
              className='w-full'
              onClick={() => setAcceptDialogOpen(true)}
            >
              {listing.listingType === 'sell' ? 'Buy Now' : 'Sell Now'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Accept Listing Dialog */}
      <AcceptListingDialog
        open={acceptDialogOpen}
        onOpenChange={setAcceptDialogOpen}
        listing={listing}
        onSuccess={handleAcceptSuccess}
      />
    </>
  )
}
