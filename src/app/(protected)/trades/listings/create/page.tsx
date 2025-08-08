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
  ChevronRight,
  Globe,
  Info
} from 'lucide-react'
import { useForm } from 'react-hook-form'

import { GamifiedHeader } from '@/components/blocks/trading'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { envPublic } from '@/config/env.public'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib'
import { api } from '@/lib/api/http-client'
import { createListingSchema } from '@/lib/schemas/listings'
import { handleFormError, handleFormSuccess } from '@/lib/utils/form'
import {
  SUPPORTED_TOKENS,
  PAYMENT_METHODS,
  DOMAIN_REGISTRARS
} from '@/types/listings'

export default function CreateListingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listingCategory, setListingCategory] = useState<'p2p' | 'domain'>(
    'p2p'
  )

  // P2P Form
  const p2pForm = useForm<any>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      listingCategory: 'p2p',
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

  // Domain Form
  const domainForm = useForm<any>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      listingCategory: 'domain',
      listingType: 'sell',
      domainName: '',
      registrar: '',
      price: '',
      domainAge: undefined,
      expiryDate: '',
      websiteUrl: '',
      monthlyTraffic: undefined,
      monthlyRevenue: '',
      description: '',
      paymentMethods: [],
      paymentWindow: 720 // 12 hours default for domain transfers
    }
  })

  const onSubmitP2P = async (data: any) => {
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

      const response = await api.post(apiEndpoints.listings.create, {
        ...data,
        listingCategory: 'p2p'
      })

      if (response.success) {
        handleFormSuccess(toast, 'P2P listing created successfully')
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

  const onSubmitDomain = async (data: any) => {
    try {
      setIsSubmitting(true)

      const response = await api.post(apiEndpoints.listings.create, {
        ...data,
        listingCategory: 'domain'
      })

      if (response.success) {
        handleFormSuccess(toast, 'Domain listing created successfully')
        router.push(appRoutes.trades.myListings)
      } else {
        throw new Error(response.error || 'Failed to create domain listing')
      }
    } catch (error) {
      handleFormError(error, toast, 'Failed to create domain listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const p2pAmount = p2pForm.watch('amount')
  const p2pPricePerUnit = p2pForm.watch('pricePerUnit')
  const p2pListingType = p2pForm.watch('listingType')

  // Calculate total value for P2P
  const p2pTotalValue =
    p2pAmount && p2pPricePerUnit
      ? (parseFloat(p2pAmount) * parseFloat(p2pPricePerUnit)).toFixed(2)
      : '0.00'

  const [formProgress, setFormProgress] = useState(0)

  // Calculate form progress based on category
  useEffect(() => {
    let filled = 0
    let totalFields = 0

    if (listingCategory === 'p2p') {
      const values = p2pForm.getValues()
      totalFields = 6
      if (values.listingType) filled++
      if (values.tokenOffered) filled++
      if (values.amount) filled++
      if (values.pricePerUnit) filled++
      if (values.paymentMethods && values.paymentMethods.length > 0) filled++
      if (values.paymentWindow) filled++
    } else {
      const values = domainForm.getValues()
      totalFields = 5
      if (values.domainName) filled++
      if (values.registrar) filled++
      if (values.price) filled++
      if (values.paymentMethods && values.paymentMethods.length > 0) filled++
      if (values.description) filled++
    }

    setFormProgress(Math.round((filled / totalFields) * 100))
  }, [p2pForm.watch(), domainForm.watch(), listingCategory])

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Header */}
        <GamifiedHeader
          title='CREATE LISTING'
          subtitle='Choose between P2P crypto trading or domain/website escrow'
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

        {/* Category Selection */}
        <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
          <CardHeader>
            <CardTitle>Choose Listing Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={listingCategory}
              onValueChange={(value: any) => setListingCategory(value)}
              className='grid gap-4 md:grid-cols-2'
            >
              <div>
                <RadioGroupItem value='p2p' id='p2p' className='peer sr-only' />
                <Label
                  htmlFor='p2p'
                  className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4'
                >
                  <Coins className='mb-3 h-8 w-8' />
                  <div className='text-center'>
                    <p className='font-bold'>P2P Trading</p>
                    <p className='text-muted-foreground text-sm'>
                      Buy or sell cryptocurrency
                    </p>
                  </div>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value='domain'
                  id='domain'
                  className='peer sr-only'
                />
                <Label
                  htmlFor='domain'
                  className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4'
                >
                  <Globe className='mb-3 h-8 w-8' />
                  <div className='text-center'>
                    <p className='font-bold'>Domain/Website</p>
                    <p className='text-muted-foreground text-sm'>
                      Sell domains or websites
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Domain Transfer Notice */}
        {listingCategory === 'domain' && (
          <Alert className='border-amber-500/50 bg-amber-50/10'>
            <Info className='h-4 w-4' />
            <AlertTitle>Manual Transfer Process</AlertTitle>
            <AlertDescription>
              Domain transfers are currently handled manually through our escrow
              team. After a buyer accepts your listing, you'll receive
              instructions to transfer the domain to our admin email:{' '}
              <strong>{envPublic.NEXT_PUBLIC_DOMAIN_ESCROW_EMAIL}</strong>. We'll then transfer it to
              the buyer upon payment confirmation.
              <br />
              <br />
              <strong>Coming Soon:</strong> Automated transfers with GoDaddy,
              Namecheap, and other major registrars.
            </AlertDescription>
          </Alert>
        )}

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
                    {listingCategory === 'p2p'
                      ? 'Set competitive prices to attract more traders!'
                      : 'Include traffic stats to increase buyer interest!'}
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

        {/* Main Form Card */}
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
                  🎮{' '}
                  {listingCategory === 'p2p' ? 'P2P LISTING' : 'DOMAIN LISTING'}{' '}
                  CONFIGURATION
                </CardTitle>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Fill in the details to create your{' '}
                  {listingCategory === 'p2p' ? 'P2P' : 'domain'} offer
                </p>
              </div>
              <div className='hidden md:block'>
                <div className='relative'>
                  <div className='from-primary absolute inset-0 animate-pulse rounded-xl bg-gradient-to-r to-purple-600 opacity-60 blur-lg' />
                  <div className='from-primary relative rounded-xl bg-gradient-to-br via-purple-600 to-pink-600 p-3'>
                    {listingCategory === 'p2p' ? (
                      <Coins className='h-8 w-8 text-white' />
                    ) : (
                      <Globe className='h-8 w-8 text-white' />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className='relative z-10'>
            {listingCategory === 'p2p' ? (
              // P2P Trading Form
              <Form {...p2pForm}>
                <form
                  onSubmit={p2pForm.handleSubmit(onSubmitP2P)}
                  className='relative z-10 space-y-6'
                >
                  {/* Listing Type */}
                  <FormField
                    control={p2pForm.control}
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
                          {p2pListingType === 'sell'
                            ? 'You will receive payment and release crypto'
                            : 'You will send payment and receive crypto'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Token Selection */}
                  <FormField
                    control={p2pForm.control}
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
                          The cryptocurrency you want to {p2pListingType}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid gap-6 md:grid-cols-2'>
                    {/* Amount */}
                    <FormField
                      control={p2pForm.control}
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
                            Quantity to {p2pListingType}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price Per Unit */}
                    <FormField
                      control={p2pForm.control}
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

                  {/* Total Value Display */}
                  {p2pAmount && p2pPricePerUnit && (
                    <Card className='group relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 transition-all hover:scale-[1.02]'>
                      <CardContent className='pt-6'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <DollarSign className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                            <span className='text-muted-foreground text-sm font-bold uppercase'>
                              Total Trade Value
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='relative bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-3xl font-black text-transparent'>
                              ${p2pTotalValue}
                            </span>
                            <span className='text-sm font-bold text-yellow-600 dark:text-yellow-400'>
                              USD
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className='grid gap-6 md:grid-cols-2'>
                    {/* Min Amount */}
                    <FormField
                      control={p2pForm.control}
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
                          <FormDescription>
                            Minimum trade amount
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Max Amount */}
                    <FormField
                      control={p2pForm.control}
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
                          <FormDescription>
                            Maximum trade amount
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Payment Window */}
                  <FormField
                    control={p2pForm.control}
                    name='paymentWindow'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Window</FormLabel>
                        <Select
                          onValueChange={value =>
                            field.onChange(parseInt(value))
                          }
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
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Time limit for completing the trade
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Methods */}
                  <FormField
                    control={p2pForm.control}
                    name='paymentMethods'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accepted Payment Methods</FormLabel>
                        <FormDescription>
                          Select the payment methods you accept
                        </FormDescription>
                        <div className='mt-4 grid gap-4 md:grid-cols-2'>
                          {Object.entries(PAYMENT_METHODS).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className='flex items-center space-x-2 rounded-lg border p-3'
                              >
                                <Checkbox
                                  id={key}
                                  checked={field.value?.includes(value)}
                                  onCheckedChange={(
                                    checked: boolean | 'indeterminate'
                                  ) => {
                                    const current = field.value || []
                                    if (checked === true) {
                                      field.onChange([...current, value])
                                    } else if (checked === false) {
                                      field.onChange(
                                        current.filter(
                                          (v: string) => v !== value
                                        )
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
                            )
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Buttons */}
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
                        LAUNCH P2P LISTING
                      </LoadingButton>
                    </div>
                  </div>
                </form>
              </Form>
            ) : (
              // Domain Form
              <Form {...domainForm}>
                <form
                  onSubmit={domainForm.handleSubmit(onSubmitDomain)}
                  className='relative z-10 space-y-6'
                >
                  {/* Domain Name */}
                  <FormField
                    control={domainForm.control}
                    name='domainName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder='example.com'
                            className='font-mono'
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the full domain name including extension
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid gap-6 md:grid-cols-2'>
                    {/* Registrar */}
                    <FormField
                      control={domainForm.control}
                      name='registrar'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Registrar</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select registrar' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(DOMAIN_REGISTRARS).map(
                                ([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Where the domain is currently registered
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price */}
                    <FormField
                      control={domainForm.control}
                      name='price'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asking Price (USD)</FormLabel>
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
                            Your asking price in USD
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid gap-6 md:grid-cols-2'>
                    {/* Domain Age */}
                    <FormField
                      control={domainForm.control}
                      name='domainAge'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain Age (Years)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder='0'
                              type='number'
                              min='0'
                              onChange={e =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            How old is the domain
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Expiry Date */}
                    <FormField
                      control={domainForm.control}
                      name='expiryDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='date'
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormDescription>
                            When the domain expires
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Optional Fields */}
                  <div className='space-y-4'>
                    <h3 className='text-sm font-medium'>
                      Optional Information
                    </h3>

                    {/* Website URL */}
                    <FormField
                      control={domainForm.control}
                      name='websiteUrl'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder='https://example.com'
                            />
                          </FormControl>
                          <FormDescription>
                            If selling a website, provide the URL
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='grid gap-6 md:grid-cols-2'>
                      {/* Monthly Traffic */}
                      <FormField
                        control={domainForm.control}
                        name='monthlyTraffic'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Traffic</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder='0'
                                type='number'
                                min='0'
                                onChange={e =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Average monthly visitors
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Monthly Revenue */}
                      <FormField
                        control={domainForm.control}
                        name='monthlyRevenue'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Revenue (USD)</FormLabel>
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
                              Average monthly revenue
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <FormField
                    control={domainForm.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder='Describe your domain/website, its history, potential, etc.'
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide details about the domain or website
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Methods */}
                  <FormField
                    control={domainForm.control}
                    name='paymentMethods'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accepted Payment Methods</FormLabel>
                        <FormDescription>
                          Select the payment methods you accept
                        </FormDescription>
                        <div className='mt-4 grid gap-4 md:grid-cols-2'>
                          {Object.entries(PAYMENT_METHODS).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className='flex items-center space-x-2 rounded-lg border p-3'
                              >
                                <Checkbox
                                  id={`domain-${key}`}
                                  checked={field.value?.includes(value)}
                                  onCheckedChange={(
                                    checked: boolean | 'indeterminate'
                                  ) => {
                                    const current = field.value || []
                                    if (checked === true) {
                                      field.onChange([...current, value])
                                    } else if (checked === false) {
                                      field.onChange(
                                        current.filter(
                                          (v: string) => v !== value
                                        )
                                      )
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`domain-${key}`}
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
                            )
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Buttons */}
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
                        LAUNCH DOMAIN LISTING
                      </LoadingButton>
                    </div>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
