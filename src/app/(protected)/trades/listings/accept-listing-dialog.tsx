'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Shield, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { navigationProgress } from '@/components/providers/navigation-progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Separator } from '@/components/ui/separator'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useBlockchain } from '@/context'
import { useSession } from '@/hooks/use-session'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import { positiveNumberString } from '@/lib/schemas/common'
import {
  handleFormError,
  handleFormSuccess,
  validateAmountBounds,
  parseNumericInput
} from '@/lib/utils/form'
import { getUserDisplayName } from '@/lib/utils/user'
import type { P2PListingWithUser } from '@/types/p2p-listings'
import { PAYMENT_METHODS } from '@/types/p2p-listings'

interface AcceptListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: P2PListingWithUser
  onSuccess: () => void
}

const acceptListingSchema = z.object({
  tradeAmount: positiveNumberString,
  paymentMethod: z.string().min(1, 'Payment method is required')
})

type AcceptListingInput = z.infer<typeof acceptListingSchema>

export function AcceptListingDialog({
  open,
  onOpenChange,
  listing,
  onSuccess
}: AcceptListingDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { chainId } = useBlockchain()
  const { user } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'details' | 'confirm'>('details')

  const form = useForm<AcceptListingInput>({
    resolver: zodResolver(acceptListingSchema),
    defaultValues: {
      tradeAmount: '',
      paymentMethod: ''
    }
  })

  const tradeAmount = form.watch('tradeAmount')
  const selectedPaymentMethod = form.watch('paymentMethod')

  // Calculate total cost
  const totalCost = tradeAmount
    ? (parseFloat(tradeAmount) * parseFloat(listing.pricePerUnit)).toFixed(2)
    : '0.00'

  // Parse payment methods
  const paymentMethods = Array.isArray(listing.paymentMethods)
    ? listing.paymentMethods
    : typeof listing.paymentMethods === 'string'
      ? JSON.parse(listing.paymentMethods)
      : []

  const validateAmount = () => {
    const amount = parseNumericInput(tradeAmount)
    if (!amount) return 'Please enter a valid amount'

    // Check min/max bounds
    const boundsError = validateAmountBounds(
      amount,
      listing.minAmount,
      listing.maxAmount,
      listing.tokenOffered
    )
    if (boundsError) return boundsError

    // Check available amount
    if (amount > parseFloat(listing.amount)) {
      return `Cannot exceed available amount of ${listing.amount} ${listing.tokenOffered}`
    }

    return null
  }

  const handleContinue = () => {
    const error = validateAmount()
    if (error) {
      form.setError('tradeAmount', {
        type: 'manual',
        message: error
      })
      return
    }

    if (!selectedPaymentMethod) {
      form.setError('paymentMethod', {
        type: 'manual',
        message: 'Please select a payment method'
      })
      return
    }

    setStep('confirm')
  }

  const onSubmit = async (data: AcceptListingInput) => {
    try {
      setIsSubmitting(true)

      // Check if user is logged in
      if (!user?.id) {
        throw new Error('You must be logged in to accept a listing')
      }

      // Use default chainId if not connected to wallet
      const currentChainId = chainId || 1 // Default to mainnet if not connected

      const response = await api.post(
        apiEndpoints.listings.accept(listing.id.toString()),
        {
          amount: data.tradeAmount, // Map tradeAmount to amount
          paymentMethod: data.paymentMethod,
          chainId: currentChainId
        }
      )

      if (response.success) {
        handleFormSuccess(
          toast,
          'Trade created successfully. Seller has 15 minutes to deposit crypto.'
        )
        form.reset()
        onSuccess()
        // Navigate to active trades with progress indicator
        navigationProgress.start()
        router.push(appRoutes.trades.active)
      } else {
        throw new Error(response.error || 'Failed to accept listing')
      }
    } catch (error) {
      handleFormError(error, toast, 'Failed to accept listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDialog = () => {
    setStep('details')
    form.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        onOpenChange(open)
        if (!open) resetDialog()
      }}
    >
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {step === 'details' ? 'Accept Listing' : 'Confirm Trade'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details'
              ? `You are about to ${listing.listingType === 'sell' ? 'buy' : 'sell'} ${listing.tokenOffered} from ${getUserDisplayName(listing.user)}`
              : 'Review your trade details before confirming'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {step === 'details' ? (
              <>
                {/* Listing Summary */}
                <Card className='bg-muted p-4'>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Seller
                      </span>
                      <span className='font-medium'>
                        {getUserDisplayName(listing.user)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Available
                      </span>
                      <span className='font-medium'>
                        {listing.amount} {listing.tokenOffered}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Price per unit
                      </span>
                      <span className='font-medium'>
                        ${listing.pricePerUnit}
                      </span>
                    </div>
                    {(listing.minAmount || listing.maxAmount) && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground text-sm'>
                          Trade limits
                        </span>
                        <span className='font-medium'>
                          {listing.minAmount || '0'} -{' '}
                          {listing.maxAmount || '∞'} {listing.tokenOffered}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Trade Amount */}
                <FormField
                  control={form.control}
                  name='tradeAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount to{' '}
                        {listing.listingType === 'sell' ? 'buy' : 'sell'}
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            {...field}
                            placeholder='0.00'
                            type='number'
                            step='0.000001'
                            min={listing.minAmount || '0'}
                            max={listing.maxAmount || listing.amount}
                            className='pr-16'
                            onChange={e => {
                              field.onChange(e)

                              // Real-time validation
                              const value = e.target.value
                              if (value) {
                                const amount = parseFloat(value)
                                if (!isNaN(amount) && amount > 0) {
                                  const minAmount = parseFloat(
                                    listing.minAmount || '0'
                                  )
                                  const maxAmount = Math.min(
                                    parseFloat(
                                      listing.maxAmount || listing.amount
                                    ),
                                    parseFloat(listing.amount)
                                  )

                                  if (amount < minAmount) {
                                    form.setError('tradeAmount', {
                                      type: 'manual',
                                      message: `Minimum amount is ${minAmount} ${listing.tokenOffered}`
                                    })
                                  } else if (amount > maxAmount) {
                                    form.setError('tradeAmount', {
                                      type: 'manual',
                                      message: `Maximum amount is ${maxAmount} ${listing.tokenOffered}`
                                    })
                                  } else {
                                    form.clearErrors('tradeAmount')
                                  }
                                }
                              } else {
                                form.clearErrors('tradeAmount')
                              }
                            }}
                          />
                          <span className='text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm'>
                            {listing.tokenOffered}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the amount of {listing.tokenOffered} you want to
                        trade
                      </FormDescription>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        Min: {listing.minAmount || '0'} {listing.tokenOffered} •
                        Max:{' '}
                        {Math.min(
                          parseFloat(listing.maxAmount || listing.amount),
                          parseFloat(listing.amount)
                        )}{' '}
                        {listing.tokenOffered}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name='paymentMethod'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <option value=''>Select payment method</option>
                          {paymentMethods.map((method: string) => {
                            // Find the key for this payment method value
                            const methodKey = Object.keys(PAYMENT_METHODS).find(
                              key =>
                                PAYMENT_METHODS[
                                  key as keyof typeof PAYMENT_METHODS
                                ] === method
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
                              <option key={method} value={method}>
                                {displayName}
                              </option>
                            )
                          })}
                        </select>
                      </FormControl>
                      <FormDescription>
                        Choose your preferred payment method
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total Cost Display */}
                {tradeAmount && (
                  <Card className='bg-primary/5 border-primary/20 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Total Cost</span>
                      <span className='text-xl font-bold'>
                        ${totalCost} USD
                      </span>
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className='flex justify-end space-x-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    onClick={handleContinue}
                    disabled={!tradeAmount || !selectedPaymentMethod}
                  >
                    Continue
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Confirmation Step */}
                <Alert>
                  <Shield className='h-4 w-4' />
                  <AlertDescription>
                    {listing.listingType === 'sell'
                      ? 'After accepting, the seller will have 15 minutes to deposit crypto to escrow. Then you will send the fiat payment.'
                      : 'After accepting, you will have 15 minutes to deposit crypto to escrow. Then the buyer will send the fiat payment.'}
                  </AlertDescription>
                </Alert>

                {/* Trade Summary */}
                <Card className='p-4'>
                  <h3 className='mb-3 font-semibold'>Trade Summary</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Type
                      </span>
                      <Badge
                        variant={
                          listing.listingType === 'sell'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {listing.listingType === 'sell' ? 'Buying' : 'Selling'}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Amount
                      </span>
                      <span className='font-medium'>
                        {tradeAmount} {listing.tokenOffered}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Price per unit
                      </span>
                      <span className='font-medium'>
                        ${listing.pricePerUnit}
                      </span>
                    </div>
                    <Separator className='my-2' />
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Total Cost
                      </span>
                      <span className='text-lg font-bold'>
                        ${totalCost} USD
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Payment Method
                      </span>
                      <Badge variant='outline'>
                        {(() => {
                          const methodKey = Object.keys(PAYMENT_METHODS).find(
                            key =>
                              PAYMENT_METHODS[
                                key as keyof typeof PAYMENT_METHODS
                              ] === selectedPaymentMethod
                          )
                          return methodKey
                            ? methodKey
                                .split('_')
                                .map(
                                  word =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
                                .join(' ')
                            : selectedPaymentMethod
                        })()}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Warning */}
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Please ensure you have sufficient funds before confirming.
                    Cancelling trades may affect your reputation score.
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className='flex justify-between'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setStep('details')}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <div className='space-x-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <LoadingButton
                      type='submit'
                      isLoading={isSubmitting}
                      loadingText='Confirming...'
                    >
                      Confirm Trade
                    </LoadingButton>
                  </div>
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
