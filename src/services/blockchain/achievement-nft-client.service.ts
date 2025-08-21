import { ethers } from 'ethers'

import { ACHIEVEMENT_NFT_ABI, getAchievementNFTAddress } from '@/lib/blockchain'

import { BaseContractClientService } from './base-contract-client.service'
import type {
  AchievementCategory,
  CreateAchievementParams,
  MintAchievementParams,
  Achievement,
  UserAchievement,
  AchievementProgress,
  ContractInfo,
  EventLog
} from './achievement-nft.types'

// Re-export types for backward compatibility
export type {
  CreateAchievementParams,
  MintAchievementParams,
  Achievement,
  UserAchievement,
  AchievementProgress,
  ContractInfo,
  EventLog
}
export { AchievementCategory } from './achievement-nft.types'

// Additional service-specific interfaces not in types file
export interface BatchMintAchievementsParams {
  to: string
  achievementIds: number[]
  progresses: number[]
  earnedAts: number[]
}

export interface UpdateUserProgressParams {
  user: string
  achievementId: number
  progress: number
}

export interface IncrementUserProgressParams {
  user: string
  achievementId: number
  amount: number
}

export interface AchievementMetadata extends Achievement {
  totalMinted: number
}

// ============================================================================
// AchievementNFTService Class (Client-safe version)
// ============================================================================

export class AchievementNFTService extends BaseContractClientService {
  constructor(
    chainId: number,
    signerOrProvider?: ethers.Signer | ethers.Provider
  ) {
    const contractAddress = getAchievementNFTAddress(chainId as any)
    super(
      chainId,
      contractAddress,
      ACHIEVEMENT_NFT_ABI,
      'AchievementNFT',
      signerOrProvider
    )
  }

  // ============================================================================
  // Parameter Preparation
  // ============================================================================

  prepareAchievementParams(
    method: string,
    params: any,
    _responseData?: any
  ): any[] {
    switch (method) {
      case 'createAchievement': {
        const achievementParams = params as CreateAchievementParams
        return [
          BigInt(achievementParams.achievementId),
          achievementParams.name,
          achievementParams.description,
          achievementParams.imageUrl,
          achievementParams.category,
          BigInt(achievementParams.requiredProgress),
          BigInt(achievementParams.xpReward),
          true // isActive
        ]
      }

      case 'mintAchievement': {
        const mintParams = params as MintAchievementParams
        return [
          mintParams.to as `0x${string}`,
          BigInt(mintParams.achievementId),
          BigInt(mintParams.progress),
          BigInt(Date.now())
        ]
      }

      default:
        return []
    }
  }

  // ============================================================================
  // Contract Interaction Methods (Client-safe)
  // ============================================================================

  async getAchievementById(achievementId: number): Promise<Achievement | null> {
    try {
      if (!this.contract) return null
      const result = await this.contract.achievements(BigInt(achievementId))
      if (!result.name) return null
      
      return {
        id: achievementId,
        name: result.name,
        description: result.description,
        imageUrl: result.imageUrl,
        category: Number(result.category) as AchievementCategory,
        requiredProgress: Number(result.requiredProgress),
        xpReward: Number(result.xpReward),
        prerequisiteId: Number(result.prerequisiteId),
        currentSupply: Number(result.currentSupply),
        maxSupply: Number(result.maxSupply),
        isActive: result.isActive
      }
    } catch (error) {
      console.error('Error fetching achievement:', error)
      return null
    }
  }

  async getUserAchievements(userAddress: string): Promise<UserAchievement[]> {
    try {
      if (!this.contract) return []
      const balance = await this.contract.balanceOf(userAddress)
      const achievements: UserAchievement[] = []
      
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await this.contract.tokenOfOwnerByIndex(userAddress, i)
        const achievement = await this.contract.userAchievements(tokenId)
        
        achievements.push({
          tokenId: Number(tokenId),
          achievementId: Number(achievement.achievementId),
          progress: Number(achievement.progress),
          mintedAt: Number(achievement.mintedAt)
        })
      }
      
      return achievements
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      return []
    }
  }

  async getAchievementContractInfo(): Promise<ContractInfo> {
    try {
      if (!this.contract) throw new Error('Contract not initialized')
      const [address, paused, owner, nextId, totalSupply] = await Promise.all([
        this.contract.getAddress(),
        this.contract.paused(),
        this.contract.owner(),
        this.contract.nextAchievementId(),
        this.contract.totalSupply()
      ])
      
      const balance = this.provider ? await this.provider.getBalance(address) : BigInt(0)
      
      return {
        address,
        paused,
        owner,
        nextAchievementId: Number(nextId),
        totalSupply: Number(totalSupply),
        balance: ethers.formatEther(balance)
      }
    } catch (error) {
      console.error('Error fetching contract info:', error)
      throw error
    }
  }
}

// Helper function for easy import (client-safe)
export async function mintAchievementNFT(
  to: string,
  achievementId: number | string,
  progress: number = 100
): Promise<{ tokenId?: number; txHash?: string }> {
  try {
    // Client-side: call the API endpoint directly
    const response = await fetch('/api/achievements/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        achievementId,
        progress
      })
    })
    
    const data = await response.json()
    return {
      tokenId: data.tokenId,
      txHash: data.txHash
    }
  } catch (error) {
    console.error('Error minting achievement:', error)
    return {}
  }
}