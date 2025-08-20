'use client'

import { useState, useEffect } from 'react'

import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  BarChart3,
  Briefcase,
  Globe
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'

interface Partnership {
  id: number
  status: 'pending' | 'active' | 'inactive' | 'rejected'
  companyName: string
  partnershipType: string
  commissionRate: number
  startDate: Date
  customTerms?: string
}

interface PartnershipStats {
  totalTransactions: number
  totalVolume: string
  totalCommissions: string
  pendingCommissions: string
  avgTransactionSize: string
  activeUsers: number
}

interface Commission {
  id: number
  date: Date
  transactionId: string
  amount: string
  status: 'pending' | 'paid' | 'cancelled'
  paidAt?: Date
}

export default function PartnerPortal() {
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [stats, setStats] = useState<PartnershipStats | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [applicationForm, setApplicationForm] = useState({
    companyName: '',
    websiteUrl: '',
    contactEmail: '',
    contactPhone: '',
    partnershipType: '',
    estimatedVolume: '',
    userBase: '',
    proposedTerms: '',
    additionalInfo: ''
  })

  useEffect(() => {
    fetchPartnershipData()
  }, [])

  const fetchPartnershipData = async () => {
    try {
      const result = await api.get(apiEndpoints.partnerships.status, {
        shouldShowErrorToast: false
      })

      if (result.success) {
        const data = result.data
        if (data.hasPartnership) {
          setPartnership(data.partnership)
          setStats(data.stats)

          if (data.partnership.status === 'active') {
            fetchCommissions()
            generateChartData()
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch partnership data:', error)
    }
  }

  const fetchCommissions = async () => {
    try {
      const result = await api.get(apiEndpoints.partnerships.commissions, {
        shouldShowErrorToast: false
      })
      if (result.success) {
        setCommissions(result.data.commissions)
      }
    } catch (error) {
      console.error('Failed to fetch commissions:', error)
    }
  }

  const generateChartData = () => {
    // Mock chart data
    const data = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      volume: Math.floor(Math.random() * 50000) + 10000,
      commissions: Math.floor(Math.random() * 500) + 100
    }))
    setChartData(data)
  }

  const submitApplication = async () => {
    try {
      const result = await api.post(
        apiEndpoints.partnerships.apply,
        applicationForm,
        {
          shouldShowErrorToast: false,
          successMessage: 'Partnership application submitted successfully!'
        }
      )

      if (result.success) {
        fetchPartnershipData() // Refresh data
      } else {
        toast.error(result.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Failed to submit application:', error)
      toast.error('Failed to submit partnership application')
    }
  }

  // If no partnership exists, show application form
  if (!partnership) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-8'>
        <Card>
          <CardHeader>
            <CardTitle className='text-3xl'>Become a Partner</CardTitle>
            <CardDescription>
              Join Escrowzy's partnership program and earn competitive
              commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {/* Benefits Section */}
              <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
                <Card>
                  <CardContent className='p-4'>
                    <DollarSign className='mb-2 h-8 w-8 text-green-500' />
                    <h4 className='font-semibold'>High Commissions</h4>
                    <p className='text-muted-foreground text-sm'>
                      Up to 30% revenue share
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4'>
                    <Users className='mb-2 h-8 w-8 text-blue-500' />
                    <h4 className='font-semibold'>Dedicated Support</h4>
                    <p className='text-muted-foreground text-sm'>
                      Partner success team
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4'>
                    <BarChart3 className='mb-2 h-8 w-8 text-purple-500' />
                    <h4 className='font-semibold'>Analytics Dashboard</h4>
                    <p className='text-muted-foreground text-sm'>
                      Real-time tracking
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Application Form */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label htmlFor='companyName'>Company Name *</Label>
                  <Input
                    id='companyName'
                    value={applicationForm.companyName}
                    onChange={e =>
                      setApplicationForm(prev => ({
                        ...prev,
                        companyName: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='websiteUrl'>Website URL *</Label>
                  <Input
                    id='websiteUrl'
                    type='url'
                    value={applicationForm.websiteUrl}
                    onChange={e =>
                      setApplicationForm(prev => ({
                        ...prev,
                        websiteUrl: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='contactEmail'>Contact Email *</Label>
                  <Input
                    id='contactEmail'
                    type='email'
                    value={applicationForm.contactEmail}
                    onChange={e =>
                      setApplicationForm(prev => ({
                        ...prev,
                        contactEmail: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='contactPhone'>Contact Phone</Label>
                  <Input
                    id='contactPhone'
                    type='tel'
                    value={applicationForm.contactPhone}
                    onChange={e =>
                      setApplicationForm(prev => ({
                        ...prev,
                        contactPhone: e.target.value
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='partnershipType'>Partnership Type *</Label>
                  <Select
                    value={applicationForm.partnershipType}
                    onValueChange={value =>
                      setApplicationForm(prev => ({
                        ...prev,
                        partnershipType: value
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='exchange'>Exchange</SelectItem>
                      <SelectItem value='wallet'>Wallet Provider</SelectItem>
                      <SelectItem value='defi'>DeFi Platform</SelectItem>
                      <SelectItem value='influencer'>
                        Influencer/Content Creator
                      </SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='estimatedVolume'>
                    Estimated Monthly Volume
                  </Label>
                  <Input
                    id='estimatedVolume'
                    placeholder='e.g., $100,000'
                    value={applicationForm.estimatedVolume}
                    onChange={e =>
                      setApplicationForm(prev => ({
                        ...prev,
                        estimatedVolume: e.target.value
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='userBase'>User Base Size</Label>
                  <Input
                    id='userBase'
                    placeholder='e.g., 10,000 active users'
                    value={applicationForm.userBase}
                    onChange={e =>
                      setApplicationForm(prev => ({
                        ...prev,
                        userBase: e.target.value
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='proposedTerms'>
                  Proposed Partnership Terms *
                </Label>
                <Textarea
                  id='proposedTerms'
                  rows={4}
                  placeholder='Describe your proposed partnership terms and how we can work together...'
                  value={applicationForm.proposedTerms}
                  onChange={e =>
                    setApplicationForm(prev => ({
                      ...prev,
                      proposedTerms: e.target.value
                    }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor='additionalInfo'>Additional Information</Label>
                <Textarea
                  id='additionalInfo'
                  rows={3}
                  placeholder="Any additional information you'd like to share..."
                  value={applicationForm.additionalInfo}
                  onChange={e =>
                    setApplicationForm(prev => ({
                      ...prev,
                      additionalInfo: e.target.value
                    }))
                  }
                />
              </div>

              <Button
                onClick={submitApplication}
                className='w-full'
                disabled={
                  !applicationForm.companyName ||
                  !applicationForm.websiteUrl ||
                  !applicationForm.contactEmail ||
                  !applicationForm.partnershipType ||
                  !applicationForm.proposedTerms
                }
              >
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show different content based on partnership status
  if (partnership.status === 'pending') {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-8'>
        <Card>
          <CardContent className='p-12 text-center'>
            <Clock className='mx-auto mb-4 h-16 w-16 text-yellow-500' />
            <h2 className='mb-2 text-2xl font-bold'>
              Application Under Review
            </h2>
            <p className='text-muted-foreground mb-6'>
              Your partnership application is being reviewed by our team. We'll
              contact you within 2-3 business days.
            </p>
            <div className='flex items-center justify-center gap-2 text-sm'>
              <Badge variant='outline'>
                Company: {partnership.companyName}
              </Badge>
              <Badge variant='outline'>
                Type: {partnership.partnershipType}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (partnership.status === 'rejected') {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-8'>
        <Card>
          <CardContent className='p-12 text-center'>
            <XCircle className='mx-auto mb-4 h-16 w-16 text-red-500' />
            <h2 className='mb-2 text-2xl font-bold'>
              Application Not Approved
            </h2>
            <p className='text-muted-foreground mb-6'>
              Unfortunately, your partnership application was not approved at
              this time. Please contact our support team for more information.
            </p>
            <Button variant='outline'>Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active partnership dashboard
  const mockStats: PartnershipStats = stats || {
    totalTransactions: 1234,
    totalVolume: '2,456,789',
    totalCommissions: '73,703',
    pendingCommissions: '5,230',
    avgTransactionSize: '1,992',
    activeUsers: 456
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='mb-2 text-4xl font-bold'>Partner Dashboard</h1>
            <p className='text-muted-foreground text-xl'>
              Welcome back, {partnership.companyName}
            </p>
          </div>
          <Badge variant='default' className='px-4 py-2 text-lg'>
            <CheckCircle className='mr-2 h-4 w-4' />
            Active Partner
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Total Volume</p>
                <p className='text-2xl font-bold'>${mockStats.totalVolume}</p>
                <p className='text-xs text-green-500'>+12.5% this month</p>
              </div>
              <TrendingUp className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>
                  Total Commissions
                </p>
                <p className='text-2xl font-bold'>
                  ${mockStats.totalCommissions}
                </p>
                <p className='text-xs text-green-500'>+8.3% this month</p>
              </div>
              <DollarSign className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Active Users</p>
                <p className='text-2xl font-bold'>{mockStats.activeUsers}</p>
                <p className='text-xs text-green-500'>+23 this week</p>
              </div>
              <Users className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Commission Rate</p>
                <p className='text-2xl font-bold'>
                  {partnership.commissionRate}%
                </p>
                <p className='text-muted-foreground text-xs'>Tier: Gold</p>
              </div>
              <Briefcase className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='analytics' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='commissions'>Commissions</TabsTrigger>
          <TabsTrigger value='resources'>Resources</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value='analytics' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Volume & Commission Trends</CardTitle>
              <CardDescription>Last 30 days performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='day' />
                  <YAxis yAxisId='left' />
                  <YAxis yAxisId='right' orientation='right' />
                  <Tooltip />
                  <Area
                    yAxisId='left'
                    type='monotone'
                    dataKey='volume'
                    stroke='#8884d8'
                    fill='#8884d8'
                    fillOpacity={0.3}
                    name='Volume ($)'
                  />
                  <Area
                    yAxisId='right'
                    type='monotone'
                    dataKey='commissions'
                    stroke='#82ca9d'
                    fill='#82ca9d'
                    fillOpacity={0.3}
                    name='Commissions ($)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {[
                    {
                      date: 'Dec 15, 2024',
                      volume: '$125,430',
                      commission: '$3,762'
                    },
                    {
                      date: 'Dec 8, 2024',
                      volume: '$98,210',
                      commission: '$2,946'
                    },
                    {
                      date: 'Dec 22, 2024',
                      volume: '$87,650',
                      commission: '$2,629'
                    }
                  ].map((day, i) => (
                    <div
                      key={i}
                      className='bg-muted/50 flex items-center justify-between rounded-lg p-2'
                    >
                      <div>
                        <p className='font-medium'>{day.date}</p>
                        <p className='text-muted-foreground text-sm'>
                          Volume: {day.volume}
                        </p>
                      </div>
                      <Badge variant='outline'>{day.commission}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>New Users</span>
                    <span className='font-semibold'>156</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>
                      Returning Users
                    </span>
                    <span className='font-semibold'>300</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>
                      Avg. Transaction
                    </span>
                    <span className='font-semibold'>
                      ${mockStats.avgTransactionSize}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>
                      Conversion Rate
                    </span>
                    <span className='font-semibold'>24.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value='commissions'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>Your earnings breakdown</CardDescription>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm'>
                    <Download className='mr-2 h-4 w-4' />
                    Export CSV
                  </Button>
                  <Button variant='outline' size='sm'>
                    <FileText className='mr-2 h-4 w-4' />
                    Invoice
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted/50 mb-4 rounded-lg p-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <p className='text-muted-foreground text-sm'>Pending</p>
                    <p className='text-xl font-bold text-yellow-600'>
                      ${mockStats.pendingCommissions}
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>This Month</p>
                    <p className='text-xl font-bold'>$12,450</p>
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Next Payout</p>
                    <p className='text-xl font-bold'>Jan 1, 2025</p>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      date: '2024-12-28',
                      id: 'TXN-001234',
                      amount: '$234.50',
                      status: 'pending'
                    },
                    {
                      date: '2024-12-27',
                      id: 'TXN-001233',
                      amount: '$189.25',
                      status: 'pending'
                    },
                    {
                      date: '2024-12-26',
                      id: 'TXN-001232',
                      amount: '$412.75',
                      status: 'paid',
                      paidAt: '2024-12-28'
                    },
                    {
                      date: '2024-12-25',
                      id: 'TXN-001231',
                      amount: '$567.30',
                      status: 'paid',
                      paidAt: '2024-12-28'
                    },
                    {
                      date: '2024-12-24',
                      id: 'TXN-001230',
                      amount: '$123.45',
                      status: 'paid',
                      paidAt: '2024-12-28'
                    }
                  ].map((commission, i) => (
                    <TableRow key={i}>
                      <TableCell>{commission.date}</TableCell>
                      <TableCell className='font-mono text-sm'>
                        {commission.id}
                      </TableCell>
                      <TableCell className='font-semibold'>
                        {commission.amount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            commission.status === 'paid'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{commission.paidAt || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value='resources'>
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Integration Resources</CardTitle>
                <CardDescription>
                  Everything you need to integrate Escrowzy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <Button
                    variant='outline'
                    className='h-auto justify-start p-4'
                  >
                    <FileText className='mr-3 h-5 w-5' />
                    <div className='text-left'>
                      <p className='font-semibold'>API Documentation</p>
                      <p className='text-muted-foreground text-sm'>
                        Complete API reference
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant='outline'
                    className='h-auto justify-start p-4'
                  >
                    <Globe className='mr-3 h-5 w-5' />
                    <div className='text-left'>
                      <p className='font-semibold'>Widget Builder</p>
                      <p className='text-muted-foreground text-sm'>
                        Create custom widgets
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant='outline'
                    className='h-auto justify-start p-4'
                  >
                    <Building2 className='mr-3 h-5 w-5' />
                    <div className='text-left'>
                      <p className='font-semibold'>Brand Assets</p>
                      <p className='text-muted-foreground text-sm'>
                        Logos and guidelines
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant='outline'
                    className='h-auto justify-start p-4'
                  >
                    <Users className='mr-3 h-5 w-5' />
                    <div className='text-left'>
                      <p className='font-semibold'>Partner Forum</p>
                      <p className='text-muted-foreground text-sm'>
                        Connect with partners
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing Materials</CardTitle>
                <CardDescription>
                  Promote Escrowzy to your users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <FileText className='text-muted-foreground h-5 w-5' />
                      <div>
                        <p className='font-medium'>Email Templates</p>
                        <p className='text-muted-foreground text-sm'>
                          Ready-to-use email campaigns
                        </p>
                      </div>
                    </div>
                    <Button size='sm'>Download</Button>
                  </div>
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <FileText className='text-muted-foreground h-5 w-5' />
                      <div>
                        <p className='font-medium'>Banner Ads</p>
                        <p className='text-muted-foreground text-sm'>
                          Various sizes and formats
                        </p>
                      </div>
                    </div>
                    <Button size='sm'>Download</Button>
                  </div>
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <FileText className='text-muted-foreground h-5 w-5' />
                      <div>
                        <p className='font-medium'>Landing Page Template</p>
                        <p className='text-muted-foreground text-sm'>
                          Customizable landing page
                        </p>
                      </div>
                    </div>
                    <Button size='sm'>Preview</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value='settings'>
          <Card>
            <CardHeader>
              <CardTitle>Partnership Settings</CardTitle>
              <CardDescription>
                Manage your partnership details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div>
                  <h3 className='mb-3 text-lg font-semibold'>
                    Company Information
                  </h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                      <Label>Company Name</Label>
                      <Input value={partnership.companyName} disabled />
                    </div>
                    <div>
                      <Label>Partnership Type</Label>
                      <Input value={partnership.partnershipType} disabled />
                    </div>
                    <div>
                      <Label>Commission Rate</Label>
                      <Input
                        value={`${partnership.commissionRate}%`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Partner Since</Label>
                      <Input
                        value={partnership.startDate.toLocaleDateString()}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='mb-3 text-lg font-semibold'>
                    Payment Information
                  </h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                      <Label>Payment Method</Label>
                      <Select defaultValue='bank'>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='bank'>Bank Transfer</SelectItem>
                          <SelectItem value='crypto'>Cryptocurrency</SelectItem>
                          <SelectItem value='paypal'>PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Payment Frequency</Label>
                      <Select defaultValue='monthly'>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='weekly'>Weekly</SelectItem>
                          <SelectItem value='biweekly'>Bi-Weekly</SelectItem>
                          <SelectItem value='monthly'>Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='mb-3 text-lg font-semibold'>
                    Notification Preferences
                  </h3>
                  <div className='space-y-3'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        defaultChecked
                        className='rounded'
                      />
                      <span>Email notifications for new transactions</span>
                    </label>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        defaultChecked
                        className='rounded'
                      />
                      <span>Weekly performance reports</span>
                    </label>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        defaultChecked
                        className='rounded'
                      />
                      <span>Payment confirmations</span>
                    </label>
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button>Save Changes</Button>
                  <Button variant='outline'>Contact Support</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
