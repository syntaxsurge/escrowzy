import { ethers } from 'ethers'

import {
  MILESTONE_ESCROW_ABI,
  getMilestoneEscrowAddress
} from '@/lib/blockchain'

import { BaseContractClientService } from './base-contract-client.service'

// ============================================================================
// Enums and Types
// ============================================================================

export enum MilestoneStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  SUBMITTED = 2,
  APPROVED = 3,
  REJECTED = 4,
  DISPUTED = 5,
  CANCELLED = 6
}

// ============================================================================
// Interfaces
// ============================================================================

export interface CreateMilestoneParams {
  jobId: number
  seller: string
  amount: string
  deadline: number
  description: string
  requiresApproval?: boolean
}

export interface FundMilestoneParams {
  milestoneId: number
}

export interface StartMilestoneParams {
  milestoneId: number
}

export interface SubmitMilestoneParams {
  milestoneId: number
  deliverables: string
}

export interface ApproveMilestoneParams {
  milestoneId: number
}

export interface RejectMilestoneParams {
  milestoneId: number
  reason: string
}

export interface DisputeMilestoneParams {
  milestoneId: number
  reason: string
}

export interface ResolveDisputeParams {
  milestoneId: number
  refundBuyer: boolean
  buyerAmount: bigint
  sellerAmount: bigint
}

export interface CancelMilestoneParams {
  milestoneId: number
}

export interface MilestoneDetails {
  jobId: bigint
  buyer: string
  seller: string
  amount: bigint
  status: MilestoneStatus
  deadline: bigint
  description: string
  deliverables: string
  requiresApproval: boolean
  createdAt: bigint
  fundedAt: bigint
  completedAt: bigint
}

// ============================================================================
// MilestoneEscrowService Class
// ============================================================================

export class MilestoneEscrowService extends BaseContractClientService {
  constructor(
    chainId: number,
    signerOrProvider?: ethers.Signer | ethers.Provider
  ) {
    const contractAddress = getMilestoneEscrowAddress(chainId as any)
    super(
      chainId,
      contractAddress,
      MILESTONE_ESCROW_ABI,
      'MilestoneEscrow',
      signerOrProvider
    )
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Get milestone details
   */
  async getMilestone(milestoneId: number): Promise<MilestoneDetails | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const milestone = await this.contract.getMilestone(milestoneId)
      return {
        jobId: milestone.jobId,
        buyer: milestone.buyer,
        seller: milestone.seller,
        amount: milestone.amount,
        status: milestone.status as MilestoneStatus,
        deadline: milestone.deadline,
        description: milestone.description,
        deliverables: milestone.deliverables,
        requiresApproval: milestone.requiresApproval,
        createdAt: milestone.createdAt,
        fundedAt: milestone.fundedAt,
        completedAt: milestone.completedAt
      }
    } catch (error) {
      console.error('Error fetching milestone:', error)
      return null
    }
  }

  /**
   * Get all milestones for a job
   */
  async getJobMilestones(jobId: number): Promise<bigint[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      return await this.contract.getJobMilestones(jobId)
    } catch (error) {
      console.error('Error fetching job milestones:', error)
      return []
    }
  }

  /**
   * Get milestone count for a job
   */
  async getJobMilestoneCount(jobId: number): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const count = await this.contract.getJobMilestoneCount(jobId)
      return Number(count)
    } catch (error) {
      console.error('Error fetching milestone count:', error)
      return 0
    }
  }

  /**
   * Check if milestone is funded
   */
  async isMilestoneFunded(milestoneId: number): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      return await this.contract.isMilestoneFunded(milestoneId)
    } catch (error) {
      console.error('Error checking milestone funding:', error)
      return false
    }
  }

  /**
   * Check if milestone can be released
   */
  async canReleaseMilestone(milestoneId: number): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      return await this.contract.canReleaseMilestone(milestoneId)
    } catch (error) {
      console.error('Error checking milestone release:', error)
      return false
    }
  }

  /**
   * Get platform fee percentage
   */
  async getFeePercentage(): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const fee = await this.contract.feePercentage()
      return Number(fee)
    } catch (error) {
      console.error('Error fetching fee percentage:', error)
      return 0
    }
  }

  /**
   * Check if auto-release is enabled
   */
  async isAutoReleaseEnabled(): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      return await this.contract.autoReleaseEnabled()
    } catch (error) {
      console.error('Error checking auto-release:', error)
      return false
    }
  }

  /**
   * Get auto-release period in seconds
   */
  async getAutoReleasePeriod(): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }
      const period = await this.contract.autoReleasePeriod()
      return Number(period)
    } catch (error) {
      console.error('Error fetching auto-release period:', error)
      return 0
    }
  }

  // ============================================================================
  // Write Methods (Transaction Configs)
  // ============================================================================

  /**
   * Create milestone transaction config
   */
  createMilestoneConfig(params: CreateMilestoneParams) {
    return this.getTransactionConfig('createMilestone', [
      params.jobId,
      params.seller,
      ethers.parseEther(params.amount),
      params.deadline,
      params.description,
      params.requiresApproval ?? true
    ])
  }

  /**
   * Fund milestone transaction config
   */
  fundMilestoneConfig(params: FundMilestoneParams, value: string) {
    return this.getTransactionConfig(
      'fundMilestone',
      [params.milestoneId],
      ethers.parseEther(value)
    )
  }

  /**
   * Start milestone transaction config
   */
  startMilestoneConfig(params: StartMilestoneParams) {
    return this.getTransactionConfig('startMilestone', [params.milestoneId])
  }

  /**
   * Submit milestone transaction config
   */
  submitMilestoneConfig(params: SubmitMilestoneParams) {
    return this.getTransactionConfig('submitMilestone', [
      params.milestoneId,
      params.deliverables
    ])
  }

  /**
   * Approve milestone transaction config
   */
  approveMilestoneConfig(params: ApproveMilestoneParams) {
    return this.getTransactionConfig('approveMilestone', [params.milestoneId])
  }

  /**
   * Reject milestone transaction config
   */
  rejectMilestoneConfig(params: RejectMilestoneParams) {
    return this.getTransactionConfig('rejectMilestone', [
      params.milestoneId,
      params.reason
    ])
  }

  /**
   * Dispute milestone transaction config
   */
  disputeMilestoneConfig(params: DisputeMilestoneParams) {
    return this.getTransactionConfig('disputeMilestone', [
      params.milestoneId,
      params.reason
    ])
  }

  /**
   * Resolve dispute transaction config
   */
  resolveDisputeConfig(params: ResolveDisputeParams) {
    return this.getTransactionConfig('resolveDispute', [
      params.milestoneId,
      params.refundBuyer,
      params.buyerAmount,
      params.sellerAmount
    ])
  }

  /**
   * Cancel milestone transaction config
   */
  cancelMilestoneConfig(params: CancelMilestoneParams) {
    return this.getTransactionConfig('cancelMilestone', [params.milestoneId])
  }

  /**
   * Auto-release eligible milestones transaction config
   */
  autoReleaseEligibleMilestonesConfig(milestoneIds: number[]) {
    return this.getTransactionConfig('autoReleaseEligibleMilestones', [
      milestoneIds
    ])
  }

  // ============================================================================
  // Event Methods
  // ============================================================================

  /**
   * Get milestone created events
   */
  async getMilestoneCreatedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('MilestoneCreated', fromBlock, toBlock)
  }

  /**
   * Get milestone funded events
   */
  async getMilestoneFundedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('MilestoneFunded', fromBlock, toBlock)
  }

  /**
   * Get milestone completed events
   */
  async getMilestoneCompletedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('MilestoneCompleted', fromBlock, toBlock)
  }

  /**
   * Get milestone disputed events
   */
  async getMilestoneDisputedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('MilestoneDisputed', fromBlock, toBlock)
  }

  /**
   * Get dispute resolved events
   */
  async getDisputeResolvedEvents(
    fromBlock?: bigint | 'earliest',
    toBlock?: bigint | 'latest'
  ) {
    return this.getContractEvents('DisputeResolved', fromBlock, toBlock)
  }
}
