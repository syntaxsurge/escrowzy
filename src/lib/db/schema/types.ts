// Re-export ActivityType enum from constants
export { ActivityType } from '@/lib/constants/activity-types'

// Import all tables
import {
  users,
  sessions,
  teams,
  teamMembers,
  activityLogs,
  teamInvitations,
  apiKeys
} from './core'
import {
  jobCategories,
  skills,
  freelancerProfiles,
  profileDrafts,
  freelancerSkills,
  portfolioItems,
  savedJobs,
  invoices
} from './freelance-core'
import {
  userGameData,
  achievementNFTs,
  platformContracts,
  battles,
  battleStates,
  battleRounds,
  battleQueue,
  battleInvitations,
  battleSessionRejections,
  userTradingStats
} from './gamification'
import {
  jobPostings,
  jobMilestones,
  jobBids,
  bidTemplates,
  jobInvitations,
  savedSearches,
  jobAlerts,
  interviews
} from './jobs'
import {
  referralCampaigns,
  referralLinks,
  referralConversions,
  partners,
  partnerCommissions,
  blogPosts,
  blogComments,
  socialShares
} from './marketing'
import {
  emailVerificationRequests,
  messages,
  messageReads,
  attachments
} from './messaging'
import {
  paymentHistory,
  userSubscriptions,
  adminSettings,
  earnings,
  withdrawals,
  paymentReminders,
  taxDocuments
} from './payments'
import {
  freelancerReviews,
  clientReviews,
  reviewDisputes,
  skillEndorsements,
  verificationBadges,
  reputationRegistry,
  reputationNFTs
} from './reputation'
import {
  onboardingSteps,
  onboardingProgress,
  tutorials,
  tutorialProgress,
  faqCategories,
  faqItems,
  faqVotes,
  helpArticles,
  videoTutorials,
  videoProgress,
  tooltipContent
} from './support'
import { jobQueue, scheduledTasks, scheduledTaskRuns } from './system'
import { trades, escrowListings } from './trading'
import {
  workspaceSessions,
  jobTasks,
  fileVersions,
  timeTracking,
  fileAnnotations,
  deliveryPackages,
  workspaceEvents,
  milestoneRevisions,
  milestoneChats
} from './workspace'

// Core types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type TeamInvitation = typeof teamInvitations.$inferSelect
export type NewTeamInvitation = typeof teamInvitations.$inferInsert
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert

// Payment types
export type PaymentHistory = typeof paymentHistory.$inferSelect
export type NewPaymentHistory = typeof paymentHistory.$inferInsert
export type UserSubscription = typeof userSubscriptions.$inferSelect
export type NewUserSubscription = typeof userSubscriptions.$inferInsert
export type AdminSetting = typeof adminSettings.$inferSelect
export type NewAdminSetting = typeof adminSettings.$inferInsert
export type Earning = typeof earnings.$inferSelect
export type NewEarning = typeof earnings.$inferInsert
export type Withdrawal = typeof withdrawals.$inferSelect
export type NewWithdrawal = typeof withdrawals.$inferInsert
export type PaymentReminder = typeof paymentReminders.$inferSelect
export type NewPaymentReminder = typeof paymentReminders.$inferInsert
export type TaxDocument = typeof taxDocuments.$inferSelect
export type NewTaxDocument = typeof taxDocuments.$inferInsert

// Messaging types
export type EmailVerificationRequest =
  typeof emailVerificationRequests.$inferSelect
export type NewEmailVerificationRequest =
  typeof emailVerificationRequests.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type MessageRead = typeof messageReads.$inferSelect
export type NewMessageRead = typeof messageReads.$inferInsert
export type Attachment = typeof attachments.$inferSelect
export type NewAttachment = typeof attachments.$inferInsert

// Gamification types
export type UserGameData = typeof userGameData.$inferSelect
export type NewUserGameData = typeof userGameData.$inferInsert
export type AchievementNFT = typeof achievementNFTs.$inferSelect
export type NewAchievementNFT = typeof achievementNFTs.$inferInsert
export type PlatformContract = typeof platformContracts.$inferSelect
export type NewPlatformContract = typeof platformContracts.$inferInsert
export type Battle = typeof battles.$inferSelect
export type NewBattle = typeof battles.$inferInsert
export type BattleState = typeof battleStates.$inferSelect
export type NewBattleState = typeof battleStates.$inferInsert
export type BattleRound = typeof battleRounds.$inferSelect
export type NewBattleRound = typeof battleRounds.$inferInsert
export type BattleQueue = typeof battleQueue.$inferSelect
export type NewBattleQueue = typeof battleQueue.$inferInsert
export type BattleInvitation = typeof battleInvitations.$inferSelect
export type NewBattleInvitation = typeof battleInvitations.$inferInsert
export type BattleSessionRejection = typeof battleSessionRejections.$inferSelect
export type NewBattleSessionRejection =
  typeof battleSessionRejections.$inferInsert
export type UserTradingStat = typeof userTradingStats.$inferSelect
export type NewUserTradingStat = typeof userTradingStats.$inferInsert
export type UserTradingStats = typeof userTradingStats.$inferSelect // alias for backward compatibility

// Trading types
export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert
export type EscrowListing = typeof escrowListings.$inferSelect
export type NewEscrowListing = typeof escrowListings.$inferInsert

// Freelance core types
export type JobCategory = typeof jobCategories.$inferSelect
export type NewJobCategory = typeof jobCategories.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type FreelancerProfile = typeof freelancerProfiles.$inferSelect
export type NewFreelancerProfile = typeof freelancerProfiles.$inferInsert
export type ProfileDraft = typeof profileDrafts.$inferSelect
export type NewProfileDraft = typeof profileDrafts.$inferInsert
export type FreelancerSkill = typeof freelancerSkills.$inferSelect
export type NewFreelancerSkill = typeof freelancerSkills.$inferInsert
export type PortfolioItem = typeof portfolioItems.$inferSelect
export type NewPortfolioItem = typeof portfolioItems.$inferInsert
export type SavedJob = typeof savedJobs.$inferSelect
export type NewSavedJob = typeof savedJobs.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert

// Job types
export type JobPosting = typeof jobPostings.$inferSelect
export type NewJobPosting = typeof jobPostings.$inferInsert
export type JobMilestone = typeof jobMilestones.$inferSelect
export type NewJobMilestone = typeof jobMilestones.$inferInsert
export type JobBid = typeof jobBids.$inferSelect
export type NewJobBid = typeof jobBids.$inferInsert
export type BidTemplate = typeof bidTemplates.$inferSelect
export type NewBidTemplate = typeof bidTemplates.$inferInsert
export type JobInvitation = typeof jobInvitations.$inferSelect
export type NewJobInvitation = typeof jobInvitations.$inferInsert
export type SavedSearch = typeof savedSearches.$inferSelect
export type NewSavedSearch = typeof savedSearches.$inferInsert
export type JobAlert = typeof jobAlerts.$inferSelect
export type NewJobAlert = typeof jobAlerts.$inferInsert
export type Interview = typeof interviews.$inferSelect
export type NewInterview = typeof interviews.$inferInsert

// Workspace types
export type WorkspaceSession = typeof workspaceSessions.$inferSelect
export type NewWorkspaceSession = typeof workspaceSessions.$inferInsert
export type JobTask = typeof jobTasks.$inferSelect
export type NewJobTask = typeof jobTasks.$inferInsert
export type FileVersion = typeof fileVersions.$inferSelect
export type NewFileVersion = typeof fileVersions.$inferInsert
export type TimeTracking = typeof timeTracking.$inferSelect
export type NewTimeTracking = typeof timeTracking.$inferInsert
export type FileAnnotation = typeof fileAnnotations.$inferSelect
export type NewFileAnnotation = typeof fileAnnotations.$inferInsert
export type DeliveryPackage = typeof deliveryPackages.$inferSelect
export type NewDeliveryPackage = typeof deliveryPackages.$inferInsert
export type WorkspaceEvent = typeof workspaceEvents.$inferSelect
export type NewWorkspaceEvent = typeof workspaceEvents.$inferInsert
export type MilestoneRevision = typeof milestoneRevisions.$inferSelect
export type NewMilestoneRevision = typeof milestoneRevisions.$inferInsert
export type MilestoneChat = typeof milestoneChats.$inferSelect
export type NewMilestoneChat = typeof milestoneChats.$inferInsert

// Reputation types
export type FreelancerReview = typeof freelancerReviews.$inferSelect
export type NewFreelancerReview = typeof freelancerReviews.$inferInsert
export type ClientReview = typeof clientReviews.$inferSelect
export type NewClientReview = typeof clientReviews.$inferInsert
export type ReviewDispute = typeof reviewDisputes.$inferSelect
export type NewReviewDispute = typeof reviewDisputes.$inferInsert
export type SkillEndorsement = typeof skillEndorsements.$inferSelect
export type NewSkillEndorsement = typeof skillEndorsements.$inferInsert
export type VerificationBadge = typeof verificationBadges.$inferSelect
export type NewVerificationBadge = typeof verificationBadges.$inferInsert
export type ReputationRegistry = typeof reputationRegistry.$inferSelect
export type NewReputationRegistry = typeof reputationRegistry.$inferInsert
export type ReputationNFT = typeof reputationNFTs.$inferSelect
export type NewReputationNFT = typeof reputationNFTs.$inferInsert

// Marketing types
export type ReferralCampaign = typeof referralCampaigns.$inferSelect
export type NewReferralCampaign = typeof referralCampaigns.$inferInsert
export type ReferralLink = typeof referralLinks.$inferSelect
export type NewReferralLink = typeof referralLinks.$inferInsert
export type ReferralConversion = typeof referralConversions.$inferSelect
export type NewReferralConversion = typeof referralConversions.$inferInsert
export type Partner = typeof partners.$inferSelect
export type NewPartner = typeof partners.$inferInsert
export type PartnerCommission = typeof partnerCommissions.$inferSelect
export type NewPartnerCommission = typeof partnerCommissions.$inferInsert
export type BlogPost = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert
export type BlogComment = typeof blogComments.$inferSelect
export type NewBlogComment = typeof blogComments.$inferInsert
export type SocialShare = typeof socialShares.$inferSelect
export type NewSocialShare = typeof socialShares.$inferInsert

// Support types
export type OnboardingStep = typeof onboardingSteps.$inferSelect
export type NewOnboardingStep = typeof onboardingSteps.$inferInsert
export type OnboardingProgress = typeof onboardingProgress.$inferSelect
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert
export type Tutorial = typeof tutorials.$inferSelect
export type NewTutorial = typeof tutorials.$inferInsert
export type TutorialProgress = typeof tutorialProgress.$inferSelect
export type NewTutorialProgress = typeof tutorialProgress.$inferInsert
export type FaqCategory = typeof faqCategories.$inferSelect
export type NewFaqCategory = typeof faqCategories.$inferInsert
export type FaqItem = typeof faqItems.$inferSelect
export type NewFaqItem = typeof faqItems.$inferInsert
export type FaqVote = typeof faqVotes.$inferSelect
export type NewFaqVote = typeof faqVotes.$inferInsert
export type HelpArticle = typeof helpArticles.$inferSelect
export type NewHelpArticle = typeof helpArticles.$inferInsert
export type VideoTutorial = typeof videoTutorials.$inferSelect
export type NewVideoTutorial = typeof videoTutorials.$inferInsert
export type VideoProgress = typeof videoProgress.$inferSelect
export type NewVideoProgress = typeof videoProgress.$inferInsert
export type TooltipContent = typeof tooltipContent.$inferSelect
export type NewTooltipContent = typeof tooltipContent.$inferInsert

// System types
export type JobQueue = typeof jobQueue.$inferSelect
export type NewJobQueue = typeof jobQueue.$inferInsert
export type ScheduledTask = typeof scheduledTasks.$inferSelect
export type NewScheduledTask = typeof scheduledTasks.$inferInsert
export type ScheduledTaskRun = typeof scheduledTaskRuns.$inferSelect
export type NewScheduledTaskRun = typeof scheduledTaskRuns.$inferInsert

// TeamDataWithMembers composite type
export type TeamDataWithMembers = Team & {
  teamMembers: Array<
    TeamMember & {
      user: User
    }
  >
}
