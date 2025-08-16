import { NextRequest, NextResponse } from 'next/server'

import {
  getEarningsByClient,
  getEarningsByPeriod,
  getEarningsByProject,
  getFreelancerEarningsSummary,
  getMilestonePayments,
  getPaymentHistory
} from '@/lib/db/queries/earnings'
import { getUser } from '@/services/user'

// GET /api/freelancers/[id]/earnings - Get detailed earnings data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') as
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const view = searchParams.get('view') || 'summary'

    // Parse dates if provided
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    switch (view) {
      case 'summary':
        const summary = await getFreelancerEarningsSummary(freelancerId)
        return NextResponse.json({
          success: true,
          data: summary
        })

      case 'period':
        if (!period) {
          return NextResponse.json(
            { success: false, error: 'Period parameter is required' },
            { status: 400 }
          )
        }
        const periodData = await getEarningsByPeriod(
          freelancerId,
          period,
          start,
          end
        )
        return NextResponse.json({
          success: true,
          data: periodData
        })

      case 'clients':
        const limit = parseInt(searchParams.get('limit') || '10')
        const clientData = await getEarningsByClient(freelancerId, limit)
        return NextResponse.json({
          success: true,
          data: clientData
        })

      case 'projects':
        const status = searchParams.get('status') as
          | 'all'
          | 'completed'
          | 'in_progress'
          | null
        const projectData = await getEarningsByProject(
          freelancerId,
          status || 'all'
        )
        return NextResponse.json({
          success: true,
          data: projectData
        })

      case 'milestones':
        const milestoneLimit = parseInt(searchParams.get('limit') || '20')
        const milestoneData = await getMilestonePayments(
          freelancerId,
          milestoneLimit
        )
        return NextResponse.json({
          success: true,
          data: milestoneData
        })

      case 'history':
        const historyFilters = {
          startDate: start,
          endDate: end,
          status: searchParams.get('status') || undefined,
          clientId: searchParams.get('clientId')
            ? parseInt(searchParams.get('clientId')!)
            : undefined,
          minAmount: searchParams.get('minAmount')
            ? parseFloat(searchParams.get('minAmount')!)
            : undefined,
          maxAmount: searchParams.get('maxAmount')
            ? parseFloat(searchParams.get('maxAmount')!)
            : undefined
        }
        const historyData = await getPaymentHistory(
          freelancerId,
          historyFilters
        )
        return NextResponse.json({
          success: true,
          data: historyData
        })

      case 'all':
        // Return comprehensive earnings data
        const [
          allSummary,
          allPeriodData,
          allClientData,
          allProjectData,
          allMilestoneData
        ] = await Promise.all([
          getFreelancerEarningsSummary(freelancerId),
          period
            ? getEarningsByPeriod(freelancerId, period, start, end)
            : Promise.resolve([]),
          getEarningsByClient(freelancerId, 5),
          getEarningsByProject(freelancerId, 'all'),
          getMilestonePayments(freelancerId, 10)
        ])

        return NextResponse.json({
          success: true,
          data: {
            summary: allSummary,
            periodData: allPeriodData,
            topClients: allClientData,
            projects: allProjectData.slice(0, 10),
            recentMilestones: allMilestoneData
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid view parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching earnings data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}
