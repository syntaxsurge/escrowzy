'use client'

import { useState } from 'react'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  ArcElement
} from 'chart.js'
import { Bar, Doughnut, Radar } from 'react-chartjs-2'
import useSWR from 'swr'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/http-client'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsChartsProps {
  freelancerId: number
}

export function AnalyticsCharts({ freelancerId }: AnalyticsChartsProps) {
  const [period, setPeriod] = useState('30')

  const { data: analyticsData } = useSWR(
    `/api/freelancers/${freelancerId}/analytics?period=${period}`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : null
    }
  )

  const { data: earningsData } = useSWR(
    `/api/freelancers/${freelancerId}/earnings?view=clients&limit=5`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : []
    }
  )

  if (!analyticsData) return null

  // Skill Performance Radar Chart
  const skillChartData = {
    labels: analyticsData.skillPerformance
      .slice(0, 6)
      .map((s: any) => s.skillName),
    datasets: [
      {
        label: 'Projects',
        data: analyticsData.skillPerformance
          .slice(0, 6)
          .map((s: any) => s.projectsUsed),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2
      },
      {
        label: 'Earnings ($100s)',
        data: analyticsData.skillPerformance
          .slice(0, 6)
          .map((s: any) => s.earnings / 100),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      }
    ]
  }

  // Client Distribution Pie Chart
  const clientChartData = {
    labels: earningsData?.map((c: any) => c.clientName) || [],
    datasets: [
      {
        data: earningsData?.map((c: any) => c.totalEarnings) || [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ]
      }
    ]
  }

  // Conversion Funnel Chart
  const funnelData = analyticsData.proposalFunnel
  const conversionChartData = {
    labels: ['Sent', 'Viewed', 'Shortlisted', 'Accepted', 'Completed'],
    datasets: [
      {
        label: 'Proposals',
        data: [
          funnelData.totalProposals,
          funnelData.viewedProposals,
          funnelData.shortlistedProposals,
          funnelData.acceptedProposals,
          funnelData.completedProjects
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.5)'
      }
    ]
  }

  // Category Performance Chart
  const categoryChartData = {
    labels: analyticsData.categoryPerformance.map((c: any) => c.categoryName),
    datasets: [
      {
        label: 'Projects',
        data: analyticsData.categoryPerformance.map((c: any) => c.projectCount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)'
      },
      {
        label: 'Earnings ($)',
        data: analyticsData.categoryPerformance.map(
          (c: any) => c.totalEarnings
        ),
        backgroundColor: 'rgba(34, 197, 94, 0.5)'
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      }
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Analytics Dashboard</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7'>7 days</SelectItem>
            <SelectItem value='30'>30 days</SelectItem>
            <SelectItem value='90'>90 days</SelectItem>
            <SelectItem value='180'>6 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue='skills' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='skills'>Skills</TabsTrigger>
          <TabsTrigger value='clients'>Clients</TabsTrigger>
          <TabsTrigger value='conversion'>Conversion</TabsTrigger>
          <TabsTrigger value='categories'>Categories</TabsTrigger>
        </TabsList>

        <TabsContent value='skills'>
          <Card>
            <CardHeader>
              <CardTitle>Skill Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[400px]'>
                <Radar data={skillChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='clients'>
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[400px]'>
                <Doughnut data={clientChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='conversion'>
          <Card>
            <CardHeader>
              <CardTitle>Proposal Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[400px]'>
                <Bar data={conversionChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='categories'>
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[400px]'>
                <Bar data={categoryChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Key Metrics Summary */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>
              {analyticsData.responseTimeAnalysis?.avgResponseTime?.toFixed(
                1
              ) || 0}
              h
            </p>
            <p className='text-muted-foreground text-xs'>
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>
              #
              {analyticsData.competitionAnalysis?.positionInBids?.toFixed(0) ||
                0}
            </p>
            <p className='text-muted-foreground text-xs'>
              Avg position in bids
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>
              {analyticsData.reviewAnalysis?.wouldHireAgainRate?.toFixed(0) ||
                0}
              %
            </p>
            <p className='text-muted-foreground text-xs'>Would hire again</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
