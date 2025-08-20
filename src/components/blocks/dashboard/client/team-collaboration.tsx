'use client'

import Link from 'next/link'
import { useState } from 'react'

import { format } from 'date-fns'
import {
  Activity,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  CheckCircle,
  DollarSign
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'

interface TeamActivity {
  recentActions: Array<{
    type: string
    description: string
    actor: string
    timestamp: Date
  }>
  memberStats: Array<{
    id: number
    name: string
    role: string
    activeProjects: number
    totalManaged: number
  }>
}

interface TeamCollaborationProps {
  teamActivity: TeamActivity
  memberStats: Array<{
    id: number
    name: string
    role: string
    activeProjects: number
    totalManaged: number
  }>
  clientId: number
}

export function TeamCollaboration({
  teamActivity,
  memberStats,
  clientId
}: TeamCollaborationProps) {
  const { toast } = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleInviteTeamMember = async () => {
    if (!inviteEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await api.post(apiEndpoints.teams.invite, {
        email: inviteEmail,
        role: inviteRole,
        clientId
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Team invitation sent successfully'
        })
        setInviteOpen(false)
        setInviteEmail('')
        setInviteRole('member')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className='h-4 w-4 text-purple-500' />
      case 'manager':
        return <UserCheck className='h-4 w-4 text-blue-500' />
      case 'member':
        return <Users className='h-4 w-4 text-gray-500' />
      default:
        return <Users className='h-4 w-4' />
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'job_posted':
        return <FileText className='h-4 w-4 text-blue-500' />
      case 'member_joined':
        return <UserPlus className='h-4 w-4 text-green-500' />
      case 'milestone_approved':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'payment_sent':
        return <DollarSign className='h-4 w-4 text-purple-500' />
      default:
        return <Activity className='h-4 w-4' />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant='destructive'>Admin</Badge>
      case 'manager':
        return <Badge variant='default'>Manager</Badge>
      case 'member':
        return <Badge variant='secondary'>Member</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  return (
    <div className='space-y-6'>
      {/* Team Overview */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{memberStats.length}</div>
            <p className='text-muted-foreground text-xs'>Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {memberStats.reduce((sum, m) => sum + m.activeProjects, 0)}
            </div>
            <p className='text-muted-foreground text-xs'>Across all members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Managed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {memberStats.reduce((sum, m) => sum + m.totalManaged, 0)}
            </div>
            <p className='text-muted-foreground text-xs'>Projects completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Team Management
            </span>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size='sm'>
                  <Plus className='mr-2 h-4 w-4' />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new member to your team to help manage projects
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='email'>Email Address</Label>
                    <Input
                      id='email'
                      type='email'
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder='member@example.com'
                    />
                  </div>
                  <div>
                    <Label htmlFor='role'>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='member'>Member</SelectItem>
                        <SelectItem value='manager'>Manager</SelectItem>
                        <SelectItem value='admin'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='bg-muted rounded-lg p-3'>
                    <h4 className='mb-2 text-sm font-medium'>
                      Role Permissions
                    </h4>
                    <ul className='text-muted-foreground space-y-1 text-xs'>
                      {inviteRole === 'member' && (
                        <>
                          <li>• View projects and milestones</li>
                          <li>• Communicate with freelancers</li>
                          <li>• View reports</li>
                        </>
                      )}
                      {inviteRole === 'manager' && (
                        <>
                          <li>• All member permissions</li>
                          <li>• Approve milestones</li>
                          <li>• Manage job postings</li>
                          <li>• Handle applications</li>
                        </>
                      )}
                      {inviteRole === 'admin' && (
                        <>
                          <li>• All manager permissions</li>
                          <li>• Manage team members</li>
                          <li>• Access billing</li>
                          <li>• Full system access</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInviteTeamMember}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='members' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='members'>Members</TabsTrigger>
              <TabsTrigger value='activity'>Activity</TabsTrigger>
              <TabsTrigger value='assignments'>Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value='members'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active Projects</TableHead>
                    <TableHead>Total Managed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-8 w-8'>
                            <AvatarFallback>
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium'>{member.name}</p>
                            <p className='text-muted-foreground text-xs'>
                              ID: {member.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          {getRoleIcon(member.role)}
                          {getRoleBadge(member.role)}
                        </div>
                      </TableCell>
                      <TableCell>{member.activeProjects}</TableCell>
                      <TableCell>{member.totalManaged}</TableCell>
                      <TableCell>
                        <Badge variant='success'>Active</Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button size='sm' variant='ghost' asChild>
                            <Link href={`/dashboard/team/${member.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button size='sm' variant='ghost'>
                            <Settings className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value='activity'>
              <div className='space-y-4'>
                {teamActivity.recentActions.length > 0 ? (
                  teamActivity.recentActions.map((action, index) => (
                    <div
                      key={index}
                      className='flex items-start gap-3 rounded-lg border p-3'
                    >
                      <div className='mt-1'>{getActionIcon(action.type)}</div>
                      <div className='flex-1'>
                        <p className='text-sm'>
                          <span className='font-medium'>{action.actor}</span>{' '}
                          {action.description}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {format(new Date(action.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='py-8 text-center'>
                    <Activity className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <h3 className='mb-2 text-lg font-medium'>
                      No recent activity
                    </h3>
                    <p className='text-muted-foreground'>
                      Team activity will appear here
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='assignments'>
              <div className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      Project Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {memberStats.map(member => (
                        <div
                          key={member.id}
                          className='flex items-center justify-between rounded-lg border p-3'
                        >
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarFallback>
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium'>{member.name}</p>
                              <p className='text-muted-foreground text-sm'>
                                {member.activeProjects} active projects
                              </p>
                            </div>
                          </div>
                          <Button size='sm' variant='outline'>
                            Assign Project
                            <ChevronRight className='ml-2 h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      Assignment Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant='outline' className='w-full'>
                      <Plus className='mr-2 h-4 w-4' />
                      Create Assignment Rule
                    </Button>
                    <p className='text-muted-foreground mt-2 text-xs'>
                      Automatically assign team members to projects based on
                      rules
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Import statements for missing icons
