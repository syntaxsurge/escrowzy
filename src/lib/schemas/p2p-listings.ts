import { z } from 'zod'

import { isValidPaymentMethod, isValidToken } from '@/types/p2p-listings'

import {
  positiveNumberString,
  optionalPositiveNumberString
} from '../schemas/common'

// Create listing schema
export const createListingSchema = z
  .object({
    listingType: z.enum(['buy', 'sell']),
    tokenOffered: z
      .string()
      .min(1, 'Token is required')
      .refine(isValidToken, 'Invalid token'),
    amount: positiveNumberString,
    pricePerUnit: positiveNumberString.describe('Price per unit is required'),
    minAmount: optionalPositiveNumberString,
    maxAmount: optionalPositiveNumberString,
    paymentMethods: z
      .array(z.string())
      .min(1, 'At least one payment method is required')
      .refine(
        methods => methods.every(isValidPaymentMethod),
        'Invalid payment method'
      ),
    paymentWindow: z
      .number()
      .int()
      .min(5, 'Payment window must be at least 5 minutes')
      .max(1440, 'Payment window cannot exceed 24 hours')
      .optional()
      .default(15)
      .describe('Payment window in minutes for seller to deposit crypto')
  })
  .refine(
    data => {
      if (data.minAmount && data.maxAmount) {
        return parseFloat(data.minAmount) <= parseFloat(data.maxAmount)
      }
      return true
    },
    {
      message: 'Min amount must be less than or equal to max amount',
      path: ['minAmount']
    }
  )
  .refine(
    data => {
      if (data.minAmount) {
        return parseFloat(data.minAmount) <= parseFloat(data.amount)
      }
      return true
    },
    {
      message: 'Min amount must be less than or equal to total amount',
      path: ['minAmount']
    }
  )
  .refine(
    data => {
      if (data.maxAmount) {
        return parseFloat(data.maxAmount) <= parseFloat(data.amount)
      }
      return true
    },
    {
      message: 'Max amount must be less than or equal to total amount',
      path: ['maxAmount']
    }
  )

export type CreateListingInput = z.infer<typeof createListingSchema>

// Update listing schema
export const updateListingSchema = z.object({
  amount: optionalPositiveNumberString,
  pricePerUnit: optionalPositiveNumberString,
  minAmount: optionalPositiveNumberString.nullable(),
  maxAmount: optionalPositiveNumberString.nullable(),
  paymentMethods: z
    .array(z.string())
    .optional()
    .refine(methods => {
      if (!methods) return true
      return methods.length > 0 && methods.every(isValidPaymentMethod)
    }, 'Invalid payment method'),
  paymentWindow: z
    .number()
    .int()
    .min(5, 'Payment window must be at least 5 minutes')
    .max(1440, 'Payment window cannot exceed 24 hours')
    .optional(),
  isActive: z.boolean().optional()
})

export type UpdateListingInput = z.infer<typeof updateListingSchema>

// Accept listing schema
export const acceptListingSchema = z.object({
  amount: positiveNumberString,
  paymentMethod: z
    .string()
    .min(1, 'Payment method is required')
    .refine(isValidPaymentMethod, 'Invalid payment method'),
  chainId: z.number().int().positive('Chain ID is required')
})

export type AcceptListingInput = z.infer<typeof acceptListingSchema>

// Get listings query schema
export const getListingsQuerySchema = z.object({
  listingType: z.enum(['buy', 'sell']).optional(),
  tokenOffered: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  paymentMethod: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .pipe(z.boolean().optional()),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'pricePerUnit', 'amount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export type GetListingsQuery = z.infer<typeof getListingsQuerySchema>
