'use client'

import { useState } from 'react'

import { CheckCircle2, DollarSign, Gift, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MilestoneApprovalProps {
  isOpen: boolean
  onClose: () => void
  milestoneId: number
  milestoneTitle: string
  milestoneAmount: string
  freelancerName: string
  onApprove: (data: {
    feedback?: string
    rating?: number
    tip?: string
  }) => Promise<void>
}

export function MilestoneApproval({
  isOpen,
  onClose,
  milestoneId,
  milestoneTitle,
  milestoneAmount,
  freelancerName,
  onApprove
}: MilestoneApprovalProps) {
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(5)
  const [includeTip, setIncludeTip] = useState(false)
  const [tipAmount, setTipAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await onApprove({
        feedback: feedback.trim() || undefined,
        rating,
        tip: includeTip && tipAmount ? tipAmount : undefined
      })

      // Reset form
      setFeedback('')
      setRating(5)
      setIncludeTip(false)
      setTipAmount('')
      onClose()
    } catch (error) {
      console.error('Error approving milestone:', error)
      alert('Failed to approve milestone. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const calculateTotal = () => {
    const base = parseFloat(milestoneAmount)
    const tip = includeTip ? parseFloat(tipAmount || '0') : 0
    return (base + tip).toFixed(3)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Approve Milestone</DialogTitle>
          <DialogDescription>
            Review and approve "{milestoneTitle}" submitted by {freelancerName}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Rating */}
          <div className='space-y-2'>
            <Label>Rate this milestone</Label>
            <div className='flex items-center gap-1'>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type='button'
                  onClick={() => setRating(value)}
                  className='p-1 transition-colors hover:text-yellow-500'
                >
                  <Star
                    className={cn(
                      'h-6 w-6',
                      value <= rating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
              <span className='text-muted-foreground ml-2 text-sm'>
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Good'}
                {rating === 3 && 'Satisfactory'}
                {rating === 2 && 'Below expectations'}
                {rating === 1 && 'Poor'}
              </span>
            </div>
          </div>

          {/* Feedback */}
          <div className='space-y-2'>
            <Label htmlFor='feedback'>Feedback (Optional)</Label>
            <Textarea
              id='feedback'
              placeholder='Great work! The deliverables met all requirements...'
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
            />
            <p className='text-muted-foreground text-xs'>
              Your feedback will be visible to the freelancer
            </p>
          </div>

          {/* Tip Option */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='flex items-center gap-2'>
                <Gift className='h-4 w-4' />
                Add a tip?
              </Label>
              <RadioGroup
                value={includeTip ? 'yes' : 'no'}
                onValueChange={value => setIncludeTip(value === 'yes')}
                className='flex gap-4'
              >
                <div className='flex items-center'>
                  <RadioGroupItem value='yes' id='tip-yes' />
                  <Label htmlFor='tip-yes' className='ml-2 cursor-pointer'>
                    Yes
                  </Label>
                </div>
                <div className='flex items-center'>
                  <RadioGroupItem value='no' id='tip-no' />
                  <Label htmlFor='tip-no' className='ml-2 cursor-pointer'>
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {includeTip && (
              <div className='space-y-2'>
                <div className='relative'>
                  <DollarSign className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                  <Input
                    type='number'
                    step='0.001'
                    placeholder='0.00'
                    value={tipAmount}
                    onChange={e => setTipAmount(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <p className='text-muted-foreground text-xs'>
                  Show your appreciation with a tip (in ETH)
                </p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className='bg-muted space-y-2 rounded-lg p-4'>
            <h4 className='font-medium'>Payment Summary</h4>
            <div className='space-y-1 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Milestone Amount</span>
                <span>{milestoneAmount} ETH</span>
              </div>
              {includeTip && tipAmount && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Tip</span>
                  <span>{parseFloat(tipAmount).toFixed(3)} ETH</span>
                </div>
              )}
              <div className='flex justify-between border-t pt-1 font-medium'>
                <span>Total Payment</span>
                <span>{calculateTotal()} ETH</span>
              </div>
            </div>
          </div>

          <div className='rounded-lg bg-blue-50 p-3'>
            <p className='text-sm text-blue-900'>
              <CheckCircle2 className='mr-1 inline-block h-4 w-4' />
              By approving, you confirm the work meets your requirements and
              authorize payment release.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isApproving}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isApproving}>
            {isApproving
              ? 'Processing...'
              : `Approve & Pay ${calculateTotal()} ETH`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
