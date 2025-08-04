import { apiResponses } from '@/lib/api/server-utils'
import { clearSession } from '@/lib/auth/session'

export async function POST() {
  try {
    // Clear the session
    await clearSession()

    return apiResponses.success({ success: true })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to sign out')
  }
}
