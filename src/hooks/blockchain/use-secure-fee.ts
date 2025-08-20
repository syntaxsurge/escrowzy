'use client'

import { useState, useCallback } from 'react'

import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'

interface FeeCalculationResult {
  feePercentage: number
  feeAmount: number
  netAmount: number
  chainId: number
  userAddress: string
}

interface FeeValidationResult {
  isValid: boolean
  correctFee?: {
    feePercentage: number
    feeAmount: number
    netAmount: number
  }
  providedFee?: number
}

interface UserFeeInfo {
  userFeePercentage: number
  planFeeTiers: Record<number, number>
  chainId: number
  userAddress: string
}

/**
 * Hook for secure server-side fee calculation and validation
 * This ensures fees cannot be tampered with on the client side
 */
export function useSecureFee() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [feeInfo, setFeeInfo] = useState<UserFeeInfo | null>(null)

  /**
   * Calculate fee securely on the server
   */
  const calculateFee = useCallback(
    async (
      amount: string | number,
      chainId: number,
      userAddress?: string
    ): Promise<FeeCalculationResult | null> => {
      try {
        setIsLoading(true)

        const response = await api.post(apiEndpoints.trades.calculateFee, {
          amount,
          chainId,
          userAddress
        })

        return {
          feePercentage: response.feePercentage,
          feeAmount: response.feeAmount,
          netAmount: response.netAmount,
          chainId: response.chainId,
          userAddress: response.userAddress
        }
      } catch (error) {
        console.error('Error calculating fee:', error)
        toast({
          title: 'Error',
          description: 'Failed to calculate fee. Please try again.',
          variant: 'destructive'
        })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  /**
   * Validate a client-calculated fee against the server
   */
  const validateFee = useCallback(
    async (
      amount: string | number,
      chainId: number,
      clientFee: number,
      userAddress?: string
    ): Promise<FeeValidationResult | null> => {
      try {
        setIsLoading(true)

        const response = await api.post(apiEndpoints.trades.validateFee, {
          amount,
          chainId,
          clientFee,
          userAddress
        })

        if (!response.isValid) {
          // Fee is invalid, return the correct fee
          return {
            isValid: false,
            correctFee: response.correctFee,
            providedFee: response.providedFee
          }
        }

        if (response.isValid) {
          return {
            isValid: true
          }
        }

        return null
      } catch (error) {
        console.error('Error validating fee:', error)
        toast({
          title: 'Error',
          description: 'Failed to validate fee. Please try again.',
          variant: 'destructive'
        })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  /**
   * Get user's fee information and all plan tiers
   */
  const getUserFeeInfo = useCallback(
    async (chainId: number): Promise<UserFeeInfo | null> => {
      try {
        setIsLoading(true)

        const response = await api.get(
          `${apiEndpoints.trades.calculateFee}?chainId=${chainId}`
        )

        const info: UserFeeInfo = {
          userFeePercentage: response.userFeePercentage,
          planFeeTiers: response.planFeeTiers,
          chainId: response.chainId,
          userAddress: response.userAddress
        }

        setFeeInfo(info)
        return info
      } catch (error) {
        console.error('Error fetching fee info:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch fee information. Please try again.',
          variant: 'destructive'
        })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  /**
   * Format fee percentage for display
   */
  const formatFeePercentage = useCallback((percentage: number): string => {
    return `${percentage.toFixed(1)}%`
  }, [])

  /**
   * Calculate and format fee amount for display
   */
  const getFormattedFee = useCallback(
    async (
      amount: string | number,
      chainId: number,
      userAddress?: string
    ): Promise<{ fee: string; net: string; percentage: string } | null> => {
      const result = await calculateFee(amount, chainId, userAddress)

      if (!result) {
        return null
      }

      return {
        fee: result.feeAmount.toFixed(6),
        net: result.netAmount.toFixed(6),
        percentage: formatFeePercentage(result.feePercentage)
      }
    },
    [calculateFee, formatFeePercentage]
  )

  return {
    calculateFee,
    validateFee,
    getUserFeeInfo,
    getFormattedFee,
    formatFeePercentage,
    feeInfo,
    isLoading
  }
}
