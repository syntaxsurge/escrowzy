'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import {
  createP2PListingSchema,
  type CreateP2PListingInput
} from '@/lib/schemas/listings'
import { handleFormError, handleFormSuccess } from '@/lib/utils/form'
import {
  SUPPORTED_TOKENS,
  PAYMENT_METHODS,
  TradeCategory
} from '@/types/listings'

interface CreateListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateListingDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateListingDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateP2PListingInput>({
    resolver: zodResolver(createP2PListingSchema),
    defaultValues: {
      listingCategory: TradeCategory.P2P,
      listingType: 'sell',
      tokenOffered: 'XTZ',
      amount: '',
      pricePerUnit: '',
      minAmount: '',
      maxAmount: '',
      paymentMethods: [],
      paymentWindow: 15
    }
  })

  const onSubmit = async (data: CreateP2PListingInput) => {
    try {
      setIsSubmitting(true)

      // Validate min/max amounts (only for P2P listings)
      if (
        data.listingCategory === TradeCategory.P2P &&
        data.minAmount &&
        data.maxAmount
      ) {
        const min = parseFloat(data.minAmount)
        const max = parseFloat(data.maxAmount)
        if (min > max) {
          handleFormError(
            new Error('Minimum amount cannot be greater than maximum amount'),
            toast,
            'Validation Error'
          )
          return
        }
      }

      const response = await api.post(apiEndpoints.listings.create, data)

      if (response.success) {
        handleFormSuccess(toast, 'Listing created successfully')
        form.reset()
        onSuccess()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const listingType = form.watch('listingType')
  const amount = form.watch('amount')
  const pricePerUnit = form.watch('pricePerUnit')

  // Calculate total value
  const totalValue =
    amount && pricePerUnit
      ? (parseFloat(amount) * parseFloat(pricePerUnit)).toFixed(2)
      : '0.00'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Listing</DialogTitle>
          <DialogDescription>
            Create a buy or sell offer for trading
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Listing Type */}
            <FormField
              control={form.control}
              name='listingType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I want to</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select listing type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='sell'>Sell Crypto</SelectItem>
                      <SelectItem value='buy'>Buy Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {listingType === 'sell'
                      ? 'You will receive payment and release crypto'
                      : 'You will send payment and receive crypto'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Token Selection */}
            <FormField
              control={form.control}
              name='tokenOffered'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cryptocurrency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select token' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(SUPPORTED_TOKENS).map(token => (
                        <SelectItem key={token} value={token}>
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The cryptocurrency you want to {listingType}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              {/* Amount */}
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='0.00'
                        type='number'
                        step='0.000001'
                        min='0'
                      />
                    </FormControl>
                    <FormDescription>Quantity to {listingType}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price Per Unit */}
              <FormField
                control={form.control}
                name='pricePerUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per unit (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='0.00'
                        type='number'
                        step='0.01'
                        min='0'
                      />
                    </FormControl>
                    <FormDescription>Price in USD per token</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Value Display */}
            {amount && pricePerUnit && (
              <div className='bg-muted rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Total Value
                  </span>
                  <span className='text-lg font-semibold'>
                    ${totalValue} USD
                  </span>
                </div>
              </div>
            )}

            <div className='grid grid-cols-2 gap-4'>
              {/* Min Amount */}
              <FormField
                control={form.control}
                name='minAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='0.00'
                        type='number'
                        step='0.000001'
                        min='0'
                      />
                    </FormControl>
                    <FormDescription>Minimum trade amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Amount */}
              <FormField
                control={form.control}
                name='maxAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='0.00'
                        type='number'
                        step='0.000001'
                        min='0'
                      />
                    </FormControl>
                    <FormDescription>Maximum trade amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Window */}
            <FormField
              control={form.control}
              name='paymentWindow'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Window for Seller</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select payment window' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='15'>15 minutes</SelectItem>
                      <SelectItem value='30'>30 minutes</SelectItem>
                      <SelectItem value='60'>1 hour</SelectItem>
                      <SelectItem value='120'>2 hours</SelectItem>
                      <SelectItem value='240'>4 hours</SelectItem>
                      <SelectItem value='480'>8 hours</SelectItem>
                      <SelectItem value='720'>12 hours</SelectItem>
                      <SelectItem value='1440'>24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Time limit for the seller to deposit crypto after trade
                    acceptance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Methods */}
            <FormField
              control={form.control}
              name='paymentMethods'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accepted Payment Methods</FormLabel>
                  <FormDescription>
                    Select the payment methods you accept
                  </FormDescription>
                  <div className='mt-2 grid grid-cols-2 gap-4'>
                    {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                      <div key={key} className='flex items-center space-x-2'>
                        <Checkbox
                          id={key}
                          checked={field.value?.includes(value)}
                          onCheckedChange={checked => {
                            const current = field.value || []
                            if (checked) {
                              field.onChange([...current, value])
                            } else {
                              field.onChange(
                                current.filter((v: string) => v !== value)
                              )
                            }
                          }}
                        />
                        <Label
                          htmlFor={key}
                          className='cursor-pointer text-sm font-normal'
                        >
                          {key
                            .split('_')
                            .map(
                              word =>
                                word.charAt(0).toUpperCase() +
                                word.slice(1).toLowerCase()
                            )
                            .join(' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className='flex justify-end space-x-2 pt-4'>
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
                loadingText='Creating...'
              >
                Create Listing
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
