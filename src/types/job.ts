import type { JobPosting, JobMilestone, JobBid } from '@/lib/db/schema/types'

export type { JobPosting, JobMilestone, JobBid }

export interface Job {
  id: number
  title: string
  status: string
  clientName: string
  totalMilestones: number
  completedMilestones: number
  nextMilestone: string | null
  nextMilestoneDate: Date | null
}

export interface MilestoneStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
}

export interface JobStats {
  activeJobs: number
  completedJobs: number
  totalEarnings: number
  averageRating: number
}

export interface JobFilters {
  status?: string
  categoryId?: number
  minBudget?: number
  maxBudget?: number
  searchTerm?: string
  freelancerId?: number
  clientId?: number
  page?: number
  limit?: number
}
