'use client'

import Link from 'next/link'
import { useState } from 'react'

import { format } from 'date-fns'
import {
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import useSWR from 'swr'

import { UserAvatar } from '@/components/blocks/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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

interface ApplicationStats {
  total: number
  pending: number
  shortlisted: number
  hired: number
}

interface Application {
  id: number
  jobId: number
  jobTitle: string
  freelancerId: number
  freelancerName: string
  bidAmount: string
  proposalText: string
  deliveryDays: number
  status: string
  createdAt: Date
}

interface HiringPipelineProps {
  applications: {
    recent: Application[]
    stats: ApplicationStats
  }
  clientId: number
}

interface FreelancerComparison {
  id: number
  name: string
  rating: number
  hourlyRate: number
  completedJobs: number
  successRate: number
  skills: string[]
  bidAmount: string
  deliveryDays: number
}

export function HiringPipeline({
  applications,
  clientId
}: HiringPipelineProps) {
  const { toast } = useToast()
  const [selectedApplications, setSelectedApplications] = useState<number[]>([])
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [selectedJob, setSelectedJob] = useState<number | null>(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>(
    []
  )
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch talent pipeline data
  const { data: talentPipeline } = useSWR(
    `/api/client/${clientId}/talent?action=pipeline`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : null
    }
  )

  const handleShortlist = async (bidId: number) => {
    setIsProcessing(true)
    try {
      const response = await api.post(`/api/client/${clientId}/talent`, {
        action: 'shortlist',
        data: { bidId }
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Candidate shortlisted successfully'
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to shortlist candidate',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkInvite = async () => {
    if (!selectedJob || selectedApplications.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a job and at least one freelancer',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await api.post(`/api/client/${clientId}/talent`, {
        action: 'invite',
        data: {
          jobId: selectedJob,
          freelancerIds: selectedApplications,
          message: inviteMessage
        }
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: `Invitations sent to ${selectedApplications.length} freelancers`
        })
        setBulkInviteOpen(false)
        setSelectedApplications([])
        setInviteMessage('')
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitations',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FileText className='h-4 w-4 text-gray-500' />
      case 'shortlisted':
        return <UserCheck className='h-4 w-4 text-blue-500' />
      case 'accepted':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'rejected':
        return <X className='h-4 w-4 text-red-500' />
      default:
        return null
    }
  }

  return (
    <div className='space-y-6'>
      {/* Pipeline Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{applications.stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-500'>
              {applications.stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Shortlisted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-500'>
              {applications.stats.shortlisted}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Hired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-500'>
              {applications.stats.hired}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hiring Tools */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Hiring Tools
            </span>
            <div className='flex gap-2'>
              <Dialog open={bulkInviteOpen} onOpenChange={setBulkInviteOpen}>
                <DialogTrigger asChild>
                  <Button size='sm'>
                    <Send className='mr-2 h-4 w-4' />
                    Bulk Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Bulk Invitations</DialogTitle>
                    <DialogDescription>
                      Invite multiple freelancers to apply for your job
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='job'>Select Job</Label>
                      <Select
                        value={selectedJob?.toString()}
                        onValueChange={value => setSelectedJob(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Choose a job' />
                        </SelectTrigger>
                        <SelectContent>
                          {applications.recent.map(app => (
                            <SelectItem
                              key={app.jobId}
                              value={app.jobId.toString()}
                            >
                              {app.jobTitle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor='message'>Invitation Message</Label>
                      <Textarea
                        id='message'
                        value={inviteMessage}
                        onChange={e => setInviteMessage(e.target.value)}
                        placeholder='Write a personalized message...'
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>
                        Selected Freelancers: {selectedApplications.length}
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setBulkInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleBulkInvite} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Sending...
                        </>
                      ) : (
                        'Send Invitations'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                size='sm'
                variant='outline'
                onClick={() => setComparisonOpen(true)}
                disabled={selectedForComparison.length < 2}
              >
                Compare ({selectedForComparison.length})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='applications' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='applications'>Applications</TabsTrigger>
              <TabsTrigger value='shortlisted'>Shortlisted</TabsTrigger>
              <TabsTrigger value='templates'>Templates</TabsTrigger>
            </TabsList>

            <TabsContent value='applications'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-12'>
                      <Checkbox
                        checked={
                          selectedApplications.length ===
                          applications.recent.length
                        }
                        onCheckedChange={checked => {
                          if (checked) {
                            setSelectedApplications(
                              applications.recent.map(a => a.freelancerId)
                            )
                          } else {
                            setSelectedApplications([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Delivery Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.recent.map(app => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedApplications.includes(
                            app.freelancerId
                          )}
                          onCheckedChange={checked => {
                            if (checked) {
                              setSelectedApplications([
                                ...selectedApplications,
                                app.freelancerId
                              ])
                            } else {
                              setSelectedApplications(
                                selectedApplications.filter(
                                  id => id !== app.freelancerId
                                )
                              )
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/profile/${app.freelancerId}`}
                          className='flex items-center gap-2 hover:underline'
                        >
                          <UserAvatar
                            user={{ name: app.freelancerName }}
                            size='sm'
                          />
                          {app.freelancerName}
                        </Link>
                      </TableCell>
                      <TableCell>{app.jobTitle}</TableCell>
                      <TableCell>${app.bidAmount}</TableCell>
                      <TableCell>{app.deliveryDays} days</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          {getStatusIcon(app.status)}
                          <Badge
                            variant={
                              app.status === 'shortlisted'
                                ? 'default'
                                : app.status === 'accepted'
                                  ? 'success'
                                  : app.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(app.createdAt), 'MMM d')}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleShortlist(app.id)}
                            disabled={isProcessing || app.status !== 'pending'}
                          >
                            Shortlist
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => {
                              if (
                                selectedForComparison.includes(app.freelancerId)
                              ) {
                                setSelectedForComparison(
                                  selectedForComparison.filter(
                                    id => id !== app.freelancerId
                                  )
                                )
                              } else {
                                setSelectedForComparison([
                                  ...selectedForComparison,
                                  app.freelancerId
                                ])
                              }
                            }}
                          >
                            {selectedForComparison.includes(app.freelancerId)
                              ? 'Remove'
                              : 'Compare'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value='shortlisted'>
              <div className='space-y-4'>
                {applications.recent
                  .filter(app => app.status === 'shortlisted')
                  .map(app => (
                    <Card key={app.id}>
                      <CardContent className='flex items-center justify-between p-4'>
                        <div className='flex items-center gap-4'>
                          <UserAvatar
                            user={{ name: app.freelancerName }}
                            size='lg'
                          />
                          <div>
                            <h4 className='font-medium'>
                              {app.freelancerName}
                            </h4>
                            <p className='text-muted-foreground text-sm'>
                              {app.jobTitle} • ${app.bidAmount}
                            </p>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button size='sm' variant='outline' asChild>
                            <Link href={`/messages?user=${app.freelancerId}`}>
                              <MessageSquare className='mr-2 h-4 w-4' />
                              Message
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value='templates'>
              <div className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      Hiring Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <Button variant='outline' className='w-full justify-start'>
                      <Mail className='mr-2 h-4 w-4' />
                      Invitation Email Template
                    </Button>
                    <Button variant='outline' className='w-full justify-start'>
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Offer Letter Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Comparison Dialog */}
      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Compare Freelancers</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected candidates
            </DialogDescription>
          </DialogHeader>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criteria</TableHead>
                  {selectedForComparison.map(id => {
                    const app = applications.recent.find(
                      a => a.freelancerId === id
                    )
                    return (
                      <TableHead key={id}>
                        {app?.freelancerName || 'Unknown'}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className='font-medium'>Bid Amount</TableCell>
                  {selectedForComparison.map(id => {
                    const app = applications.recent.find(
                      a => a.freelancerId === id
                    )
                    return (
                      <TableCell key={id}>${app?.bidAmount || '-'}</TableCell>
                    )
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className='font-medium'>Delivery Time</TableCell>
                  {selectedForComparison.map(id => {
                    const app = applications.recent.find(
                      a => a.freelancerId === id
                    )
                    return (
                      <TableCell key={id}>
                        {app?.deliveryDays || '-'} days
                      </TableCell>
                    )
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setComparisonOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
