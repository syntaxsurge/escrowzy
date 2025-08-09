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
import { Switch } from '@/components/ui/switch'
import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import {
  updateListingSchema,
  type UpdateListingInput
} from '@/lib/schemas/listings'
import {
  handleFormError,
  handleFormSuccess,
  hasFormChanged
} from '@/lib/utils/form'
import type { P2PListing } from '@/types/listings'
import { PAYMENT_METHODS } from '@/types/listings'

interface UpdateListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: P2PListing
  onSuccess: () => void
}

export function UpdateListingDialog({
  open,
  onOpenChange,
  listing,
  onSuccess
}: UpdateListingDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parse existing payment methods
  const existingPaymentMethods = Array.isArray(listing.paymentMethods)
    ? listing.paymentMethods
    : typeof listing.paymentMethods === 'string'
      ? JSON.parse(listing.paymentMethods)
      : []

  const form = useForm<UpdateListingInput>({
    resolver: zodResolver(updateListingSchema),
    defaultValues: {
      amount: listing.amount ?? undefined,
      pricePerUnit: listing.pricePerUnit ?? undefined,
      minAmount: listing.minAmount ?? '',
      maxAmount: listing.maxAmount ?? '',
      paymentMethods: existingPaymentMethods,
      isActive: listing.isActive
    }
  })

  const onSubmit = async (data: UpdateListingInput) => {
    try {
      setIsSubmitting(true)

      // Validate min/max amounts
      if (data.minAmount && data.maxAmount) {
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

      // Check if form has actually changed
      const originalData = {
        amount: listing.amount ?? undefined,
        pricePerUnit: listing.pricePerUnit ?? undefined,
        minAmount: listing.minAmount || '',
        maxAmount: listing.maxAmount || '',
        paymentMethods: existingPaymentMethods,
        isActive: listing.isActive
      }

      if (!hasFormChanged(data, originalData)) {
        toast({
          title: 'No Changes',
          description: 'No changes were made to the listing'
        })
        return
      }

      // Only send changed fields
      const changes: any = {}
      if (data.amount !== (listing.amount ?? undefined))
        changes.amount = data.amount
      if (data.pricePerUnit !== (listing.pricePerUnit ?? undefined))
        changes.pricePerUnit = data.pricePerUnit
      if (data.minAmount !== (listing.minAmount || ''))
        changes.minAmount = data.minAmount || null
      if (data.maxAmount !== (listing.maxAmount || ''))
        changes.maxAmount = data.maxAmount || null
      if (
        JSON.stringify(data.paymentMethods) !==
        JSON.stringify(existingPaymentMethods)
      ) {
        changes.paymentMethods = data.paymentMethods
      }
      if (data.isActive !== listing.isActive) changes.isActive = data.isActive

      const response = await api.put(
        apiEndpoints.listings.byId(listing.id.toString()),
        changes
      )

      if (response.success) {
        handleFormSuccess(toast, 'Listing updated successfully')
        onSuccess()
      } else {
        throw new Error(response.error || 'Failed to update listing')
      }
    } catch (error) {
      handleFormError(error, toast, 'Failed to update listing')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <DialogTitle>Update Listing</DialogTitle>
          <DialogDescription>
            Modify your {listing.listingType} offer for {listing.tokenOffered}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Active Status */}
            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='border-primary/20 from-primary/5 to-primary/10 hover:border-primary/30 rounded-lg border-2 bg-gradient-to-r p-4 transition-all'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base font-semibold'>
                      Active Status
                    </FormLabel>
                    <FormDescription className='text-sm'>
                      When inactive, your listing won't appear in search results
                    </FormDescription>
                  </div>
                  <FormControl>
                    <div className='mt-3 flex items-center gap-2'>
                      <span
                        className={`text-sm font-medium ${field.value ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                      >
                        {field.value ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400 dark:data-[state=unchecked]:bg-gray-600'
                      />
                    </div>
                  </FormControl>
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
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantity of {listing.tokenOffered}
                    </FormDescription>
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
                        value={field.value || ''}
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
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>Maximum trade amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                              field.onChange(current.filter(v => v !== value))
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
                loadingText='Updating...'
              >
                Update Listing
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
