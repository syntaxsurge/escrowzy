// ============================================================================
// Achievement NFT Types
// ============================================================================

export enum AchievementCategory {
  TRADING = 0,
  VOLUME = 1,
  STREAK = 2,
  SPECIAL = 3,
  LEVEL = 4,
  BATTLE = 5
}

// ============================================================================
// Interfaces
// ============================================================================

export interface CreateAchievementParams {
  achievementId: number
  name: string
  description: string
  imageUrl: string
  category: AchievementCategory
  requiredProgress: number
  xpReward: number
  prerequisiteId?: number
}

export interface MintAchievementParams {
  to: string
  achievementId: number
  progress: number
}

export interface Achievement {
  id: number
  name: string
  description: string
  imageUrl: string
  category: AchievementCategory
  requiredProgress: number
  xpReward: number
  prerequisiteId: number
  currentSupply: number
  maxSupply: number
  isActive: boolean
}

export interface UserAchievement {
  tokenId: number
  achievementId: number
  progress: number
  mintedAt: number
  achievement?: Achievement
}

export interface AchievementProgress {
  achievementId: number
  userProgress: number
  requiredProgress: number
  isComplete: boolean
}

export interface ContractInfo {
  address: string
  paused: boolean
  owner: string
  nextAchievementId: number
  totalSupply: number
  balance: string
}

export interface EventLog {
  event: string
  args: any
  blockNumber: number
  transactionHash: string
  timestamp?: number
}