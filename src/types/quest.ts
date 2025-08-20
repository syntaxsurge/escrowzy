export interface Quest {
  id: string
  name: string
  description: string
  type?: 'daily' | 'weekly' | 'special'
  category?: string
  icon?: string
  xpReward: number
  requirements?: {
    type: string
    target: number
    current: number
  }
  progress?: {
    current: number
    required: number
  }
  isCompleted?: boolean
  isClaimable?: boolean
  completed?: boolean
  claimed?: boolean
  expiresAt?: string
}

export interface QuestProgress {
  questId: string
  userId: number
  progress: number
  completed: boolean
  claimedAt?: Date
}
