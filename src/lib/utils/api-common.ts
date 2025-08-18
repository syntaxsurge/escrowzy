import { NextRequest } from 'next/server'

import { apiResponses } from '@/lib/api/server-utils'
import { getSession } from '@/lib/auth/session'

/**
 * Centralized ID validation utility
 * Validates and parses ID parameters from route contexts
 */
export function validateId(
  id: string,
  fieldName = 'id'
): { valid: boolean; parsedId?: number; error?: string } {
  const parsedId = parseInt(id)

  if (isNaN(parsedId) || parsedId <= 0) {
    return {
      valid: false,
      error: `Invalid ${fieldName}`
    }
  }

  return {
    valid: true,
    parsedId
  }
}

/**
 * Centralized authentication check
 * Returns session or appropriate error response
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    return {
      session: null,
      error: apiResponses.unauthorized('Please sign in to access this resource')
    }
  }

  return {
    session,
    error: null
  }
}

/**
 * Centralized permission check
 * Validates if user has access to a resource by user ID
 */
export function checkUserPermission(
  sessionUserId: number,
  resourceUserId: number | null
): boolean {
  if (!resourceUserId) return false
  return sessionUserId === resourceUserId
}

/**
 * Centralized query parameter parsing
 * Extracts and validates common query parameters
 */
export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  return {
    limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100), // Cap at 100
    offset: Math.max(parseInt(searchParams.get('offset') || '0'), 0),
    page: Math.max(parseInt(searchParams.get('page') || '1'), 1),
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'
  }
}

/**
 * Centralized error logging
 * Logs errors with consistent format and context
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: any
) {
  console.error(
    `[${context}]`,
    error,
    additionalData ? { data: additionalData } : ''
  )
}

/**
 * Centralized async wrapper for route handlers
 * Provides consistent error handling and logging
 */
export function withAsyncHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      const errorContext = context || 'API Handler'
      logError(errorContext, error)
      throw error
    }
  }
}

/**
 * Centralized date range validation
 * Validates and parses date parameters
 */
export function validateDateRange(startDate?: string, endDate?: string) {
  let start: Date | undefined
  let end: Date | undefined

  if (startDate) {
    start = new Date(startDate)
    if (isNaN(start.getTime())) {
      return { valid: false, error: 'Invalid start date format' }
    }
  }

  if (endDate) {
    end = new Date(endDate)
    if (isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid end date format' }
    }
  }

  if (start && end && start > end) {
    return { valid: false, error: 'Start date must be before end date' }
  }

  return { valid: true, startDate: start, endDate: end }
}

/**
 * Centralized response formatter for paginated results
 * Provides consistent pagination metadata
 */
export function formatPaginatedResponse<T>(
  data: T[],
  params: { limit: number; offset: number; page?: number },
  totalCount?: number
) {
  const hasMore = data.length === params.limit
  const currentPage =
    params.page || Math.floor(params.offset / params.limit) + 1

  return {
    data,
    pagination: {
      limit: params.limit,
      offset: params.offset,
      page: currentPage,
      hasMore,
      ...(totalCount !== undefined && {
        total: totalCount,
        totalPages: Math.ceil(totalCount / params.limit)
      })
    }
  }
}

/**
 * Centralized request body validation wrapper
 * Provides consistent Zod validation handling
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        success: false,
        error: apiResponses.badRequest('Invalid input data')
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (_error) {
    return {
      success: false,
      error: apiResponses.badRequest('Invalid JSON body')
    }
  }
}
