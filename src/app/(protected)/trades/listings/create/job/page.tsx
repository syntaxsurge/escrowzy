'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Briefcase,
  Clock,
  DollarSign,
  RefreshCw,
  Sparkles,
  Tag,
  Users,
  Zap
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import { z } from 'zod'

import { GamifiedHeader } from '@/components/blocks/trading'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
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
import { LoadingButton } from '@/components/ui/loading-button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import { swrFetcher } from '@/lib/api/swr'

// Form schema for job/service creation
const jobServiceSchema = z.object({
  postingType: z.enum(['job', 'service']),
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  categoryId: z.number().min(1, 'Please select a category'),

  // Job fields
  budgetType: z.enum(['fixed', 'hourly']).optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  deadline: z.string().optional(),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),

  // Service fields
  servicePrice: z.string().optional(),
  pricePerUnit: z.string().optional(),
  deliveryTime: z.number().min(1).optional(),
  revisions: z.number().min(0).optional(),

  // Common fields
  skillsRequired: z.array(z.string()).min(1, 'Add at least one skill'),
  currency: z.string().default('USD'),
  paymentMethods: z.array(z.string()).optional()
})

type JobServiceFormData = z.infer<typeof jobServiceSchema>

export default function CreateJobServicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postingType, setPostingType] = useState<'job' | 'service'>('job')

  // Fetch categories
  const { data: categoriesData } = useSWR(
    apiEndpoints.jobs.categories,
    swrFetcher
  )

  const form = useForm<JobServiceFormData>({
    resolver: zodResolver(jobServiceSchema),
    defaultValues: {
      postingType: 'job',
      title: '',
      description: '',
      categoryId: 0,
      budgetType: 'fixed',
      budgetMin: '',
      budgetMax: '',
      deadline: '',
      experienceLevel: 'intermediate',
      servicePrice: '',
      pricePerUnit: '',
      deliveryTime: 7,
      revisions: 2,
      skillsRequired: [],
      currency: 'USD',
      paymentMethods: ['bank_transfer', 'paypal']
    }
  })

  const handlePostingTypeChange = (type: 'job' | 'service') => {
    setPostingType(type)
    form.setValue('postingType', type)
  }

  const handleSubmit = async (data: JobServiceFormData) => {
    setIsSubmitting(true)

    try {
      // Prepare the data based on posting type
      const submitData: any = {
        postingType: data.postingType,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        skillsRequired: data.skillsRequired,
        currency: data.currency
      }

      if (data.postingType === 'job') {
        // Add job-specific fields
        submitData.budgetType = data.budgetType
        submitData.budgetMin = data.budgetMin
        submitData.budgetMax = data.budgetMax
        submitData.deadline = data.deadline
        submitData.experienceLevel = data.experienceLevel
      } else {
        // Add service-specific fields
        submitData.servicePrice = data.servicePrice
        submitData.pricePerUnit = data.pricePerUnit
        submitData.deliveryTime = data.deliveryTime
        submitData.revisions = data.revisions
        submitData.paymentMethods = data.paymentMethods
      }

      const response = await api.post(apiEndpoints.jobs.list, submitData)

      if (response.success && response.data) {
        // Invalidate relevant caches
        await mutate(apiEndpoints.jobs.list)

        toast({
          title: 'Success!',
          description: `Your ${data.postingType} has been created successfully.`
        })

        // Redirect to the created job/service
        router.push(appRoutes.trades.jobs.detail(response.data.id))
      } else {
        throw new Error(response.error || 'Failed to create listing')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create listing',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSkill = (skill: string) => {
    if (skill && !form.getValues('skillsRequired').includes(skill)) {
      form.setValue('skillsRequired', [
        ...form.getValues('skillsRequired'),
        skill
      ])
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    form.setValue(
      'skillsRequired',
      form.getValues('skillsRequired').filter(skill => skill !== skillToRemove)
    )
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-6 p-4'>
      {/* Header */}
      <GamifiedHeader
        title='CREATE JOB OR SERVICE'
        subtitle='Post a job opportunity or offer your professional services'
        icon={<Briefcase className='h-8 w-8 text-white' />}
        actions={
          <Button
            variant='ghost'
            onClick={() => router.push(appRoutes.trades.listings.create)}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Listings
          </Button>
        }
      />

      {/* Posting Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>What would you like to create?</CardTitle>
          <CardDescription>
            Choose whether you want to post a job opportunity or offer a service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={postingType}
            onValueChange={v => handlePostingTypeChange(v as 'job' | 'service')}
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='job' className='flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Post a Job
              </TabsTrigger>
              <TabsTrigger value='service' className='flex items-center gap-2'>
                <Sparkles className='h-4 w-4' />
                Offer a Service
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className='mt-6 space-y-6'
              >
                {/* Common Fields */}
                <div className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {postingType === 'job'
                            ? 'Job Title'
                            : 'Service Title'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              postingType === 'job'
                                ? 'e.g., Full Stack Developer for E-commerce Platform'
                                : 'e.g., Professional Logo Design Service'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              postingType === 'job'
                                ? "Describe the job requirements, responsibilities, and what you're looking for..."
                                : "Describe your service, what's included, and what clients can expect..."
                            }
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information (minimum 50 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='categoryId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={value =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a category' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesData?.categories?.map((cat: any) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}
                              >
                                <span className='flex items-center gap-2'>
                                  {cat.icon && <span>{cat.icon}</span>}
                                  {cat.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Skills Required */}
                  <FormField
                    control={form.control}
                    name='skillsRequired'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Skills</FormLabel>
                        <FormControl>
                          <div className='space-y-2'>
                            <div className='flex gap-2'>
                              <Input
                                placeholder='Add a skill (e.g., React, Node.js)'
                                onKeyPress={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const input = e.currentTarget
                                    handleAddSkill(input.value)
                                    input.value = ''
                                  }
                                }}
                              />
                              <Button
                                type='button'
                                variant='outline'
                                onClick={() => {
                                  const input = document.querySelector(
                                    'input[placeholder*="Add a skill"]'
                                  ) as HTMLInputElement
                                  if (input) {
                                    handleAddSkill(input.value)
                                    input.value = ''
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {field.value?.map(skill => (
                                <div
                                  key={skill}
                                  className='bg-secondary flex items-center gap-1 rounded-full px-3 py-1 text-sm'
                                >
                                  <Tag className='h-3 w-3' />
                                  {skill}
                                  <button
                                    type='button'
                                    onClick={() => handleRemoveSkill(skill)}
                                    className='text-muted-foreground hover:text-foreground ml-1'
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Add relevant skills for this {postingType}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Job-specific Fields */}
                <TabsContent value='job' className='mt-0 space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='budgetType'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className='flex gap-4'
                              >
                                <div className='flex items-center space-x-2'>
                                  <RadioGroupItem value='fixed' />
                                  <label htmlFor='fixed'>Fixed Price</label>
                                </div>
                                <div className='flex items-center space-x-2'>
                                  <RadioGroupItem value='hourly' />
                                  <label htmlFor='hourly'>Hourly Rate</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid gap-4 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name='budgetMin'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch('budgetType') === 'hourly'
                                  ? 'Min Rate ($/hr)'
                                  : 'Min Budget ($)'}
                              </FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                  <Input
                                    type='number'
                                    placeholder='0'
                                    className='pl-9'
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='budgetMax'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch('budgetType') === 'hourly'
                                  ? 'Max Rate ($/hr)'
                                  : 'Max Budget ($)'}
                              </FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                  <Input
                                    type='number'
                                    placeholder='0'
                                    className='pl-9'
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name='experienceLevel'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select experience level' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='entry'>
                                  Entry Level
                                </SelectItem>
                                <SelectItem value='intermediate'>
                                  Intermediate
                                </SelectItem>
                                <SelectItem value='expert'>Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='deadline'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline (Optional)</FormLabel>
                            <FormControl>
                              <Input type='date' {...field} />
                            </FormControl>
                            <FormDescription>
                              When do you need this job completed?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Service-specific Fields */}
                <TabsContent value='service' className='mt-0 space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>
                        Service Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid gap-4 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name='servicePrice'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Price</FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                  <Input
                                    type='number'
                                    placeholder='0'
                                    className='pl-9'
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Starting price for your service
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='pricePerUnit'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price Per Unit (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g., per page, per hour'
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Unit of measurement for pricing
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='grid gap-4 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name='deliveryTime'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Time (Days)</FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <Clock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                  <Input
                                    type='number'
                                    min='1'
                                    placeholder='7'
                                    className='pl-9'
                                    {...field}
                                    onChange={e =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                How many days to deliver?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='revisions'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Revisions</FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <RefreshCw className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                  <Input
                                    type='number'
                                    min='0'
                                    placeholder='2'
                                    className='pl-9'
                                    {...field}
                                    onChange={e =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                How many revisions included?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name='paymentMethods'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accepted Payment Methods</FormLabel>
                            <FormControl>
                              <div className='space-y-2'>
                                {[
                                  'bank_transfer',
                                  'paypal',
                                  'crypto',
                                  'credit_card'
                                ].map(method => (
                                  <div
                                    key={method}
                                    className='flex items-center space-x-2'
                                  >
                                    <Checkbox
                                      checked={field.value?.includes(method)}
                                      onCheckedChange={checked => {
                                        if (checked) {
                                          field.onChange([
                                            ...(field.value || []),
                                            method
                                          ])
                                        } else {
                                          field.onChange(
                                            field.value?.filter(
                                              m => m !== method
                                            )
                                          )
                                        }
                                      }}
                                    />
                                    <label className='text-sm capitalize'>
                                      {method.replace('_', ' ')}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Submit Button */}
                <div className='flex justify-end gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      router.push(appRoutes.trades.listings.create)
                    }
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    type='submit'
                    isLoading={isSubmitting}
                    className='bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
                  >
                    <Zap className='mr-2 h-4 w-4' />
                    Create {postingType === 'job' ? 'Job' : 'Service'}
                  </LoadingButton>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
