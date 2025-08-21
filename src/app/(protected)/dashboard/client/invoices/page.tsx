'use client'

import { useState } from 'react'

import { format } from 'date-fns'
import {
  Calendar,
  Download,
  Filter,
  Loader2,
  Receipt,
  Search
} from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { apiEndpoints } from '@/config/api-endpoints'
import { useSession } from '@/hooks/use-session'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'

interface Invoice {
  id: string
  jobId: number
  jobTitle: string
  freelancerId: number
  freelancerName: string
  milestoneId: number
  milestoneTitle: string
  amount: number
  platformFee: number
  netAmount: number
  status: 'pending' | 'paid' | 'overdue'
  issueDate: Date
  dueDate: Date
  paidDate: Date | null
}

interface InvoiceSummary {
  totalInvoices: number
  totalAmount: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  platformFees: number
}

export default function InvoicesPage() {
  const { user } = useSession()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Fetch invoices
  const { data, isLoading, mutate } = useSWR(
    user ? apiEndpoints.client.invoices(user.id) : null,
    async (url: string) => {
      const params = new URLSearchParams()
      if (dateRange.from)
        params.append('startDate', dateRange.from.toISOString())
      if (dateRange.to) params.append('endDate', dateRange.to.toISOString())
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await api.get(`${url}?${params}`)
      return response.success ? response.data : null
    }
  )

  const invoices: Invoice[] = data?.invoices || []
  const summary: InvoiceSummary = data?.summary || {
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    platformFees: 0
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    setDownloadingId(invoiceId)
    try {
      const response = await api.post(
        apiEndpoints.client.invoices(user?.id || ''),
        {
          action: 'download',
          invoiceId
        }
      )

      if (response.success) {
        // Download the invoice
        const link = document.createElement('a')
        link.href = response.data.downloadUrl
        link.download = `${invoiceId}.pdf`
        link.click()

        toast({
          title: 'Success',
          description: 'Invoice downloaded successfully'
        })
      }
    } catch (error) {
      console.error('Failed to download invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const response = await api.post(
        apiEndpoints.client.invoices(user?.id || ''),
        {
          action: 'markPaid',
          invoiceId
        }
      )

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invoice marked as paid'
        })
        mutate()
      }
    } catch (error) {
      console.error('Failed to update invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant='success'>Paid</Badge>
      case 'pending':
        return <Badge variant='warning'>Pending</Badge>
      case 'overdue':
        return <Badge variant='destructive'>Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.freelancerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Invoices</h1>
        <p className='text-muted-foreground'>
          Manage your project invoices and payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.totalInvoices}</div>
            <p className='text-muted-foreground text-xs'>
              {formatCurrency(summary.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {formatCurrency(summary.totalPaid)}
            </div>
            <p className='text-muted-foreground text-xs'>Completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-600'>
              {formatCurrency(summary.totalPending)}
            </div>
            <p className='text-muted-foreground text-xs'>Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {formatCurrency(summary.totalOverdue)}
            </div>
            <p className='text-muted-foreground text-xs'>Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            <div className='relative min-w-64 flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search invoices...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='paid'>Paid</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='overdue'>Overdue</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Receipt className='h-5 w-5' />
              Invoice List
            </span>
            <Button size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Export All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Freelancer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className='font-mono text-sm'>
                    {invoice.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className='font-medium'>{invoice.jobTitle}</p>
                      <p className='text-muted-foreground text-xs'>
                        {invoice.milestoneTitle}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.freelancerName}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.platformFee)}</TableCell>
                  <TableCell className='font-bold'>
                    {formatCurrency(invoice.netAmount)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        disabled={downloadingId === invoice.id}
                      >
                        {downloadingId === invoice.id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Download className='h-4 w-4' />
                        )}
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleMarkPaid(invoice.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Date range picker component (simplified version)
function DatePickerWithRange({
  date,
  onDateChange
}: {
  date: { from: Date | undefined; to: Date | undefined }
  onDateChange: (date: { from: Date | undefined; to: Date | undefined }) => void
}) {
  return (
    <Button variant='outline' className='w-64'>
      <Calendar className='mr-2 h-4 w-4' />
      {date.from ? (
        date.to ? (
          <>
            {format(date.from, 'MMM d')} - {format(date.to, 'MMM d, yyyy')}
          </>
        ) : (
          format(date.from, 'MMM d, yyyy')
        )
      ) : (
        'Select date range'
      )}
    </Button>
  )
}
