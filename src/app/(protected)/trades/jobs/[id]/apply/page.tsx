'use client'

import dynamic from 'next/dynamic'
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
  Upload,
  AlertCircle
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import useSWR from 'swr'
import { z } from 'zod'

// import { BidTemplateSelector } from '@/components/blocks/jobs/bid-template-selector'
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
import type { BidTemplate } from '@/lib/db/schema'
import { bidSubmissionSchema } from '@/lib/schemas/bid'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default),
  { ssr: false }
)

// Use the centralized bid submission schema with local extensions
const applyFormSchema = bidSubmissionSchema.omit({ jobId: true }).extend({
  deliveryDays: z
    .number()
    .min(1, 'Delivery time must be at least 1 day')
    .max(365),
  milestones: z
    .array(
      z.object({
        title: z
          .string()
          .min(3, 'Milestone title must be at least 3 characters'),
        description: z
          .string()
          .min(10, 'Description must be at least 10 characters'),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
        deliveryDays: z.number().min(1).max(365)
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
  const [proposalPreview, setProposalPreview] = useState(false)

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
      deliveryDays: 7,
      proposalText: '',
      coverLetter: '',
      milestones: [],
      attachments: []
    }
  })

  const onSubmit = async (values: ApplyFormValues) => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare attachment URLs (in a real app, you'd upload these first)
      const attachmentData =
        attachments.length > 0
          ? attachments.map(file => ({
              name: file.name,
              url: URL.createObjectURL(file), // In production, upload to cloud storage
              size: file.size,
              type: file.type
            }))
          : undefined

      // Submit bid via the new API endpoint
      const response = await api.post(`/api/jobs/${jobId}/bids`, {
        bidAmount: values.bidAmount,
        deliveryDays: values.deliveryDays,
        proposalText: values.proposalText,
        coverLetter: values.coverLetter || undefined,
        milestones: values.milestones,
        attachments: attachmentData
      })

      if (response.success) {
        toast.success('Proposal submitted successfully!')
        router.push(appRoutes.trades.jobs.detail(jobId))
      } else {
        toast.error(response.error || 'Failed to submit proposal')
      }
    } catch (error: any) {
      console.error('Failed to submit application:', error)
      toast.error(error.message || 'Failed to submit proposal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addMilestone = () => {
    const currentMilestones = form.getValues('milestones') || []
    form.setValue('milestones', [
      ...currentMilestones,
      {
        title: '',
        description: '',
        amount: '',
        deliveryDays: 7
      }
    ])
  }

  const removeMilestone = (index: number) => {
    const currentMilestones = form.getValues('milestones') || []
    form.setValue(
      'milestones',
      currentMilestones.filter((_, i) => i !== index)
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  const handleTemplateSelect = (template: BidTemplate) => {
    // Apply template values to form
    form.setValue('proposalText', template.proposalText)
    if (template.coverLetter) {
      form.setValue('coverLetter', template.coverLetter)
    }
    toast.success('Template applied successfully')
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
                    name='deliveryDays'
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
                <div className='flex items-center justify-between'>
                  <CardTitle>Your Proposal</CardTitle>
                  <div className='flex items-center gap-2'>
                    <BidTemplateSelector
                      onSelectTemplate={handleTemplateSelect}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => setProposalPreview(!proposalPreview)}
                    >
                      {proposalPreview ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='proposalText'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal</FormLabel>
                      <FormControl>
                        <div data-color-mode='light'>
                          <MDEditor
                            value={field.value}
                            onChange={value => field.onChange(value || '')}
                            preview={proposalPreview ? 'preview' : 'edit'}
                            height={400}
                            textareaProps={{
                              placeholder:
                                "## About Me\n\nDescribe your expertise and experience...\n\n## My Approach\n\nExplain how you'll tackle this project...\n\n## Why Choose Me\n\nHighlight what makes you the best fit..."
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Use Markdown to format your proposal. Minimum 50
                        characters.
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

                  {(form.watch('milestones') || []).map((_, index) => (
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
                            name={`milestones.${index}.title`}
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
                              name={`milestones.${index}.amount`}
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
                              name={`milestones.${index}.deliveryDays`}
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
                          name={`milestones.${index}.description`}
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
                      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        <span>
                          Selected files ({attachments.length} / 5 max)
                        </span>
                      </div>
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
