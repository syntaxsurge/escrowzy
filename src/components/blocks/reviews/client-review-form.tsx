'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { StarRating } from '@/components/ui/star-rating'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/http-client'
import {
  clientReviewSchema,
  type ClientReviewInput
} from '@/lib/schemas/reviews'

interface ClientReviewFormProps {
  jobId: number
  clientId: number
  jobTitle: string
  clientName: string
  onSuccess?: () => void
}

export function ClientReviewForm({
  jobId,
  clientId,
  jobTitle,
  clientName,
  onSuccess
}: ClientReviewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientReviewInput>({
    resolver: zodResolver(clientReviewSchema),
    defaultValues: {
      jobId,
      clientId,
      rating: 5,
      reviewText: '',
      paymentRating: 5,
      communicationRating: 5,
      clarityRating: 5,
      wouldWorkAgain: true,
      isPublic: true
    }
  })

  const onSubmit = async (data: ClientReviewInput) => {
    setIsSubmitting(true)
    try {
      const result = await api.post('/api/reviews/client', data, {
        shouldShowErrorToast: false,
        successMessage: 'Review submitted successfully!'
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/users/${clientId}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit review'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='space-y-4'>
          <div>
            <h3 className='text-lg font-semibold'>Review for {clientName}</h3>
            <p className='text-muted-foreground text-sm'>Job: {jobTitle}</p>
          </div>

          <FormField
            control={form.control}
            name='rating'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Rating</FormLabel>
                <FormControl>
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size='lg'
                    showValue
                  />
                </FormControl>
                <FormDescription>
                  Rate your overall experience with this client
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='reviewText'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Share your experience working with this client...'
                    className='min-h-[120px]'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Minimum 10 characters, maximum 5000 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-4 md:grid-cols-3'>
            <FormField
              control={form.control}
              name='paymentRating'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment</FormLabel>
                  <FormControl>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      size='sm'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='communicationRating'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication</FormLabel>
                  <FormControl>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      size='sm'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='clarityRating'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Clarity</FormLabel>
                  <FormControl>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      size='sm'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='wouldWorkAgain'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Would Work Again</FormLabel>
                  <FormDescription>
                    Would you work with this client again?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='isPublic'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Public Review</FormLabel>
                  <FormDescription>
                    Make this review visible to everyone
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Submit Review
        </Button>
      </form>
    </Form>
  )
}
