'use client'

import { useState, useEffect } from 'react'

import {
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Check,
  X,
  Search
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { StarRating } from '@/components/ui/star-rating'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: number
  type: 'freelancer' | 'client'
  rating: number
  reviewText: string
  isPublic: boolean
  reviewerId: number
  reviewerName: string
  targetId: number
  targetName: string
  jobTitle: string
  createdAt: string
  hasDispute: boolean
}

interface Dispute {
  id: number
  reviewId: number
  reviewType: 'freelancer' | 'client'
  reason: string
  description: string
  status: string
  disputedBy: string
  createdAt: string
}

export function AdminReviewModeration() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('reviews')
  const [reviews, setReviews] = useState<Review[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'freelancer' | 'client'>(
    'all'
  )
  const [filterStatus, setFilterStatus] = useState<'all' | 'public' | 'hidden'>(
    'all'
  )
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [moderationNote, setModerationNote] = useState('')
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'hide' | 'show' | 'delete' | 'resolve'
    item: Review | Dispute | null
  }>({ open: false, type: 'hide', item: null })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'reviews') {
        const response = await fetch('/api/admin/reviews')
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        const response = await fetch('/api/reviews/disputes?type=pending')
        const data = await response.json()
        setDisputes(data.disputes || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load moderation data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReviewAction = async (
    reviewId: number,
    reviewType: 'freelancer' | 'client',
    action: 'hide' | 'show' | 'delete'
  ) => {
    try {
      const response = await fetch('/api/admin/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          reviewType,
          action,
          moderationNote
        })
      })

      if (!response.ok) {
        throw new Error('Failed to moderate review')
      }

      toast({
        title: 'Success',
        description: `Review ${action === 'delete' ? 'deleted' : action === 'hide' ? 'hidden' : 'made public'} successfully`
      })

      fetchData()
      setActionDialog({ open: false, type: 'hide', item: null })
      setModerationNote('')
    } catch (error) {
      console.error('Error moderating review:', error)
      toast({
        title: 'Error',
        description: 'Failed to moderate review',
        variant: 'destructive'
      })
    }
  }

  const handleDisputeResolution = async (
    disputeId: number,
    resolution: 'upheld' | 'dismissed',
    actionTaken: string
  ) => {
    try {
      const response = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          resolution,
          adminNote: moderationNote,
          actionTaken
        })
      })

      if (!response.ok) {
        throw new Error('Failed to resolve dispute')
      }

      toast({
        title: 'Success',
        description: 'Dispute resolved successfully'
      })

      fetchData()
      setActionDialog({ open: false, type: 'resolve', item: null })
      setModerationNote('')
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast({
        title: 'Error',
        description: 'Failed to resolve dispute',
        variant: 'destructive'
      })
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewText.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || review.type === filterType
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'public' && review.isPublic) ||
      (filterStatus === 'hidden' && !review.isPublic)

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='reviews'>Reviews</TabsTrigger>
          <TabsTrigger value='disputes'>Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value='reviews' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Review Moderation</CardTitle>
              <div className='mt-4 flex gap-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                      placeholder='Search reviews...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>
                <Select
                  value={filterType}
                  onValueChange={(v: any) => setFilterType(v)}
                >
                  <SelectTrigger className='w-[150px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='freelancer'>Freelancer</SelectItem>
                    <SelectItem value='client'>Client</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(v: any) => setFilterStatus(v)}
                >
                  <SelectTrigger className='w-[150px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='public'>Public</SelectItem>
                    <SelectItem value='hidden'>Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex justify-center py-8'>
                  <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map(review => (
                      <TableRow key={`${review.type}-${review.id}`}>
                        <TableCell>
                          <Badge variant='outline'>{review.type}</Badge>
                        </TableCell>
                        <TableCell>{review.reviewerName}</TableCell>
                        <TableCell>{review.targetName}</TableCell>
                        <TableCell>
                          <div className='flex items-center'>
                            <StarRating
                              value={review.rating}
                              readonly
                              size='sm'
                            />
                          </div>
                        </TableCell>
                        <TableCell className='max-w-xs truncate'>
                          {review.reviewText}
                        </TableCell>
                        <TableCell>
                          {review.isPublic ? (
                            <Badge variant='default'>
                              <Eye className='mr-1 h-3 w-3' />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant='secondary'>
                              <EyeOff className='mr-1 h-3 w-3' />
                              Hidden
                            </Badge>
                          )}
                          {review.hasDispute && (
                            <Badge variant='destructive' className='ml-2'>
                              <AlertTriangle className='mr-1 h-3 w-3' />
                              Disputed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => setSelectedReview(review)}
                            >
                              View
                            </Button>
                            {review.isPublic ? (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'hide',
                                    item: review
                                  })
                                }
                              >
                                <EyeOff className='h-4 w-4' />
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'show',
                                    item: review
                                  })
                                }
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: 'delete',
                                  item: review
                                })
                              }
                            >
                              <Trash2 className='text-destructive h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='disputes' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Pending Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex justify-center py-8'>
                  <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Review Type</TableHead>
                      <TableHead>Disputed By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map(dispute => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <Badge variant='outline'>{dispute.reviewType}</Badge>
                        </TableCell>
                        <TableCell>{dispute.disputedBy}</TableCell>
                        <TableCell>{dispute.reason}</TableCell>
                        <TableCell className='max-w-xs truncate'>
                          {dispute.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant='warning'>{dispute.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              View
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: 'resolve',
                                  item: dispute
                                })
                              }
                            >
                              <Shield className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={open => setActionDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'hide' && 'Hide Review'}
              {actionDialog.type === 'show' && 'Make Review Public'}
              {actionDialog.type === 'delete' && 'Delete Review'}
              {actionDialog.type === 'resolve' && 'Resolve Dispute'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'delete'
                ? 'This action cannot be undone. The review will be permanently deleted.'
                : 'Please provide a moderation note for this action.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Moderation Note</label>
              <Textarea
                value={moderationNote}
                onChange={e => setModerationNote(e.target.value)}
                placeholder='Explain the reason for this action...'
                rows={3}
              />
            </div>

            {actionDialog.type === 'resolve' && (
              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium'>Resolution</label>
                  <div className='mt-2 flex gap-4'>
                    <Button
                      variant='outline'
                      onClick={() =>
                        handleDisputeResolution(
                          (actionDialog.item as Dispute).id,
                          'upheld',
                          'review_hidden'
                        )
                      }
                    >
                      <Check className='mr-2 h-4 w-4' />
                      Uphold Dispute
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() =>
                        handleDisputeResolution(
                          (actionDialog.item as Dispute).id,
                          'dismissed',
                          'none'
                        )
                      }
                    >
                      <X className='mr-2 h-4 w-4' />
                      Dismiss Dispute
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() =>
                setActionDialog({ open: false, type: 'hide', item: null })
              }
            >
              Cancel
            </Button>
            {actionDialog.type !== 'resolve' && (
              <Button
                variant={
                  actionDialog.type === 'delete' ? 'destructive' : 'default'
                }
                onClick={() => {
                  const review = actionDialog.item as Review
                  handleReviewAction(
                    review.id,
                    review.type,
                    actionDialog.type as any
                  )
                }}
              >
                Confirm
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
