import type { Config } from 'drizzle-kit'
import { z } from 'zod'

// Parse environment variables directly for drizzle-kit CLI
const envSchema = z.object({
  POSTGRES_URL: z.string().url()
})

const env = envSchema.parse(process.env)

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.POSTGRES_URL
  }
} satisfies Config
