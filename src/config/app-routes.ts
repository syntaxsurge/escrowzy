export const appRoutes = {
  home: '/',
  login: '/login',
  signIn: '/sign-in',
  pricing: '/pricing',
  privacy: '/privacy',
  terms: '/terms',
  apiDocs: '/api-docs',
  notFound: '/404',
  dbError: '/db-error',
  invite: (token: string) => `/invite/${token}`,

  chat: {
    base: '/chat',
    direct: (contextId: string) => `/chat/direct/${contextId}`,
    team: (teamId: string) => `/chat/team/${teamId}`,
    trades: (tradeId: string) => `/chat/trades/${tradeId}`
  },

  dashboard: {
    base: '/dashboard',
    activity: '/dashboard/activity',
    notifications: '/dashboard/notifications',
    invitations: '/dashboard/invitations',

    settings: {
      base: '/dashboard/settings',
      team: '/dashboard/settings/team',
      subscription: '/dashboard/settings/subscription',
      apiKeys: '/dashboard/settings/api-keys'
    }
  },

  admin: {
    base: '/admin',
    users: '/admin/users',
    teams: '/admin/teams',
    teamMembers: (teamId: string) => `/admin/teams/${teamId}/members`,
    activity: '/admin/activity',
    payments: '/admin/payments',
    contractAdminPanel: '/admin/contract-admin-panel', // Deprecated - kept for backward compatibility
    contracts: {
      subscription: '/admin/contracts/subscription',
      escrow: '/admin/contracts/escrow',
      achievementNft: '/admin/contracts/achievement-nft'
    },
    blockchainConfig: '/admin/blockchain-config',
    legalDocuments: '/admin/legal-documents'
  },

  trades: {
    base: '/trades',
    active: '/trades/active',
    history: {
      base: '/trades/history',
      detail: (id: string) => `/trades/history/${id}`
    },
    myListings: '/trades/my-listings',
    listings: {
      base: '/trades/listings',
      create: '/trades/listings/create',
      withTab: (tab: string) => `/trades/listings?tab=${tab}`
    }
  },

  battles: {
    base: '/battles',
    arena: '/battles/arena',
    leaderboard: '/battles/leaderboard',
    quests: '/battles/quests',
    achievements: '/battles/achievements'
  },

  battleArena: '/battle-arena',

  rewards: {
    base: '/rewards',
    leaderboard: '/rewards/leaderboard',
    quests: '/rewards/quests'
  },

  // Query parameter utilities
  withParams: {
    chatTab: (route: string) => `${route}?tab=chat`,
    tradesTab: (route: string) => `${route}?tab=trades`,
    teamId: (route: string, teamId: string) => `${route}?teamId=${teamId}`,
    tab: (route: string, tab: string) => `${route}?tab=${tab}`
  },

  // Static assets
  assets: {
    logo: '/images/escrowzy-logo.png',
    favicon: '/images/favicon.ico',
    placeholder: '/images/placeholder.png',
    notificationIcon: '/icon-192x192.png',
    gridBackground: '/grid.svg'
  },

  // External URLs
  external: {
    github: 'https://github.com/syntaxsurge/escrowzy'
  }
} as const
