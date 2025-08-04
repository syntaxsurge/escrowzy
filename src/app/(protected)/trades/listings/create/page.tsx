'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  TrendingUp,
  DollarSign,
  Coins,
  Target,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { useForm } from 'react-hook-form'

import { GamifiedHeader } from '@/components/blocks/trading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { appRoutes } from '@/config/app-routes'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib'
import { api } from '@/lib/api/http-client'
import {
  createListingSchema,
  type CreateListingInput
} from '@/lib/schemas/p2p-listings'
import { handleFormError, handleFormSuccess } from '@/lib/utils/form'
import { SUPPORTED_TOKENS, PAYMENT_METHODS } from '@/types/p2p-listings'

export default function CreateListingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
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

  const onSubmit = async (data: CreateListingInput) => {
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

      const response = await api.post(apiEndpoints.listings.create, data)

      if (response.success) {
        handleFormSuccess(toast, 'Listing created successfully')
        router.push(appRoutes.trades.myListings)
      } else {
        throw new Error(response.error || 'Failed to create listing')
      }
    } catch (error) {
      handleFormError(error, toast, 'Failed to create listing')
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

  const [formProgress, setFormProgress] = useState(0)

  const watchedFields = form.watch()

  // Calculate form progress
  useEffect(() => {
    const values = form.getValues()
    let filled = 0
    const totalFields = 6 // listingType, tokenOffered, amount, pricePerUnit, paymentMethods, paymentWindow

    if (values.listingType) filled++
    if (values.tokenOffered) filled++
    if (values.amount) filled++
    if (values.pricePerUnit) filled++
    if (values.paymentMethods && values.paymentMethods.length > 0) filled++
    if (values.paymentWindow) filled++

    setFormProgress(Math.round((filled / totalFields) * 100))
  }, [watchedFields])

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Header */}
        <GamifiedHeader
          title='CREATE P2P LISTING'
          subtitle='Set up your buy or sell offer for the marketplace'
          icon={<Plus className='h-8 w-8 text-white' />}
          actions={
            <div className='flex items-center gap-2'>
              <div className='text-muted-foreground text-sm font-medium'>
                Progress
              </div>
              <div className='relative h-3 w-32 overflow-hidden rounded-full bg-black/20 dark:bg-white/10'>
                <div
                  className='from-primary h-full bg-gradient-to-r via-purple-600 to-pink-600 transition-all duration-500'
                  style={{ width: `${formProgress}%` }}
                >
                  <div className='animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent' />
                </div>
              </div>
              <span className='text-sm font-bold'>{formProgress}%</span>
            </div>
          }
        />

        {/* Gaming Tips Section */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card className='group relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 transition-all hover:scale-105'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='from-primary rounded-lg bg-gradient-to-br to-purple-600 p-2'>
                  <Target className='h-5 w-5 text-white' />
                </div>
                <div>
                  <p className='text-xs font-bold text-purple-600 uppercase dark:text-purple-400'>
                    Pro Tip
                  </p>
                  <p className='text-sm'>
                    Set competitive prices to attract more traders!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='group relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 transition-all hover:scale-105'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2'>
                  <Sparkles className='h-5 w-5 text-white' />
                </div>
                <div>
                  <p className='text-xs font-bold text-blue-600 uppercase dark:text-blue-400'>
                    Achievement
                  </p>
                  <p className='text-sm'>
                    Complete your first trade to unlock rewards!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='group relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 transition-all hover:scale-105'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-2'>
                  <TrendingUp className='h-5 w-5 text-white' />
                </div>
                <div>
                  <p className='text-xs font-bold text-green-600 uppercase dark:text-green-400'>
                    Quick Tip
                  </p>
                  <p className='text-sm'>
                    Multiple payment methods increase trades!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form Card with Gaming Effects */}
        <Card className='group border-primary/20 from-primary/5 relative overflow-hidden border-2 bg-gradient-to-br to-purple-600/5 shadow-2xl'>
          {/* Animated Background Pattern */}
          <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
          <div className='absolute top-0 left-0 h-full w-full'>
            <div className='bg-primary/10 absolute top-20 left-20 h-40 w-40 animate-pulse rounded-full blur-3xl' />
            <div className='absolute right-20 bottom-20 h-60 w-60 animate-pulse rounded-full bg-purple-600/10 blur-3xl delay-1000' />
          </div>

          <CardHeader className='relative z-10'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-black text-transparent'>
                  🎮 LISTING CONFIGURATION
                </CardTitle>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Fill in the details to create your epic P2P offer
                </p>
              </div>
              <div className='hidden md:block'>
                <div className='relative'>
                  <div className='from-primary absolute inset-0 animate-pulse rounded-xl bg-gradient-to-r to-purple-600 opacity-60 blur-lg' />
                  <div className='from-primary relative rounded-xl bg-gradient-to-br via-purple-600 to-pink-600 p-3'>
                    <Coins className='h-8 w-8 text-white' />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='relative z-10 space-y-6'
              >
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

                <div className='grid gap-6 md:grid-cols-2'>
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
                        <FormDescription>
                          Quantity to {listingType}
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
                        <FormDescription>
                          Price in USD per token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Gaming-Style Total Value Display */}
                {amount && pricePerUnit && (
                  <Card className='group relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 transition-all hover:scale-[1.02]'>
                    <div className='absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-amber-500/20 opacity-0 transition-opacity group-hover:opacity-100' />
                    <CardContent className='pt-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <DollarSign className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                          <span className='text-muted-foreground text-sm font-bold uppercase'>
                            Total Trade Value
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='relative'>
                            <div className='absolute inset-0 animate-pulse rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 opacity-75 blur-md' />
                            <span className='relative bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-3xl font-black text-transparent'>
                              ${totalValue}
                            </span>
                          </div>
                          <span className='text-sm font-bold text-yellow-600 dark:text-yellow-400'>
                            USD
                          </span>
                        </div>
                      </div>
                      <div className='mt-3 h-2 overflow-hidden rounded-full bg-black/20 dark:bg-white/10'>
                        <div
                          className='h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all'
                          style={{ width: '100%' }}
                        >
                          <div className='animate-shimmer h-full bg-gradient-to-r from-transparent via-white/30 to-transparent' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className='grid gap-6 md:grid-cols-2'>
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
                      <div className='mt-4 grid gap-4 md:grid-cols-2'>
                        {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                          <div
                            key={key}
                            className='flex items-center space-x-2 rounded-lg border p-3'
                          >
                            <Checkbox
                              id={key}
                              checked={field.value?.includes(value)}
                              onCheckedChange={checked => {
                                const current = field.value || []
                                if (checked) {
                                  field.onChange([...current, value])
                                } else {
                                  field.onChange(
                                    current.filter(v => v !== value)
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

                {/* Gaming-Style Submit Buttons */}
                <div className='border-primary/30 from-primary/10 relative rounded-xl border-2 bg-gradient-to-br to-purple-600/10 p-6'>
                  <div className='bg-primary text-primary-foreground absolute top-0 left-0 flex -translate-y-1/2 items-center gap-2 rounded-full px-4 py-1 text-xs font-black'>
                    <ChevronRight className='h-3 w-3' />
                    FINAL STEP
                  </div>
                  <div className='flex justify-between gap-4'>
                    <Button
                      type='button'
                      variant='outline'
                      size='lg'
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                      className='border-2 border-red-500/30 font-bold transition-all hover:scale-105 hover:border-red-500/50 hover:bg-red-500/10'
                    >
                      Cancel
                    </Button>
                    <LoadingButton
                      type='submit'
                      size='lg'
                      isLoading={isSubmitting}
                      loadingText='Launching...'
                      className={cn(
                        'group relative overflow-hidden border-0 px-8 font-black text-white shadow-2xl transition-all',
                        isSubmitting
                          ? 'bg-muted cursor-not-allowed opacity-70'
                          : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-green-500/50'
                      )}
                    >
                      {!isSubmitting && (
                        <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full' />
                      )}
                      {!isSubmitting && <Sparkles className='mr-2 h-5 w-5' />}
                      LAUNCH LISTING
                    </LoadingButton>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
