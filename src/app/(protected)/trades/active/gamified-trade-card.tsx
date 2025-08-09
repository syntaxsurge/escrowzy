'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Shield,
  Image as ImageIcon,
  DollarSign,
  AlertTriangle,
  Trophy,
  ExternalLink,
  Eye
} from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

import { SellerDepositTimer } from '@/components/blocks/trading'
import { UserAvatar } from '@/components/blocks/user-avatar'
import { navigationProgress } from '@/components/providers/navigation-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib'
import { getChainConfig } from '@/lib/blockchain'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/string'
import { getUserDisplayName } from '@/lib/utils/user'
import type { TradeWithUsers, TradeMetadata } from '@/types/trade'

import { TradeActionDialog } from './trade-action-dialog'

interface GamifiedTradeCardProps {
  trade: TradeWithUsers
  onUpdate?: () => void
  userId?: number
}

export function GamifiedTradeCard({
  trade,
  onUpdate,
  userId: propUserId
}: GamifiedTradeCardProps) {
  const router = useRouter()
  const { user } = useSession()
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<
    'deposit' | 'fund' | 'payment_sent' | 'confirm' | 'dispute' | null
  >(null)
  const [isHovered, setIsHovered] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<Array<{ src: string }>>(
    []
  )

  // Get user ID - prefer prop, then hook
  const userId = propUserId || user?.id

  // Seller/buyer detection
  const isBuyer = userId === trade.buyerId
  const isSeller = userId === trade.sellerId

  const otherParty = isBuyer ? trade.seller : trade.buyer
  const userRole = isSeller ? 'seller' : 'buyer'
  const metadata = trade.metadata as TradeMetadata | null

  // Calculate progress percentage based on status
  const getProgressPercentage = () => {
    const statusOrder = [
      'created',
      'awaiting_deposit',
      'funded',
      'payment_sent',
      'payment_confirmed',
      'completed'
    ]
    const currentIndex = statusOrder.indexOf(trade.status)
    if (currentIndex === -1) return 0
    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  // Get status color and icon
  const getStatusConfig = () => {
    switch (trade.status) {
      case 'created':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
          icon: <Clock className='h-4 w-4' />,
          label: 'Pending',
          urgent: false
        }
      case 'awaiting_deposit':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/30',
          icon: <Clock className='h-4 w-4' />,
          label: 'Awaiting Deposit',
          urgent: false
        }
      case 'funded':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/30',
          icon: <Shield className='h-4 w-4' />,
          label: 'In Escrow'
        }
      case 'payment_sent':
        return {
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/30',
          icon: <DollarSign className='h-4 w-4' />,
          label: 'Payment Sent'
        }
      case 'completed':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/30',
          icon: <Trophy className='h-4 w-4' />,
          label: 'Completed'
        }
      case 'disputed':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/30',
          icon: <AlertTriangle className='h-4 w-4' />,
          label: 'Disputed'
        }
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/30',
          icon: <Clock className='h-4 w-4' />,
          label: trade.status
        }
    }
  }

  const statusConfig = getStatusConfig()

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
        className={cn(
          'group relative flex h-full min-h-[600px] flex-col overflow-hidden transition-all duration-500',
          'hover:scale-[1.02] hover:shadow-2xl',
          'from-background via-muted/50 to-primary/5 dark:to-primary/10 bg-gradient-to-br',
          'border-2 backdrop-blur-sm',
          statusConfig.urgent &&
            'border-orange-500/60 shadow-xl shadow-orange-500/20 hover:border-orange-500',
          !statusConfig.urgent &&
            isHovered &&
            'border-primary/60 hover:border-primary shadow-primary/20 shadow-xl',
          !statusConfig.urgent &&
            !isHovered &&
            'border-border/50 hover:border-border'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gaming Progress Bar */}
        <div className='absolute top-0 right-0 left-0 h-3 bg-black/20 dark:bg-white/10'>
          <div className='relative h-full overflow-hidden'>
            <div
              className='from-primary relative h-full bg-gradient-to-r via-purple-600 to-pink-600 transition-all duration-1000'
              style={{ width: `${getProgressPercentage()}%` }}
            >
              <div className='animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent' />
            </div>
          </div>
          <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
            <span className='text-[8px] font-bold text-white/80 drop-shadow-md'>
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
        </div>

        <CardHeader className='pt-8 pb-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <div className='from-primary/20 absolute inset-0 rounded-full bg-gradient-to-r to-purple-600/20 blur-xl' />
                <UserAvatar
                  user={otherParty}
                  size='lg'
                  className='border-primary/20 relative border-2'
                />
                {trade.status === 'completed' && (
                  <div className='absolute -right-1 -bottom-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 p-1.5 shadow-lg'>
                    <CheckCircle className='h-3 w-3 text-white' />
                  </div>
                )}
              </div>
              <div className='flex-1'>
                <p className='text-foreground text-xl font-black'>
                  {getUserDisplayName(otherParty)}
                </p>
                <div className='mt-2 flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='outline'
                      className={cn(
                        'border-2 text-xs font-bold',
                        userRole === 'buyer'
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                      )}
                    >
                      {userRole === 'buyer' ? '💰 BUYING' : '🏪 SELLING'}
                    </Badge>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold',
                        statusConfig.bgColor,
                        'border-current/20'
                      )}
                    >
                      <span
                        className={cn(statusConfig.color, 'drop-shadow-sm')}
                      >
                        {statusConfig.icon}
                      </span>
                      <span className={cn(statusConfig.color, 'uppercase')}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='text-right'>
              <div className='mb-3 flex flex-col items-end gap-2'>
                <Badge
                  variant='outline'
                  className='from-primary/10 border-primary/30 bg-gradient-to-r to-purple-600/10 font-bold'
                >
                  TRADE #{trade.id}
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    navigationProgress.start()
                    router.push(
                      appRoutes.trades.history.detail(trade.id.toString())
                    )
                  }}
                  className='group border-primary/30 bg-primary/10 text-primary hover:border-primary/50 hover:bg-primary/20 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:scale-105'
                >
                  <Eye className='h-3.5 w-3.5 transition-transform group-hover:scale-110' />
                  VIEW DETAILS
                </Button>
              </div>
              <p className='text-muted-foreground text-xs font-medium'>
                {formatRelativeTime(trade.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className='flex-1 space-y-4'>
          {/* Game Timer for Deposits */}
          {trade.status === 'awaiting_deposit' && trade.depositDeadline && (
            <SellerDepositTimer
              depositDeadline={trade.depositDeadline}
              isSeller={isSeller}
            />
          )}

          {/* Gaming Trade Amount Card */}
          <div className='from-primary/20 border-primary/30 relative overflow-hidden rounded-xl border-2 bg-gradient-to-br via-purple-600/20 to-pink-600/20 p-5 backdrop-blur-sm'>
            <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
            <div className='relative text-center'>
              <p className='text-muted-foreground mb-2 text-sm font-bold tracking-wider uppercase'>
                💎 Trade Amount
              </p>
              <div className='relative inline-block'>
                <p className='from-primary bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-3xl font-black text-transparent'>
                  {formatCurrency(trade.amount, trade.currency)}
                </p>
              </div>
              {metadata?.escrowNetAmount && isSeller && (
                <div className='mt-3 space-y-1'>
                  <div className='text-sm font-bold text-green-600 dark:text-green-400'>
                    NET:{' '}
                    {formatCurrency(metadata.escrowNetAmount, trade.currency)}
                  </div>
                  <div className='text-xs font-medium text-green-600/80 dark:text-green-400/80'>
                    -2.5% FEE
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gaming Trade Details */}
          <div className='from-muted/50 to-muted/30 border-border/50 space-y-3 rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm font-bold tracking-wider uppercase'>
                ⚡ Method
              </span>
              <Badge className='from-primary/20 text-primary dark:text-primary border-primary/30 bg-gradient-to-r to-purple-600/20 font-bold'>
                {metadata?.paymentMethod || 'Bank Transfer'}
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm font-bold tracking-wider uppercase'>
                🔗 Network
              </span>
              <Badge className='border-blue-500/30 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 font-bold text-blue-600 dark:text-blue-400'>
                {getChainConfig(trade.chainId)?.name ||
                  `Chain ${trade.chainId}`}
              </Badge>
            </div>
          </div>

          {/* Crypto Secured Status - Show First */}
          {metadata?.cryptoDepositTxHash && (
            <div className='group relative overflow-hidden rounded-xl border-2 border-green-500/50 bg-gradient-to-br from-green-500/20 via-emerald-600/20 to-teal-600/20 p-4 backdrop-blur-sm transition-all hover:scale-105 hover:border-green-500 hover:shadow-xl hover:shadow-green-500/20'>
              <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-green-600/10 to-emerald-600/10' />
              <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
              <div className='relative flex items-center justify-center gap-3'>
                <div className='relative'>
                  <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-green-500 to-emerald-600 opacity-75 blur-lg' />
                  <div className='relative rounded-full bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 p-3 shadow-xl'>
                    <Shield className='h-6 w-6 text-white' />
                  </div>
                </div>
                <div className='text-center'>
                  <p className='bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-lg font-black text-transparent'>
                    🔒 CRYPTO SECURED IN ESCROW
                  </p>
                  <p className='mt-1 text-xs font-bold text-green-600 dark:text-green-400'>
                    Your funds are protected by smart contract
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Proof - Show Below Crypto Secured */}
          {metadata?.paymentProofImages &&
            metadata.paymentProofImages.length > 0 && (
              <button
                className='flex w-full items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 transition-all hover:scale-105 hover:border-green-400 hover:bg-green-100 hover:shadow-md dark:border-green-800 dark:bg-green-950 dark:hover:border-green-600 dark:hover:bg-green-900'
                onClick={() => {
                  const images = (metadata.paymentProofImages || []).map(
                    (url: string) => ({ src: url })
                  )
                  setLightboxImages(images)
                  setLightboxOpen(true)
                }}
              >
                <ImageIcon className='h-5 w-5 text-green-600' />
                <div className='flex-1 text-left'>
                  <p className='text-sm font-medium text-green-600'>
                    Payment Proof
                  </p>
                  <p className='text-xs text-green-600/80'>
                    {metadata.paymentProofImages.length} screenshot(s)
                  </p>
                </div>
                <ExternalLink className='h-4 w-4 text-green-600/60' />
              </button>
            )}
        </CardContent>

        <CardFooter className='border-border/50 bg-muted/30 mt-auto flex flex-col gap-3 border-t pt-6 pb-6'>
          {/* View Details Button - Primary Action */}
          <Button
            size='lg'
            className='group relative h-12 w-full overflow-hidden border-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-base font-black text-white shadow-xl transition-all hover:scale-105 hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl'
            onClick={() => {
              navigationProgress.start()
              router.push(`/trades/history/${trade.id}`)
            }}
          >
            <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full' />
            <Eye className='mr-2 h-5 w-5' />
            VIEW DETAILS
          </Button>

          {/* Chat and Dispute Buttons Row */}
          <div className='flex w-full gap-3'>
            {/* Gaming Chat Button */}
            <Button
              variant='outline'
              size='lg'
              className='from-background/80 to-muted/80 border-primary/30 hover:border-primary/50 hover:bg-primary/10 group h-12 flex-1 border-2 bg-gradient-to-r font-bold backdrop-blur-sm transition-all hover:scale-105'
              onClick={() => {
                navigationProgress.start()
                router.push(appRoutes.chat.trades(trade.id.toString()))
              }}
            >
              <MessageSquare className='mr-2 h-5 w-5 transition-transform group-hover:rotate-12' />
              CHAT
            </Button>

            {/* Gaming Dispute Button */}
            {['funded', 'payment_sent'].includes(trade.status) && (
              <Button
                variant='ghost'
                size='lg'
                onClick={() => handleAction('dispute')}
                className='text-muted-foreground h-12 flex-1 border-2 border-transparent px-4 font-bold transition-all hover:scale-105 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500'
              >
                <AlertCircle className='mr-2 h-5 w-5' />
                <span className='text-sm font-bold uppercase'>Dispute</span>
              </Button>
            )}
          </div>
        </CardFooter>

        {/* Gaming Achievement Badge */}
        {trade.status === 'completed' && (
          <div className='absolute top-6 left-6 z-10'>
            <div className='relative'>
              <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-green-500 to-emerald-600 opacity-75 blur-lg' />
              <div className='relative flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-white shadow-xl'>
                <Trophy className='h-5 w-5' />
                <span className='text-sm font-black tracking-wider uppercase'>
                  Completed!
                </span>
              </div>
            </div>
          </div>
        )}
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

      {/* Lightbox for payment proof images */}
      {lightboxImages.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxImages}
        />
      )}
    </>
  )
}
