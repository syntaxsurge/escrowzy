'use client'

import { useState } from 'react'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
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
  Title,
  Tooltip,
  Legend
)

interface PerformanceChartProps {
  freelancerId: number
}

export function PerformanceChart({ freelancerId }: PerformanceChartProps) {
  const [period, setPeriod] = useState('monthly')
  const [chartType, setChartType] = useState('earnings')

  const { data: analyticsData } = useSWR(
    `/api/freelancers/${freelancerId}/analytics?period=180`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : null
    }
  )

  if (!analyticsData) return null

  const earningsChartData = {
    labels: analyticsData.performanceTrends.map((t: any) => t.month),
    datasets: [
      {
        label: 'Earnings',
        data: analyticsData.performanceTrends.map((t: any) => t.earnings),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)'
      }
    ]
  }

  const projectsChartData = {
    labels: analyticsData.performanceTrends.map((t: any) => t.month),
    datasets: [
      {
        label: 'Started',
        data: analyticsData.performanceTrends.map(
          (t: any) => t.projectsStarted
        ),
        backgroundColor: 'rgba(59, 130, 246, 0.5)'
      },
      {
        label: 'Completed',
        data: analyticsData.performanceTrends.map(
          (t: any) => t.projectsCompleted
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
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Performance Trends</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='weekly'>Weekly</SelectItem>
              <SelectItem value='monthly'>Monthly</SelectItem>
              <SelectItem value='yearly'>Yearly</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={chartType} onValueChange={setChartType}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='earnings'>Earnings</TabsTrigger>
            <TabsTrigger value='projects'>Projects</TabsTrigger>
          </TabsList>
          <TabsContent value='earnings' className='h-[300px]'>
            <Line data={earningsChartData} options={chartOptions} />
          </TabsContent>
          <TabsContent value='projects' className='h-[300px]'>
            <Bar data={projectsChartData} options={chartOptions} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
