'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  Award,
  Briefcase,
  Clock,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Search,
  Star,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
import { api } from '@/lib/api/http-client'

interface Freelancer {
  id: number
  name: string
  title: string | null
  activeJobs: number
  totalPaid: number
  avgRating: number
  completionRate: number
}

interface TopPerformer {
  id: number
  name: string
  title: string | null
  completedJobs: number
  totalEarned: number
  avgRating: number
  specialties: string[]
}

interface VendorManagementProps {
  freelancers: {
    active: Freelancer[]
    topPerformers: TopPerformer[]
  }
  clientId: number
}

export function VendorManagement({
  freelancers,
  clientId
}: VendorManagementProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedFreelancer, setSelectedFreelancer] =
    useState<Freelancer | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [favorites, setFavorites] = useState<number[]>([])

  const handleAddToFavorites = async (freelancerId: number) => {
    try {
      const response = await api.post(`/api/client/${clientId}/favorites`, {
        freelancerId
      })

      if (response.success) {
        setFavorites([...favorites, freelancerId])
        toast({
          title: 'Success',
          description: 'Freelancer added to favorites'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to favorites',
        variant: 'destructive'
      })
    }
  }

  const handleSendFeedback = async () => {
    if (!selectedFreelancer || !feedbackMessage) return

    try {
      const response = await api.post(`/api/messages`, {
        recipientId: selectedFreelancer.id,
        message: feedbackMessage,
        type: 'feedback'
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Feedback sent successfully'
        })
        setFeedbackOpen(false)
        setFeedbackMessage('')
        setSelectedFreelancer(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send feedback',
        variant: 'destructive'
      })
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const getPerformanceBadge = (completionRate: number) => {
    if (completionRate >= 95) {
      return <Badge variant='success'>Top Performer</Badge>
    } else if (completionRate >= 85) {
      return <Badge variant='default'>Reliable</Badge>
    } else if (completionRate >= 75) {
      return <Badge variant='secondary'>Good</Badge>
    } else {
      return <Badge variant='outline'>Developing</Badge>
    }
  }

  const filteredFreelancers = freelancers.active.filter(freelancer => {
    const matchesSearch =
      freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (freelancer.title &&
        freelancer.title.toLowerCase().includes(searchQuery.toLowerCase()))

    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'active')
      return matchesSearch && freelancer.activeJobs > 0
    if (filterStatus === 'favorites')
      return matchesSearch && favorites.includes(freelancer.id)
    return matchesSearch
  })

  return (
    <div className='space-y-6'>
      {/* Overview Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {freelancers.active.length}
            </div>
            <p className='text-muted-foreground text-xs'>
              Active relationships
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Currently Working
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {freelancers.active.filter(f => f.activeJobs > 0).length}
            </div>
            <p className='text-muted-foreground text-xs'>On active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              $
              {freelancers.active
                .reduce((sum, f) => sum + f.totalPaid, 0)
                .toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>Across all vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(
                freelancers.active.reduce((sum, f) => sum + f.avgRating, 0) /
                  freelancers.active.length || 0
              ).toFixed(1)}
            </div>
            <div className='mt-1 flex'>
              {getRatingStars(
                freelancers.active.reduce((sum, f) => sum + f.avgRating, 0) /
                  freelancers.active.length || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Management */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Vendor Management
            </span>
            <div className='flex gap-2'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search vendors...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-64 pl-9'
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='favorites'>Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='list' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='list'>Vendor List</TabsTrigger>
              <TabsTrigger value='performance'>Top Performers</TabsTrigger>
              <TabsTrigger value='relationships'>Relationships</TabsTrigger>
            </TabsList>

            <TabsContent value='list'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Active Jobs</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFreelancers.map(freelancer => (
                    <TableRow key={freelancer.id}>
                      <TableCell>
                        <Link
                          href={`/profile/${freelancer.id}`}
                          className='flex items-center gap-2 hover:underline'
                        >
                          <Avatar className='h-8 w-8'>
                            <AvatarFallback>
                              {freelancer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium'>{freelancer.name}</p>
                            {favorites.includes(freelancer.id) && (
                              <Badge variant='outline' className='text-xs'>
                                <Heart className='mr-1 h-3 w-3 fill-current' />
                                Favorite
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>{freelancer.title || 'General'}</TableCell>
                      <TableCell>
                        {freelancer.activeJobs > 0 ? (
                          <Badge variant='success'>
                            {freelancer.activeJobs} active
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground'>None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        ${freelancer.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                          <span>{freelancer.avgRating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <Progress
                            value={freelancer.completionRate}
                            className='h-2'
                          />
                          <span className='text-muted-foreground text-xs'>
                            {freelancer.completionRate}% completion
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/profile/${freelancer.id}`}>
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/messages?user=${freelancer.id}`}>
                                <MessageSquare className='mr-2 h-4 w-4' />
                                Send Message
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFreelancer(freelancer)
                                setFeedbackOpen(true)
                              }}
                            >
                              Provide Feedback
                            </DropdownMenuItem>
                            {!favorites.includes(freelancer.id) && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAddToFavorites(freelancer.id)
                                }
                              >
                                <Heart className='mr-2 h-4 w-4' />
                                Add to Favorites
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/trades/listings/create/service?invite=${freelancer.id}`}
                              >
                                Invite to New Job
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value='performance'>
              <div className='grid gap-4 md:grid-cols-2'>
                {freelancers.topPerformers.length > 0 ? (
                  freelancers.topPerformers.map(performer => (
                    <Card key={performer.id}>
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start gap-3'>
                            <Avatar className='h-12 w-12'>
                              <AvatarFallback>
                                {performer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className='font-medium'>{performer.name}</h4>
                              <p className='text-muted-foreground text-sm'>
                                {performer.title || 'Freelancer'}
                              </p>
                              <div className='mt-1 flex items-center gap-1'>
                                {getRatingStars(performer.avgRating)}
                                <span className='text-muted-foreground ml-1 text-sm'>
                                  ({performer.avgRating.toFixed(1)})
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant='success'>
                            <Award className='mr-1 h-3 w-3' />
                            Top Performer
                          </Badge>
                        </div>

                        <div className='mt-4 grid grid-cols-3 gap-2'>
                          <div className='bg-muted rounded-lg p-2 text-center'>
                            <p className='text-muted-foreground text-xs'>
                              Completed
                            </p>
                            <p className='text-lg font-bold'>
                              {performer.completedJobs}
                            </p>
                          </div>
                          <div className='bg-muted rounded-lg p-2 text-center'>
                            <p className='text-muted-foreground text-xs'>
                              Earned
                            </p>
                            <p className='text-lg font-bold'>
                              ${(performer.totalEarned / 1000).toFixed(0)}k
                            </p>
                          </div>
                          <div className='bg-muted rounded-lg p-2 text-center'>
                            <p className='text-muted-foreground text-xs'>
                              Rating
                            </p>
                            <p className='text-lg font-bold'>
                              {performer.avgRating.toFixed(1)}
                            </p>
                          </div>
                        </div>

                        {performer.specialties.length > 0 && (
                          <div className='mt-3'>
                            <p className='text-muted-foreground mb-1 text-xs'>
                              Specialties
                            </p>
                            <div className='flex flex-wrap gap-1'>
                              {performer.specialties
                                .slice(0, 3)
                                .map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant='outline'
                                    className='text-xs'
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className='mt-4 flex gap-2'>
                          <Button size='sm' className='flex-1' asChild>
                            <Link href={`/profile/${performer.id}`}>
                              View Profile
                            </Link>
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='flex-1'
                          >
                            Hire Again
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className='col-span-2 py-8 text-center'>
                    <TrendingUp className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <h3 className='mb-2 text-lg font-medium'>
                      No top performers yet
                    </h3>
                    <p className='text-muted-foreground'>
                      Work with more freelancers to identify your top performers
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='relationships'>
              <div className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      Relationship Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between rounded-lg border p-3'>
                        <div>
                          <p className='font-medium'>Long-term Partners</p>
                          <p className='text-muted-foreground text-sm'>
                            Worked on 5+ projects
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold'>
                            {
                              freelancers.active.filter(
                                f => f.completionRate > 80
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center justify-between rounded-lg border p-3'>
                        <div>
                          <p className='font-medium'>New Vendors</p>
                          <p className='text-muted-foreground text-sm'>
                            Started working this month
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold'>0</p>
                        </div>
                      </div>
                      <div className='flex items-center justify-between rounded-lg border p-3'>
                        <div>
                          <p className='font-medium'>Repeat Hire Rate</p>
                          <p className='text-muted-foreground text-sm'>
                            Vendors hired multiple times
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold'>
                            {Math.round(
                              (freelancers.active.filter(
                                f => f.totalPaid > 5000
                              ).length /
                                freelancers.active.length) *
                                100
                            )}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <Button variant='outline' className='w-full justify-start'>
                      <UserCheck className='mr-2 h-4 w-4' />
                      Create Preferred Vendor List
                    </Button>
                    <Button variant='outline' className='w-full justify-start'>
                      <Briefcase className='mr-2 h-4 w-4' />
                      Set Up Retainer Agreements
                    </Button>
                    <Button variant='outline' className='w-full justify-start'>
                      <Clock className='mr-2 h-4 w-4' />
                      Schedule Performance Reviews
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Send feedback to {selectedFreelancer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='feedback'>Your Feedback</Label>
              <Textarea
                id='feedback'
                value={feedbackMessage}
                onChange={e => setFeedbackMessage(e.target.value)}
                placeholder='Share your thoughts on their work...'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendFeedback}>Send Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
