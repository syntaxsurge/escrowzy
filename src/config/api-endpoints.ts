// Utility function to check if a path is an API endpoint
export const isApiPath = (path: string): boolean => {
  return path.includes('/api/')
}

export const apiEndpoints = {
  auth: {
    signOut: '/api/auth/signout',
    wallet: '/api/auth/wallet',
    verifyEmail: '/api/auth/verify-email',
    resendVerification: '/api/auth/resend-verification'
  },
  user: {
    profile: '/api/user',
    subscription: '/api/user/subscription',
    avatar: '/api/user/avatar'
  },
  team: '/api/team',
  notifications: {
    list: '/api/notifications',
    table: '/api/notifications/table'
  },
  teams: {
    base: '/api/teams',
    downgrade: (id: string) => `/api/teams/${id}/downgrade-free`,
    downgradeTeamPlan: (id: string) => `/api/teams/${id}/downgrade-team-plan`,
    paymentHistory: (id: string) => `/api/teams/${id}/payment-history`
  },
  teamMembers: {
    byId: (memberId: string) => `/api/team-members/${memberId}`
  },
  admin: {
    users: {
      base: '/api/admin/users',
      byId: (userId: string) => `/api/admin/users/${userId}`,
      bulkUpdate: '/api/admin/users/bulk-update'
    },
    teams: {
      base: '/api/admin/teams',
      members: (teamId: string) => `/api/admin/teams/${teamId}/members`,
      memberRole: (teamId: string, memberId: string) =>
        `/api/admin/teams/${teamId}/members/${memberId}/role`,
      memberById: (teamId: string, memberId: string) =>
        `/api/admin/teams/${teamId}/members/${memberId}`,
      availableUsers: (teamId: string) =>
        `/api/admin/teams/${teamId}/available-users`
    },
    stats: '/api/admin/stats',
    paymentHistory: '/api/admin/payment-history',
    activityLogs: '/api/admin/activity-logs',
    contract: {
      transactions: '/api/admin/contract-transactions',
      plans: '/api/admin/contract-plans',
      byPlanKey: (planKey: string) => `/api/admin/contract-plans/${planKey}`,
      earnings: '/api/admin/contract-earnings',
      escrow: {
        stats: '/api/admin/contract/escrow/stats',
        list: '/api/admin/contract/escrow/list'
      },
      achievement: {
        stats: '/api/admin/contract/achievement/stats',
        list: '/api/admin/contract/achievement/list'
      }
    },
    blockchainConfig: {
      base: '/api/admin/blockchain-config',
      sync: '/api/admin/blockchain-config/sync',
      contractById: (contractId: string) =>
        `/api/admin/blockchain-config/contracts/${contractId}`
    },
    legalDocuments: {
      base: '/api/admin/legal-documents',
      byType: (type: string) => `/api/admin/legal-documents/${type}`
    }
  },
  payments: {
    intent: '/api/payments/intent',
    confirm: '/api/payments/confirm'
  },
  subscription: {
    validate: '/api/subscription/validate',
    combined: '/api/subscription/combined'
  },
  health: {
    db: '/api/health/db'
  },
  cron: {
    subscriptionCheck: '/api/cron/subscription-check',
    cleanupInvitations: '/api/cron/cleanup-invitations',
    syncTransactions: '/api/cron/sync-transactions',
    updateExpiredTrades: '/api/cron/update-expired-trades'
  },
  invitations: {
    base: '/api/invitations',
    byToken: (token: string) => `/api/invitations/${token}`,
    decline: (token: string) => `/api/invitations/${token}/decline`
  },
  activity: {
    base: '/api/activity',
    recent: '/api/activity/recent'
  },
  contractPlans: '/api/contract-plans',
  transactions: {
    sync: '/api/transactions/sync',
    track: '/api/transactions/track',
    status: '/api/transactions/status'
  },
  legalDocuments: {
    byType: (type: string) => `/api/legal-documents/${type}`
  },
  chat: {
    upload: '/api/chat/upload'
  },
  trades: {
    base: '/api/trades',
    create: '/api/trades/create',
    user: '/api/trades/user',
    userWithParams: (params: string) => `/api/trades/user?${params}`,
    table: '/api/trades/table',
    stats: '/api/trades/stats',
    byId: (id: string) => `/api/trades/${id}`,
    deposit: (id: string | number) => `/api/trades/${id}/deposit`,
    fund: (id: string | number) => `/api/trades/${id}/fund`,
    paymentSent: (id: string | number) => `/api/trades/${id}/payment-sent`,
    paymentProof: (id: string | number) => `/api/trades/${id}/payment-proof`,
    confirm: (id: string | number) => `/api/trades/${id}/confirm`,
    dispute: (id: string | number) => `/api/trades/${id}/dispute`,
    cancel: (id: string | number) => `/api/trades/${id}/cancel`
  },
  listings: {
    base: '/api/listings',
    all: '/api/listings',
    user: '/api/listings/user',
    userStats: '/api/listings/user-stats',
    marketStats: '/api/listings/market-stats',
    create: '/api/listings/create',
    byId: (id: string) => `/api/listings/${id}`,
    accept: (id: string) => `/api/listings/${id}/accept`
  },
  battles: {
    findMatch: '/api/battles/find-match',
    create: '/api/battles/create',
    activeDiscount: '/api/battles/active-discount',
    history: '/api/battles/history',
    dailyLimit: '/api/battles/daily-limit',
    stats: '/api/battles/stats',
    statsByUserId: (userId: string | number) => `/api/battles/stats/${userId}`,
    activity: '/api/battles/activity'
  },
  rewards: {
    dailyLogin: '/api/rewards/daily-login',
    addXp: '/api/rewards/add-xp',
    questProgress: '/api/rewards/quest-progress',
    questProgressClaim: (questId: string) =>
      `/api/rewards/quest-progress/${questId}/claim`,
    checkAchievement: '/api/rewards/check-achievement',
    stats: '/api/rewards/stats',
    statsByUserId: (userId: string | number) => `/api/rewards/stats/${userId}`,
    achievements: '/api/rewards/achievements',
    achievementsByUserId: (userId: string | number) =>
      `/api/rewards/achievements/${userId}`,
    claimAchievement: '/api/rewards/claim-achievement',
    leaderboard: '/api/rewards/leaderboard',
    userRank: '/api/rewards/user-rank',
    questsByUserId: (userId: string | number) => `/api/rewards/quests/${userId}`
  },
  users: {
    tradingStats: (id: string) => `/api/users/${id}/trading-stats`
  },
  uploads: {
    getFile: (path: string) => `/api/uploads/${path}`
  },
  fees: {
    preview: '/api/fees/preview'
  },
  external: {
    coingecko: {
      price: (coingeckoId: string) =>
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    },
    resend: {
      emails: 'https://api.resend.com/emails'
    }
  }
} as const
