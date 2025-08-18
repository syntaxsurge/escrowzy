import { NextRequest, NextResponse } from 'next/server'

import { apiResponses } from '@/lib/api/server-utils'
import { logError, requireAuth, validateId } from '@/lib/utils/api-common'

/**
 * Configuration for route handlers
 */
export interface RouteConfig {
  requireAuth?: boolean
  validateId?: boolean
  idParamName?: string
  logContext?: string
}

/**
 * Context passed to route handlers
 */
export interface RouteContext {
  request: NextRequest
  params?: any
  session?: any
  parsedId?: number
}

/**
 * Type for route handler functions
 */
export type RouteHandler = (context: RouteContext) => Promise<NextResponse>

/**
 * Next.js route context type
 */
export type NextRouteContext = { params: Promise<any> } | undefined

/**
 * Centralized route wrapper that handles common patterns
 * - Authentication
 * - ID validation
 * - Error handling
 * - Logging
 */
export function withRouteHandler(
  handler: RouteHandler,
  config: RouteConfig = {}
) {
  return async (
    request: NextRequest,
    routeContext?: NextRouteContext
  ): Promise<NextResponse> => {
    const context = config.logContext || 'API Route'

    try {
      // Parse params if provided
      let params: any = {}
      if (routeContext?.params) {
        params = await routeContext.params
      }

      // Handle authentication if required
      let session = null
      if (config.requireAuth) {
        const authResult = await requireAuth()
        if (authResult.error) {
          return authResult.error
        }
        session = authResult.session
      }

      // Handle ID validation if required
      let parsedId: number | undefined
      if (config.validateId) {
        const idParamName = config.idParamName || 'id'
        const idValue = params[idParamName]

        if (!idValue) {
          return apiResponses.badRequest(`Missing ${idParamName} parameter`)
        }

        const validation = validateId(idValue, idParamName)
        if (!validation.valid) {
          return apiResponses.badRequest(validation.error!)
        }

        parsedId = validation.parsedId
      }

      // Call the actual handler
      return await handler({
        request,
        params,
        session,
        parsedId
      })
    } catch (error) {
      logError(context, error)
      return apiResponses.handleError(error, 'An unexpected error occurred')
    }
  }
}

/**
 * Specialized wrapper for resource routes that require user ownership validation
 */
export function withResourceHandler(
  handler: RouteHandler,
  config: RouteConfig & {
    checkOwnership?: (session: any, parsedId: number) => Promise<boolean>
  } = {}
) {
  return withRouteHandler(
    async context => {
      // Validate ownership if specified
      if (config.checkOwnership && context.session && context.parsedId) {
        const hasAccess = await config.checkOwnership(
          context.session,
          context.parsedId
        )
        if (!hasAccess) {
          return apiResponses.forbidden(
            'You do not have access to this resource'
          )
        }
      }

      return handler(context)
    },
    { requireAuth: true, validateId: true, ...config }
  )
}

/**
 * Wrapper for GET routes that commonly need pagination
 */
export function withPaginatedHandler(
  handler: (
    context: RouteContext,
    pagination: {
      limit: number
      offset: number
      page: number
    }
  ) => Promise<NextResponse>,
  config: RouteConfig = {}
) {
  return withRouteHandler(async context => {
    const { searchParams } = new URL(context.request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)

    return handler(context, { limit, offset, page })
  }, config)
}

/**
 * Wrapper for POST/PUT routes that need request body validation
 */
export function withValidationHandler<T>(
  handler: (context: RouteContext, validatedData: T) => Promise<NextResponse>,
  schema: any,
  config: RouteConfig = {}
) {
  return withRouteHandler(async context => {
    try {
      const body = await context.request.json()
      const result = schema.safeParse(body)

      if (!result.success) {
        return apiResponses.badRequest('Invalid input data')
      }

      return handler(context, result.data)
    } catch (_error) {
      return apiResponses.badRequest('Invalid JSON body')
    }
  }, config)
}
