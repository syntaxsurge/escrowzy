'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Shield,
  ArrowRight,
  Zap,
  Timer,
  Image as ImageIcon,
  Wallet
} from 'lucide-react'

import { UserAvatar } from '@/components/blocks/user-avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/string'
import { getUserDisplayName } from '@/lib/utils/user'
import type { TradeWithUsers, TradeMetadata } from '@/types/trade'
import { TRADE_STATUS } from '@/types/trade'

import { TradeActionDialog } from './trade-action-dialog'
import { TradeStatusTracker } from './trade-status-tracker'

interface TradeCardProps {
  trade: TradeWithUsers
  onUpdate?: () => void
}

export function TradeCard({ trade, onUpdate }: TradeCardProps) {
  const router = useRouter()
  const { user } = useSession()
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<
    'deposit' | 'fund' | 'payment_sent' | 'confirm' | 'dispute' | null
  >(null)
  const [justUpdated, setJustUpdated] = useState(false)
  const [depositTimeLeft, setDepositTimeLeft] = useState<number | null>(null)

  // Calculate deposit deadline countdown
  useEffect(() => {
    if (trade.status === 'awaiting_deposit' && trade.depositDeadline) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const deadline = new Date(trade.depositDeadline!).getTime()
        const timeLeft = Math.max(0, deadline - now)
        setDepositTimeLeft(Math.floor(timeLeft / 1000)) // in seconds
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [trade.status, trade.depositDeadline])

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Show update indicator briefly when trade updates
  useEffect(() => {
    setJustUpdated(true)
    const timer = setTimeout(() => setJustUpdated(false), 2000)
    return () => clearTimeout(timer)
  }, [trade.status, trade.metadata])

  const isBuyer = user?.id === trade.buyerId
  const isSeller = user?.id === trade.sellerId
  const otherParty = isBuyer ? trade.seller : trade.buyer
  const userRole = isBuyer ? 'buyer' : 'seller'
  const metadata = trade.metadata as TradeMetadata | null

  // Determine next action based on status and role
  const getNextAction = () => {
    switch (trade.status) {
      case 'created':
        return isBuyer
          ? {
              action: 'fund',
              label: 'Fund Escrow',
              variant: 'default' as const
            }
          : null
      case 'awaiting_deposit':
        return isSeller
          ? {
              action: 'deposit',
              label: 'Deposit Crypto',
              variant: 'default' as const
            }
          : null
      case 'funded':
        return isBuyer
          ? {
              action: 'payment_sent',
              label: 'Mark Payment Sent',
              variant: 'default' as const
            }
          : null
      case 'payment_sent':
        return isSeller
          ? {
              action: 'confirm',
              label: 'Confirm Payment',
              variant: 'default' as const
            }
          : null
      case 'delivered':
        return isBuyer
          ? {
              action: 'confirm',
              label: 'Confirm Receipt',
              variant: 'default' as const
            }
          : null
      default:
        return null
    }
  }

  const nextAction = getNextAction()

  // Get status badge variant
  const getStatusVariant = (
    status: string
  ): 'outline' | 'warning' | 'secondary' | 'success' | 'destructive' => {
    switch (status) {
      case 'created':
        return 'outline'
      case 'awaiting_deposit':
        return 'warning'
      case 'funded':
        return 'warning'
      case 'payment_sent':
        return 'secondary'
      case 'payment_confirmed':
        return 'secondary'
      case 'delivered':
        return 'secondary'
      case 'completed':
        return 'success'
      case 'disputed':
        return 'destructive'
      case 'deposit_timeout':
        return 'destructive'
      case 'refunded':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string): ReactNode => {
    switch (status) {
      case 'created':
        return <Clock className='h-3 w-3' />
      case 'funded':
        return <Shield className='h-3 w-3' />
      case 'delivered':
        return <ArrowRight className='h-3 w-3' />
      case 'completed':
        return <CheckCircle className='h-3 w-3' />
      case 'disputed':
        return <AlertCircle className='h-3 w-3' />
      case 'refunded':
        return <XCircle className='h-3 w-3' />
      default:
        return null
    }
  }

  const handleAction = (action: string) => {
    setActionType(action as any)
    setActionDialogOpen(true)
  }

  const handleActionSuccess = () => {
    setActionDialogOpen(false)
    setActionType(null)
    if (onUpdate) onUpdate()
  }

  return (
    <>
      <Card
        className={`transition-all hover:shadow-lg ${justUpdated ? 'ring-primary ring-opacity-50 ring-2' : ''}`}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <UserAvatar user={otherParty} size='md' />
              <div>
                <p className='text-sm font-semibold'>
                  Trading with {getUserDisplayName(otherParty)}
                </p>
                <div className='mt-1 flex items-center gap-2'>
                  <Badge variant='outline' className='text-xs'>
                    {userRole === 'buyer' ? 'Buying' : 'Selling'}
                  </Badge>
                  <Badge
                    variant={getStatusVariant(trade.status)}
                    className='text-xs'
                  >
                    <span className='flex items-center gap-1'>
                      {getStatusIcon(trade.status)}
                      <span>{TRADE_STATUS[trade.status] || trade.status}</span>
                    </span>
                  </Badge>
                  {justUpdated && (
                    <Badge variant='default' className='animate-pulse text-xs'>
                      <Zap className='mr-1 h-3 w-3' />
                      Updated
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Badge variant='outline' className='text-xs'>
              #{trade.id}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Deposit Timer Alert */}
          {trade.status === 'awaiting_deposit' && depositTimeLeft !== null && (
            <Alert
              variant={depositTimeLeft < 300 ? 'destructive' : 'default'}
              className='py-2'
            >
              <Timer className='h-4 w-4' />
              <AlertDescription className='ml-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>
                    {isSeller ? 'You have' : 'Seller has'}{' '}
                    <strong>{formatTimeLeft(depositTimeLeft)}</strong> to
                    deposit
                  </span>
                  {depositTimeLeft < 60 && (
                    <Badge variant='destructive' className='ml-2'>
                      Critical
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Proof Indicator */}
          {metadata?.paymentProofImages &&
            metadata.paymentProofImages.length > 0 && (
              <div className='flex items-center gap-2 rounded-md bg-green-50 p-2 dark:bg-green-950'>
                <ImageIcon className='h-4 w-4 text-green-600' />
                <span className='text-sm text-green-600 dark:text-green-400'>
                  Payment proof uploaded ({metadata.paymentProofImages.length}{' '}
                  screenshot
                  {metadata.paymentProofImages.length > 1 ? 's' : ''})
                </span>
              </div>
            )}

          {/* Crypto Deposit Indicator */}
          {metadata?.cryptoDepositTxHash && (
            <div className='flex items-center gap-2 rounded-md bg-blue-50 p-2 dark:bg-blue-950'>
              <Wallet className='h-4 w-4 text-blue-600' />
              <span className='text-sm text-blue-600 dark:text-blue-400'>
                Crypto deposited to escrow
              </span>
            </div>
          )}

          {/* Trade Status Tracker */}
          <TradeStatusTracker
            status={trade.status}
            userRole={userRole}
            depositDeadline={trade.depositDeadline}
          />

          {/* Trade Details */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Amount</span>
              <span className='font-medium'>
                {formatCurrency(trade.amount, trade.currency)}
              </span>
            </div>
            {metadata?.escrowFeeAmount && (
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Platform Fee</span>
                <span className='text-xs'>
                  {metadata.escrowFeeAmount} {trade.currency} (2.5%)
                </span>
              </div>
            )}
            {metadata?.escrowNetAmount && isSeller && (
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>You Receive</span>
                <span className='font-medium text-green-600'>
                  {formatCurrency(metadata.escrowNetAmount, trade.currency)}
                </span>
              </div>
            )}
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Trade Type</span>
              <span className='font-medium'>
                {String(trade.listingCategory)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Chain</span>
              <Badge variant='outline' className='text-xs'>
                Chain ID: {String(trade.chainId)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          {trade.metadata && typeof trade.metadata === 'object' && (
            <div className='space-y-2'>
              {(trade.metadata as any).paymentMethod && (
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Payment Method</span>
                  <span className='font-medium'>
                    {String((trade.metadata as any).paymentMethod)}
                  </span>
                </div>
              )}
              {(trade.metadata as any).pricePerUnit && (
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Price/Unit</span>
                  <span className='font-medium'>
                    ${String((trade.metadata as any).pricePerUnit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className='text-muted-foreground flex items-center justify-between text-xs'>
            <div className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              Created {formatRelativeTime(trade.createdAt)}
            </div>
            {trade.completedAt && (
              <div className='flex items-center gap-1'>
                <CheckCircle className='h-3 w-3' />
                Completed {formatRelativeTime(trade.completedAt)}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='flex gap-2 pt-0'>
          {/* Chat Button */}
          <Button
            variant='outline'
            size='sm'
            className='flex-1'
            onClick={() =>
              router.push(appRoutes.chat.trades(trade.id.toString()))
            }
          >
            <MessageSquare className='mr-2 h-4 w-4' />
            Chat
          </Button>

          {/* Action Button */}
          {nextAction && (
            <Button
              variant={nextAction.variant}
              size='sm'
              className='flex-1'
              onClick={() => handleAction(nextAction.action)}
            >
              {nextAction.label}
            </Button>
          )}

          {/* Dispute Button (available in certain states) */}
          {['funded', 'payment_sent', 'delivered'].includes(trade.status) && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => handleAction('dispute')}
            >
              Dispute
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Action Dialog */}
      {actionType && (
        <TradeActionDialog
          open={actionDialogOpen}
          onOpenChange={setActionDialogOpen}
          trade={trade}
          actionType={actionType}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  )
}
