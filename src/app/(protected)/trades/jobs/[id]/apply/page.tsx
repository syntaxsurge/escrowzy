'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Info,
  Plus,
  Trash2,
  Upload
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import useSWR from 'swr'
import * as z from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

// Form validation schema
const applyFormSchema = z.object({
  bidAmount: z.string().min(1, 'Bid amount is required'),
  deliveryTimeDays: z.number().min(1, 'Delivery time must be at least 1 day'),
  proposalText: z.string().min(100, 'Proposal must be at least 100 characters'),
  coverLetter: z.string().optional(),
  milestoneBreakdown: z
    .array(
      z.object({
        title: z.string().min(1, 'Milestone title is required'),
        description: z.string().min(1, 'Milestone description is required'),
        amount: z.string().min(1, 'Amount is required'),
        durationDays: z.number().min(1, 'Duration must be at least 1 day')
      })
    )
    .optional()
})

type ApplyFormValues = z.infer<typeof applyFormSchema>

export default function JobApplyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSession()
  const jobId = params.id as string

  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMilestones, setShowMilestones] = useState(false)

  // Fetch job details
  const { data: job, isLoading } = useSWR<JobPostingWithRelations>(
    apiEndpoints.jobs.byId(jobId),
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).job : null
    }
  )

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    defaultValues: {
      bidAmount: '',
      deliveryTimeDays: 7,
      proposalText: '',
      coverLetter: '',
      milestoneBreakdown: []
    }
  })

  const onSubmit = async (values: ApplyFormValues) => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('freelancerId', user.id.toString())
      formData.append('bidAmount', values.bidAmount)
      formData.append('deliveryTimeDays', values.deliveryTimeDays.toString())
      formData.append('proposalText', values.proposalText)
      if (values.coverLetter) {
        formData.append('coverLetter', values.coverLetter)
      }
      if (values.milestoneBreakdown) {
        formData.append(
          'milestoneBreakdown',
          JSON.stringify(values.milestoneBreakdown)
        )
      }

      // Add attachments
      attachments.forEach(file => {
        formData.append('attachments', file)
      })

      const response = await api.post(apiEndpoints.jobs.apply(jobId), formData)

      if (response.success) {
        router.push(appRoutes.trades.jobs.detail(jobId))
      }
    } catch (error) {
      console.error('Failed to submit application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addMilestone = () => {
    const currentMilestones = form.getValues('milestoneBreakdown') || []
    form.setValue('milestoneBreakdown', [
      ...currentMilestones,
      {
        title: '',
        description: '',
        amount: '',
        durationDays: 7
      }
    ])
  }

  const removeMilestone = (index: number) => {
    const currentMilestones = form.getValues('milestoneBreakdown') || []
    form.setValue(
      'milestoneBreakdown',
      currentMilestones.filter((_, i) => i !== index)
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  if (isLoading) {
    return (
      <div className='container mx-auto space-y-6 py-6'>
        <Card>
          <CardContent className='py-12'>
            <div className='text-center'>
              <div className='animate-pulse space-y-4'>
                <div className='bg-muted mx-auto h-8 w-3/4 rounded' />
                <div className='bg-muted mx-auto h-4 w-1/2 rounded' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!job) {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <Briefcase className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>Job not found</h3>
            <p className='text-muted-foreground mb-4'>
              This job may have been removed or is no longer available
            </p>
            <Button onClick={() => router.push(appRoutes.trades.jobs.base)}>
              Browse Other Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (job.status !== 'open') {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <Info className='mx-auto mb-4 h-12 w-12 text-yellow-600' />
            <h3 className='mb-2 text-lg font-semibold'>
              Job is no longer accepting applications
            </h3>
            <p className='text-muted-foreground mb-4'>
              This job has been closed to new applications
            </p>
            <Button onClick={() => router.push(appRoutes.trades.jobs.base)}>
              Browse Other Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate service fee (10%)
  const bidAmount = parseFloat(form.watch('bidAmount') || '0')
  const serviceFee = bidAmount * 0.1
  const youWillReceive = bidAmount - serviceFee

  return (
    <div className='container mx-auto max-w-4xl py-6'>
      {/* Back Navigation */}
      <Button variant='ghost' onClick={() => router.back()} className='mb-4'>
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Job
      </Button>

      <div className='space-y-6'>
        {/* Job Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Proposal for</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h2 className='text-xl font-semibold'>{job.title}</h2>
              <div className='text-muted-foreground mt-2 flex items-center gap-4 text-sm'>
                <Badge variant='outline'>{job.category?.name}</Badge>
                <span>
                  Posted{' '}
                  {formatDistanceToNow(new Date(job.createdAt), {
                    addSuffix: true
                  })}
                </span>
                <span>{job.bidCount} proposals</span>
              </div>
            </div>

            <Separator />

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-muted-foreground'>Budget</p>
                <p className='font-medium'>
                  {job.budgetType === 'fixed' ? (
                    <>
                      ${job.budgetMin}
                      {job.budgetMax &&
                        job.budgetMax !== job.budgetMin &&
                        ` - $${job.budgetMax}`}
                    </>
                  ) : (
                    <>
                      ${job.budgetMin}/hr
                      {job.budgetMax &&
                        job.budgetMax !== job.budgetMin &&
                        ` - $${job.budgetMax}/hr`}
                    </>
                  )}
                </p>
              </div>
              {job.deadline && (
                <div>
                  <p className='text-muted-foreground'>Deadline</p>
                  <p className='font-medium'>
                    {new Date(job.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Terms & Bid */}
            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='bidAmount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {job.budgetType === 'fixed'
                            ? 'Your Bid'
                            : 'Hourly Rate'}
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                            <Input
                              {...field}
                              type='number'
                              placeholder='0.00'
                              className='pl-9'
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {job.budgetType === 'fixed'
                            ? 'Total amount for the project'
                            : 'Your hourly rate'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='deliveryTimeDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Time</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Calendar className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                            <Input
                              {...field}
                              type='number'
                              onChange={e =>
                                field.onChange(parseInt(e.target.value))
                              }
                              placeholder='7'
                              className='pl-9'
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Days to complete</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {bidAmount > 0 && (
                  <Alert>
                    <Info className='h-4 w-4' />
                    <AlertTitle>Service Fee</AlertTitle>
                    <AlertDescription>
                      <div className='mt-2 space-y-1'>
                        <div className='flex justify-between text-sm'>
                          <span>Your Bid:</span>
                          <span className='font-medium'>
                            ${bidAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span>Service Fee (10%):</span>
                          <span className='text-red-600'>
                            -${serviceFee.toFixed(2)}
                          </span>
                        </div>
                        <Separator className='my-2' />
                        <div className='flex justify-between font-medium'>
                          <span>You'll Receive:</span>
                          <span className='text-green-600'>
                            ${youWillReceive.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Proposal */}
            <Card>
              <CardHeader>
                <CardTitle>Your Proposal</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='proposalText'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={8}
                          placeholder="Describe your approach to this project, relevant experience, and why you're the best fit..."
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 100 characters. Be specific about your approach
                        and experience.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='coverLetter'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Letter (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder='Add a personalized message to the client...'
                        />
                      </FormControl>
                      <FormDescription>
                        A personal touch can help your proposal stand out
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Milestones (Optional) */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>Milestones (Optional)</CardTitle>
                  {!showMilestones ? (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setShowMilestones(true)
                        addMilestone()
                      }}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Milestones
                    </Button>
                  ) : (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addMilestone}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Another
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showMilestones && (
                <CardContent className='space-y-4'>
                  <p className='text-muted-foreground text-sm'>
                    Break down your project into milestones to help the client
                    understand your approach
                  </p>

                  {(form.watch('milestoneBreakdown') || []).map((_, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className='flex items-center justify-between'>
                          <h4 className='text-sm font-medium'>
                            Milestone {index + 1}
                          </h4>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeMilestone(index)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <FormField
                            control={form.control}
                            name={`milestoneBreakdown.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder='Milestone title'
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className='grid grid-cols-2 gap-2'>
                            <FormField
                              control={form.control}
                              name={`milestoneBreakdown.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount</FormLabel>
                                  <FormControl>
                                    <div className='relative'>
                                      <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                                      <Input
                                        {...field}
                                        type='number'
                                        placeholder='0'
                                        className='pl-9'
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`milestoneBreakdown.${index}.durationDays`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type='number'
                                      onChange={e =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                      placeholder='7'
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name={`milestoneBreakdown.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={2}
                                  placeholder='What will be delivered in this milestone...'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='rounded-lg border-2 border-dashed p-6 text-center'>
                    <Upload className='text-muted-foreground mx-auto mb-2 h-10 w-10' />
                    <label htmlFor='file-upload' className='cursor-pointer'>
                      <span className='text-primary text-sm font-medium hover:underline'>
                        Click to upload
                      </span>
                      <span className='text-muted-foreground text-sm'>
                        {' '}
                        or drag and drop
                      </span>
                    </label>
                    <input
                      id='file-upload'
                      type='file'
                      multiple
                      onChange={handleFileChange}
                      className='hidden'
                      accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip'
                    />
                    <p className='text-muted-foreground mt-2 text-xs'>
                      PDF, DOC, DOCX, TXT, JPG, PNG, GIF, ZIP up to 10MB each
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className='space-y-2'>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded-lg border p-2'
                        >
                          <div className='flex items-center gap-2'>
                            <FileText className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm'>{file.name}</span>
                            <span className='text-muted-foreground text-xs'>
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setAttachments(
                                attachments.filter((_, i) => i !== index)
                              )
                            }}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className='flex gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                className='flex-1'
              >
                Cancel
              </Button>
              <LoadingButton
                type='submit'
                isLoading={isSubmitting}
                className='flex-1'
              >
                Submit Proposal
              </LoadingButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
