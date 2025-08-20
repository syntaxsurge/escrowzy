'use client'

import { useState, useCallback } from 'react'

import { toast } from 'sonner'

import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'

interface SwapQuote {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  priceImpact: number
  estimatedGas: string
  route: string
  exchangeRate: string
  routerAddress?: string
  tx?: any
  minReceiveAmount?: string
  estimateGasFee?: string
  liquiditySources?: string[]
  quoteCompareList?: any[]
  fromTokenInfo?: any
  toTokenInfo?: any
}

interface TokenPrice {
  price: number
  change24h: number
  volume24h: number
  marketCap: number
}

export function useSwap() {
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isExecutingSwap, setIsExecutingSwap] = useState(false)
  const [quote, setQuote] = useState<SwapQuote | null>(null)

  const getQuote = useCallback(
    async (
      fromToken: string,
      toToken: string,
      fromAmount: string,
      chainId: number,
      slippage: number = 0.5
    ) => {
      setIsLoadingQuote(true)

      try {
        const response = await api.post(apiEndpoints.swap.quote, {
          fromToken,
          toToken,
          fromAmount,
          chainId,
          slippage
        })

        // Set the quote with all the real data
        const quoteData: SwapQuote = {
          ...response,
          priceImpact:
            typeof response.priceImpact === 'number'
              ? response.priceImpact
              : parseFloat(response.priceImpact || '0')
        }

        console.log('Setting quote in hook:', quoteData)
        setQuote(quoteData)
        return quoteData
      } catch (error) {
        console.error('Quote error:', error)

        // Show more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('No liquidity')) {
            toast.error('No liquidity available for this pair')
          } else if (error.message.includes('Rate limit')) {
            toast.error('Too many requests. Please wait a moment.')
          } else {
            toast.error(error.message || 'Failed to get swap quote')
          }
        } else {
          toast.error('Failed to get swap quote')
        }

        setQuote(null)
        return null
      } finally {
        setIsLoadingQuote(false)
      }
    },
    []
  )

  const getTokenPrice = useCallback(
    async (
      tokenAddress: string,
      chainId: number
    ): Promise<TokenPrice | null> => {
      try {
        const response = await api.post(apiEndpoints.swap.price, {
          tokenAddress,
          chainId
        })

        return response
      } catch (error) {
        console.error('Price error:', error)
        return null
      }
    },
    []
  )

  const executeSwap = useCallback(
    async (userAddress: string, chainId: number) => {
      if (!quote) {
        toast.error('No quote available')
        return null
      }

      setIsExecutingSwap(true)

      try {
        const response = await api.post(apiEndpoints.swap.execute, {
          ...quote,
          userAddress,
          chainId
        })

        if (response?.tx) {
          // Return the transaction data for wallet execution
          toast.info('Please confirm the transaction in your wallet')
          return {
            success: true,
            tx: response.tx,
            routerAddress: response.routerAddress,
            message: response.message || 'Transaction ready for execution'
          }
        } else {
          throw new Error(response?.details || 'Failed to prepare swap')
        }
      } catch (error) {
        console.error('Swap execution error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to execute swap'
        )
        return null
      } finally {
        setIsExecutingSwap(false)
      }
    },
    [quote]
  )

  return {
    quote,
    isLoadingQuote,
    isExecutingSwap,
    getQuote,
    getTokenPrice,
    executeSwap
  }
}
