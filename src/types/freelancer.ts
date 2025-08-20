import type { FreelancerProfile } from '@/lib/db/schema/types'

export type { FreelancerProfile }

export interface Freelancer {
  id: number
  name: string
  title: string | null
  activeJobs: number
  totalPaid: number
  avgRating: number
  completionRate: number
}

export interface TopPerformer {
  id: number
  name: string
  title: string | null
  completedJobs: number
  totalEarned: number
  rating: number
}

export interface FreelancerStats {
  totalJobs: number
  completedJobs: number
  activeJobs: number
  totalEarnings: number
  averageRating: number
  completionRate: number
  responseTime: string
}
