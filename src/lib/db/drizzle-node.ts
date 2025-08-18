import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'

import * as schema from './schema'

// Parse environment variables directly for Node.js scripts
const envSchema = z.object({
  POSTGRES_URL: z.string().url()
})

const env = envSchema.parse(process.env)

export const client = postgres(env.POSTGRES_URL)
export const db = drizzle(client, { schema })
