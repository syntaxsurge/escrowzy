import { z } from 'zod'

if (typeof window !== 'undefined') {
  throw new Error(
    'env.server.ts was imported in the browser. Use env.public.ts instead.'
  )
}

const ServerEnv = z.object({
  // Database
  POSTGRES_URL: z.string().url(),

  // Authentication
  AUTH_SECRET: z.string().min(1),

  // Cron Jobs
  CRON_SECRET: z.string().optional().default(''),

  // Email Service
  RESEND_API_KEY: z.string().optional().default(''),
  FROM_EMAIL: z.string().email().optional().default('noreply@example.com'),

  // Blockchain
  ADMIN_ADDRESS: z.string().optional().default(''),
  ADMIN_PRIVATE_KEY: z.string().optional().default(''),

  // External APIs
  COINGECKO_API_KEY: z.string().optional().default(''),

  // Pusher (Real-time)
  PUSHER_APP_ID: z.string().optional().default(''),
  PUSHER_SECRET: z.string().optional().default(''),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development')
})

const parsedEnv = ServerEnv.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors
  )
  throw new Error('Invalid environment variables')
}

export const envServer = parsedEnv.data

// Helper functions for backwards compatibility
export const getServerEnv = {
  postgres: {
    url: envServer.POSTGRES_URL
  },
  auth: {
    secret: envServer.AUTH_SECRET
  },
  cron: {
    secret: envServer.CRON_SECRET
  },
  email: {
    resendApiKey: envServer.RESEND_API_KEY,
    fromEmail: envServer.FROM_EMAIL
  },
  blockchain: {
    adminAddress: envServer.ADMIN_ADDRESS,
    adminPrivateKey: envServer.ADMIN_PRIVATE_KEY
  },
  apis: {
    coingeckoApiKey: envServer.COINGECKO_API_KEY
  },
  pusher: {
    appId: envServer.PUSHER_APP_ID,
    secret: envServer.PUSHER_SECRET
  },
  isDevelopment: envServer.NODE_ENV === 'development',
  isProduction: envServer.NODE_ENV === 'production'
}

// Blockchain admin helper functions
export function getAdminConfig() {
  return {
    address: envServer.ADMIN_ADDRESS,
    privateKey: envServer.ADMIN_PRIVATE_KEY
  }
}

export function getApiKeys() {
  return {
    coingecko: envServer.COINGECKO_API_KEY
  }
}
