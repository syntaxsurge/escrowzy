'use client'

import { useState } from 'react'

import { format } from 'date-fns'
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Loader2,
  PieChart,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import useSWR from 'swr'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'

interface SpendingData {
  monthly: Array<{
    month: string
    amount: number
    projectCount: number
  }>
  byCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  projections: {
    currentMonth: number
    nextMonth: number
    quarterEstimate: number
  }
}

interface SpendingAnalyticsProps {
  spending: SpendingData
  overview: {
    totalSpent: number
    avgProjectCost: number
    completedProjects: number
  }
  clientId: number
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D'
]

export function SpendingAnalytics({
  spending,
  overview,
  clientId
}: SpendingAnalyticsProps) {
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState('6')
  const [isExporting, setIsExporting] = useState(false)

  // Fetch detailed analytics
  const { data: analytics, isLoading } = useSWR(
    `/api/client/${clientId}/analytics?months=${timeRange}`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : null
    }
  )

  const handleExportReport = async (type: 'csv' | 'pdf') => {
    setIsExporting(true)
    try {
      const response = await api.post(`/api/client/${clientId}/reports`, {
        type,
        timeRange: parseInt(timeRange)
      })

      if (response.success) {
        // Download the report
        const link = document.createElement('a')
        link.href = response.data.downloadUrl
        link.download = `spending-report-${format(new Date(), 'yyyy-MM-dd')}.${type}`
        link.click()

        toast({
          title: 'Success',
          description: `Report exported as ${type.toUpperCase()}`
        })
      }
    } catch (error) {
      console.error('Failed to export report:', error)
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  const calculateROI = () => {
    if (!analytics) return 0
    const totalInvested = analytics.totalSpent
    const completedValue =
      analytics.completedProjects * analytics.averageProjectCost
    return totalInvested > 0
      ? ((completedValue - totalInvested) / totalInvested) * 100
      : 0
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-background rounded-lg border p-3 shadow-md'>
          <p className='font-medium'>{formatMonth(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className='text-sm' style={{ color: entry.color }}>
              {entry.name}:{' '}
              {entry.name.includes('Amount') || entry.name.includes('Cost')
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='3'>Last 3 months</SelectItem>
              <SelectItem value='6'>Last 6 months</SelectItem>
              <SelectItem value='12'>Last 12 months</SelectItem>
              <SelectItem value='24'>Last 24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => handleExportReport('csv')}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Download className='mr-2 h-4 w-4' />
            )}
            Export CSV
          </Button>
          <Button
            variant='outline'
            onClick={() => handleExportReport('pdf')}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <FileText className='mr-2 h-4 w-4' />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(overview.totalSpent)}
            </div>
            <div className='mt-1 flex items-center gap-1'>
              {analytics?.forecast?.growthRate > 0 ? (
                <>
                  <ArrowUp className='h-4 w-4 text-green-500' />
                  <span className='text-xs text-green-500'>
                    +{analytics.forecast.growthRate.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className='h-4 w-4 text-red-500' />
                  <span className='text-xs text-red-500'>
                    {analytics?.forecast?.growthRate.toFixed(1)}%
                  </span>
                </>
              )}
              <span className='text-muted-foreground text-xs'>
                vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Project Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(overview.avgProjectCost)}
            </div>
            <p className='text-muted-foreground text-xs'>
              Across {overview.completedProjects} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {calculateROI().toFixed(1)}%
            </div>
            <p className='text-muted-foreground text-xs'>
              Return on investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics?.successRate.toFixed(1) || 0}%
            </div>
            <p className='text-muted-foreground text-xs'>Project completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <PieChart className='h-5 w-5' />
            Detailed Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='trend' className='space-y-4'>
            <TabsList className='grid w-full grid-cols-5'>
              <TabsTrigger value='trend'>Trend</TabsTrigger>
              <TabsTrigger value='category'>By Category</TabsTrigger>
              <TabsTrigger value='freelancer'>By Freelancer</TabsTrigger>
              <TabsTrigger value='budget'>Budget Usage</TabsTrigger>
              <TabsTrigger value='forecast'>Forecast</TabsTrigger>
            </TabsList>

            <TabsContent value='trend'>
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={analytics?.monthlyTrend || spending.monthly}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' tickFormatter={formatMonth} />
                  <YAxis tickFormatter={value => `$${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='spent'
                    stroke='#8884d8'
                    name='Amount Spent'
                    strokeWidth={2}
                  />
                  <Line
                    type='monotone'
                    dataKey='avgCost'
                    stroke='#82ca9d'
                    name='Avg Cost'
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value='category'>
              <div className='grid gap-4 lg:grid-cols-2'>
                <ResponsiveContainer width='100%' height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.categoryBreakdown || spending.byCategory}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={entry =>
                        `${entry.category}: ${entry.percentage.toFixed(1)}%`
                      }
                      outerRadius={120}
                      fill='#8884d8'
                      dataKey='amount'
                    >
                      {(
                        analytics?.categoryBreakdown || spending.byCategory
                      ).map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className='space-y-2'>
                  <h3 className='mb-3 font-medium'>Category Breakdown</h3>
                  {(analytics?.categoryBreakdown || spending.byCategory).map(
                    (cat: any, index: number) => (
                      <div
                        key={index}
                        className='flex items-center justify-between rounded-lg border p-2'
                      >
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-3 w-3 rounded-full'
                            style={{
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          <span className='font-medium'>{cat.category}</span>
                        </div>
                        <div className='text-right'>
                          <p className='font-bold'>
                            {formatCurrency(cat.amount)}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {cat.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='freelancer'>
              <div className='space-y-4'>
                <ResponsiveContainer width='100%' height={400}>
                  <BarChart data={analytics?.freelancerCosts || []}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='freelancerName' />
                    <YAxis tickFormatter={value => `$${value / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey='totalPaid' fill='#8884d8' name='Total Paid' />
                    <Bar
                      dataKey='avgProjectCost'
                      fill='#82ca9d'
                      name='Avg Project Cost'
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value='budget'>
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Under Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold text-green-500'>
                        {analytics?.budgetUtilization?.underBudget || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        On Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold text-blue-500'>
                        {analytics?.budgetUtilization?.onBudget || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Over Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold text-red-500'>
                        {analytics?.budgetUtilization?.overBudget || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>Projects</p>
                    </CardContent>
                  </Card>
                </div>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: 'Under Budget',
                          value: analytics?.budgetUtilization?.underBudget || 0
                        },
                        {
                          name: 'On Budget',
                          value: analytics?.budgetUtilization?.onBudget || 0
                        },
                        {
                          name: 'Over Budget',
                          value: analytics?.budgetUtilization?.overBudget || 0
                        }
                      ]}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={entry => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      <Cell fill='#10b981' />
                      <Cell fill='#3b82f6' />
                      <Cell fill='#ef4444' />
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value='forecast'>
              <div className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Next Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(
                          analytics?.forecast?.nextMonth ||
                            spending.projections.nextMonth
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Projected spending
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Next Quarter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(
                          analytics?.forecast?.nextQuarter ||
                            spending.projections.quarterEstimate
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Estimated total
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Year End
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(analytics?.forecast?.yearEnd || 0)}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Projected total
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      Growth Projection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center gap-4'>
                      {analytics?.forecast?.growthRate > 0 ? (
                        <TrendingUp className='h-8 w-8 text-green-500' />
                      ) : (
                        <TrendingDown className='h-8 w-8 text-red-500' />
                      )}
                      <div>
                        <p className='text-2xl font-bold'>
                          {analytics?.forecast?.growthRate > 0 ? '+' : ''}
                          {analytics?.forecast?.growthRate.toFixed(1)}%
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Expected growth rate based on current trends
                        </p>
                      </div>
                    </div>
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
