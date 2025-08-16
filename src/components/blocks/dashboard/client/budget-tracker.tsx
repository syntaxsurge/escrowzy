'use client'

import { useMemo } from 'react'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BudgetTrackerProps {
  totalSpent: number
  pendingPayments: number
  monthlySpending: Array<{
    month: string
    amount: number
    projectCount: number
  }>
  projections: {
    currentMonth: number
    nextMonth: number
    quarterEstimate: number
  }
}

export function BudgetTracker({
  totalSpent,
  pendingPayments,
  monthlySpending,
  projections
}: BudgetTrackerProps) {
  const chartData = useMemo(() => {
    return monthlySpending.map(item => ({
      month: item.month,
      spent: item.amount,
      projects: item.projectCount,
      avgCost: item.projectCount > 0 ? item.amount / item.projectCount : 0
    }))
  }, [monthlySpending])

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

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(totalSpent)}
            </div>
            <p className='text-muted-foreground text-xs'>All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-600'>
              {formatCurrency(pendingPayments)}
            </div>
            <p className='text-muted-foreground text-xs'>Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(projections.currentMonth)}
            </div>
            <p className='text-muted-foreground text-xs'>Projected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Next Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(projections.quarterEstimate)}
            </div>
            <p className='text-muted-foreground text-xs'>Estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='trend' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='trend'>Spending Trend</TabsTrigger>
              <TabsTrigger value='projects'>Projects vs Cost</TabsTrigger>
              <TabsTrigger value='average'>Average Cost</TabsTrigger>
            </TabsList>

            <TabsContent value='trend' className='space-y-4'>
              <ResponsiveContainer width='100%' height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id='colorSpent' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#8884d8' stopOpacity={0.8} />
                      <stop offset='95%' stopColor='#8884d8' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' tickFormatter={formatMonth} />
                  <YAxis tickFormatter={value => `$${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={label => `Month: ${formatMonth(label)}`}
                  />
                  <Area
                    type='monotone'
                    dataKey='spent'
                    stroke='#8884d8'
                    fillOpacity={1}
                    fill='url(#colorSpent)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value='projects' className='space-y-4'>
              <ResponsiveContainer width='100%' height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' tickFormatter={formatMonth} />
                  <YAxis
                    yAxisId='left'
                    tickFormatter={value => `$${value / 1000}k`}
                  />
                  <YAxis yAxisId='right' orientation='right' />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'spent') return formatCurrency(value)
                      return value
                    }}
                    labelFormatter={label => `Month: ${formatMonth(label)}`}
                  />
                  <Legend />
                  <Bar
                    yAxisId='left'
                    dataKey='spent'
                    fill='#8884d8'
                    name='Amount Spent'
                  />
                  <Bar
                    yAxisId='right'
                    dataKey='projects'
                    fill='#82ca9d'
                    name='Projects'
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value='average' className='space-y-4'>
              <ResponsiveContainer width='100%' height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' tickFormatter={formatMonth} />
                  <YAxis tickFormatter={value => `$${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={label => `Month: ${formatMonth(label)}`}
                  />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='avgCost'
                    stroke='#ff7300'
                    name='Avg Cost per Project'
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
