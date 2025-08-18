import { ethers } from 'ethers'

import {
  REPUTATION_REGISTRY_ABI,
  getReputationRegistryAddress
} from '@/lib/blockchain'

import { BaseContractClientService } from './base-contract-client.service'

// ============================================================================
// Interfaces
// ============================================================================

export interface UpdateReputationParams {
  user: string
  rating: number
  isFreelancer: boolean
}

export interface EndorseSkillParams {
  user: string
  skillName: string
  rating: number
}

export interface ReputationScore {
  averageScore: number
  reviewCount: number
  endorsementCount: number
}

export interface TrustScore {
  score: number
  level: number
}

export interface SkillEndorsement {
  skillName: string
  rating: number
  endorser: string
  timestamp: bigint
}

// ============================================================================
// ReputationRegistryService Class
// ============================================================================

export class ReputationRegistryService extends BaseContractClientService {
  constructor(
    chainId: number,
    signerOrProvider?: ethers.Signer | ethers.Provider
  ) {
    const contractAddress = getReputationRegistryAddress(chainId as any)
    super(
      chainId,
      contractAddress,
      REPUTATION_REGISTRY_ABI,
      'ReputationRegistry',
      signerOrProvider
    )
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Get reputation score for a user
   */
  async getReputationScore(
    userAddress: string
  ): Promise<ReputationScore | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const result = await this.contract.getReputationScore(userAddress)
      return {
        averageScore: Number(result[0]),
        reviewCount: Number(result[1]),
        endorsementCount: Number(result[2])
      }
    } catch (error) {
      console.error('Error fetching reputation score:', error)
      return null
    }
  }

  /**
   * Get trust score for a user
   */
  async getTrustScore(userAddress: string): Promise<TrustScore | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const result = await this.contract.getTrustScore(userAddress)
      return {
        score: Number(result[0]),
        level: Number(result[1])
      }
    } catch (error) {
      console.error('Error fetching trust score:', error)
      return null
    }
  }

  /**
   * Check if user has reputation NFT
   */
  async hasReputationNFT(userAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      return await this.contract.hasReputationNFT(userAddress)
    } catch (error) {
      console.error('Error checking reputation NFT:', error)
      return false
    }
  }

  /**
   * Get skill endorsements for a user
   */
  async getSkillEndorsements(userAddress: string): Promise<SkillEndorsement[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const endorsements = await this.contract.getSkillEndorsements(userAddress)
      return endorsements.map((e: any) => ({
        skillName: e.skillName,
        rating: Number(e.rating),
        endorser: e.endorser,
        timestamp: e.timestamp
      }))
    } catch (error) {
      console.error('Error fetching skill endorsements:', error)
      return []
    }
  }

  /**
   * Get skill rating for a specific skill
   */
  async getSkillRating(
    userAddress: string,
    skillName: string
  ): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const rating = await this.contract.getSkillRating(userAddress, skillName)
      return Number(rating)
    } catch (error) {
      console.error('Error fetching skill rating:', error)
      return 0
    }
  }

  /**
   * Get decay rate
   */
  async getDecayRate(): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const rate = await this.contract.decayRate()
      return Number(rate)
    } catch (error) {
      console.error('Error fetching decay rate:', error)
      return 0
    }
  }

  /**
   * Get decay period in seconds
   */
  async getDecayPeriod(): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const period = await this.contract.decayPeriod()
      return Number(period)
    } catch (error) {
      console.error('Error fetching decay period:', error)
      return 0
    }
  }

  /**
   * Check if reputation needs decay
   */
  async needsDecay(userAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      return await this.contract.needsDecay(userAddress)
    } catch (error) {
      console.error('Error checking decay need:', error)
      return false
    }
  }

  // ============================================================================
  // Write Methods (Transaction Configs)
  // ============================================================================

  /**
   * Update reputation transaction config
   */
  updateReputationConfig(params: UpdateReputationParams) {
    return this.getTransactionConfig('updateReputation', [
      params.user,
      BigInt(params.rating),
      params.isFreelancer
    ])
  }

  /**
   * Endorse skill transaction config
   */
  endorseSkillConfig(params: EndorseSkillParams) {
    return this.getTransactionConfig('endorseSkill', [
      params.user,
      params.skillName,
      BigInt(params.rating)
    ])
  }

  /**
   * Apply reputation decay transaction config
   */
  applyDecayConfig(userAddress: string) {
    return this.getTransactionConfig('applyDecay', [userAddress])
  }

  /**
   * Batch update reputations transaction config
   */
  batchUpdateReputationsConfig(
    users: string[],
    ratings: number[],
    areFreelancers: boolean[]
  ) {
    return this.getTransactionConfig('batchUpdateReputations', [
      users,
      ratings.map(r => BigInt(r)),
      areFreelancers
    ])
  }

  /**
   * Mint reputation NFT transaction config
   */
  mintReputationNFTConfig(userAddress: string) {
    return this.getTransactionConfig('mintReputationNFT', [userAddress])
  }

  /**
   * Set decay parameters transaction config (admin only)
   */
  setDecayParametersConfig(rate: number, period: number) {
    return this.getTransactionConfig('setDecayParameters', [
      BigInt(rate),
      BigInt(period)
    ])
  }

  // ============================================================================
  // Event Methods
  // ============================================================================

  /**
   * Get reputation updated events
   */
  async getReputationUpdatedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('ReputationUpdated', fromBlock, toBlock)
  }

  /**
   * Get skill endorsed events
   */
  async getSkillEndorsedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('SkillEndorsed', fromBlock, toBlock)
  }

  /**
   * Get reputation decayed events
   */
  async getReputationDecayedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('ReputationDecayed', fromBlock, toBlock)
  }

  /**
   * Get reputation NFT minted events
   */
  async getReputationNFTMintedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('ReputationNFTMinted', fromBlock, toBlock)
  }

  /**
   * Get trust level upgraded events
   */
  async getTrustLevelUpgradedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('TrustLevelUpgraded', fromBlock, toBlock)
  }
}
