// Export all blockchain service classes
export { AchievementNFTService } from './achievement-nft.service'
export { BaseContractClientService } from './base-contract-client.service'
export { EscrowCoreService } from './escrow-core.service'
export { MilestoneEscrowService } from './milestone-escrow.service'
export { ReputationRegistryService } from './reputation-registry.service'
export { SubscriptionManagerService } from './subscription-manager.service'

// Export enums and types
export type { TransactionConfig } from './base-contract-client.service'
export { EscrowStatus } from './escrow-core.service'
export type {
  CreateEscrowParams,
  FundEscrowParams,
  MarkDeliveredParams,
  ConfirmDeliveryParams,
  RaiseDisputeParams,
  ResolveDisputeParams,
  CancelEscrowParams,
  BatchCreateEscrowsParams,
  EscrowDetails
} from './escrow-core.service'
export { MilestoneStatus } from './milestone-escrow.service'
export type {
  CreateMilestoneParams,
  FundMilestoneParams,
  StartMilestoneParams,
  SubmitMilestoneParams,
  ApproveMilestoneParams,
  RejectMilestoneParams,
  DisputeMilestoneParams,
  MilestoneDetails
} from './milestone-escrow.service'
export type {
  UpdateReputationParams,
  EndorseSkillParams,
  ReputationScore,
  TrustScore,
  SkillEndorsement
} from './reputation-registry.service'
export type {
  CreatePlanParams,
  UpdatePlanParams,
  DeletePlanParams,
  WithdrawEarningsParams,
  SetPlanPriceParams,
  ContractPlan,
  ContractEarnings
} from './subscription-manager.service'
export { AchievementCategory } from './achievement-nft.service'
export type {
  CreateAchievementParams,
  MintAchievementParams,
  BatchMintAchievementsParams,
  UpdateUserProgressParams,
  IncrementUserProgressParams,
  AchievementMetadata,
  UserAchievement
} from './achievement-nft.service'
