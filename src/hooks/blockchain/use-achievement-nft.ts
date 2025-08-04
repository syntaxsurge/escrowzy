'use client'

import { useState, useCallback } from 'react'

import { useReadContract } from 'wagmi'

import { useBlockchain } from '@/context'
import { useToast } from '@/hooks/use-toast'
import { getAchievementNFTAddress, ACHIEVEMENT_NFT_ABI } from '@/lib/blockchain'

import { useTransaction } from './use-transaction'
import type { TransactionConfig } from './use-transaction'

export enum AchievementCategory {
  TRADING = 0,
  VOLUME = 1,
  BATTLE = 2,
  COMMUNITY = 3,
  SPECIAL = 4
}

export enum AchievementRarity {
  COMMON = 0,
  UNCOMMON = 1,
  RARE = 2,
  EPIC = 3,
  LEGENDARY = 4
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  xpReward: bigint
  combatPowerReward: bigint
  exists: boolean
  active: boolean
  metadataURI: string
}

export interface UserAchievementProgress {
  achievementId: string
  progress: number
  requirement: number
  hasAchievement: boolean
}

export interface AchievementStats {
  totalAchievements: number
  totalXP: number
  totalCombatPower: number
  completionRate: number
}

export interface BatchAchievementData {
  achievementIds: string[]
  names: string[]
  descriptions: string[]
  categories: AchievementCategory[]
  rarities: AchievementRarity[]
  xpRewards: bigint[]
  combatPowerRewards: bigint[]
  requirements: bigint[]
  metadataURIs: string[]
}

export function useAchievementNFT() {
  const { chainId, address } = useBlockchain()
  const { executeTransaction, isExecuting } = useTransaction()
  const { toast } = useToast()
  const [userAchievements, setUserAchievements] = useState<string[]>([])
  const [userProgress, setUserProgress] = useState<Map<string, number>>(
    new Map()
  )

  const selectedChainId = chainId || 1
  const nftAddress = getAchievementNFTAddress(selectedChainId)

  // Read user's total XP from contract
  const { data: userTotalXP } = useReadContract({
    address: nftAddress as `0x${string}`,
    abi: ACHIEVEMENT_NFT_ABI,
    functionName: 'userTotalXP',
    args: address ? [address] : undefined,
    chainId: selectedChainId
  })

  // Read user's total combat power from contract
  const { data: userTotalCombatPower } = useReadContract({
    address: nftAddress as `0x${string}`,
    abi: ACHIEVEMENT_NFT_ABI,
    functionName: 'userTotalCombatPower',
    args: address ? [address] : undefined,
    chainId: selectedChainId
  })

  const mintAchievement = useCallback(
    async (achievementId: string) => {
      if (!nftAddress) {
        toast({
          title: 'Error',
          description: 'Achievement NFT contract not deployed on this network',
          variant: 'destructive'
        })
        return
      }

      if (!address) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet',
          variant: 'destructive'
        })
        return
      }

      try {
        const config: TransactionConfig = {
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'mintAchievement',
          args: [address, achievementId],
          chainId
        }

        const hash = await executeTransaction(config, {
          messages: {
            pendingMessage: 'Minting achievement NFT...',
            processingMessage: 'Processing NFT mint...',
            confirmedMessage: 'Achievement NFT minted successfully!',
            failedMessage: 'Failed to mint achievement NFT'
          },
          onSuccess: (_txHash: string) => {
            toast({
              title: 'Achievement Unlocked!',
              description: `You've earned the ${achievementId} achievement!`
            })
            // Update local state
            setUserAchievements(prev => [...prev, achievementId])
          },
          onError: (error: Error) => {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive'
            })
          }
        })

        return hash
      } catch (error) {
        console.error('Failed to mint achievement:', error)
        throw error
      }
    },
    [nftAddress, address, selectedChainId, executeTransaction, toast]
  )

  const batchMintAchievements = useCallback(
    async (achievementIds: string[]) => {
      if (!nftAddress) {
        toast({
          title: 'Error',
          description: 'Achievement NFT contract not deployed on this network',
          variant: 'destructive'
        })
        return
      }

      if (!address) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet',
          variant: 'destructive'
        })
        return
      }

      try {
        const config: TransactionConfig = {
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'batchMintAchievements',
          args: [address, achievementIds],
          chainId
        }

        const hash = await executeTransaction(config, {
          messages: {
            pendingMessage: 'Minting multiple achievements...',
            processingMessage: 'Processing batch mint...',
            confirmedMessage: 'All achievements minted successfully!',
            failedMessage: 'Failed to mint achievements'
          },
          onSuccess: (_txHash: string) => {
            toast({
              title: 'Multiple Achievements Unlocked!',
              description: `You've earned ${achievementIds.length} achievements!`
            })
            // Update local state
            setUserAchievements(prev => [...prev, ...achievementIds])
          },
          onError: (error: Error) => {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive'
            })
          }
        })

        return hash
      } catch (error) {
        console.error('Failed to batch mint achievements:', error)
        throw error
      }
    },
    [nftAddress, address, selectedChainId, executeTransaction, toast]
  )

  const updateProgress = useCallback(
    async (achievementId: string, progress: number) => {
      if (!nftAddress) {
        toast({
          title: 'Error',
          description: 'Achievement NFT contract not deployed on this network',
          variant: 'destructive'
        })
        return
      }

      if (!address) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet',
          variant: 'destructive'
        })
        return
      }

      try {
        const config: TransactionConfig = {
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'updateUserProgress',
          args: [address, achievementId, progress],
          chainId
        }

        const hash = await executeTransaction(config, {
          messages: {
            pendingMessage: 'Updating achievement progress...',
            processingMessage: 'Processing progress update...',
            confirmedMessage: 'Progress updated!',
            failedMessage: 'Failed to update progress'
          },
          showToast: false, // Don't show toast for progress updates
          onSuccess: () => {
            // Update local state
            setUserProgress(prev => new Map(prev).set(achievementId, progress))
          }
        })

        return hash
      } catch (error) {
        console.error('Failed to update progress:', error)
        throw error
      }
    },
    [nftAddress, address, selectedChainId, executeTransaction, toast]
  )

  const incrementProgress = useCallback(
    async (achievementId: string, amount: number = 1) => {
      if (!nftAddress) {
        toast({
          title: 'Error',
          description: 'Achievement NFT contract not deployed on this network',
          variant: 'destructive'
        })
        return
      }

      if (!address) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet',
          variant: 'destructive'
        })
        return
      }

      try {
        const config: TransactionConfig = {
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'incrementUserProgress',
          args: [address, achievementId, amount],
          chainId
        }

        const hash = await executeTransaction(config, {
          messages: {
            pendingMessage: 'Updating achievement progress...',
            processingMessage: 'Processing progress update...',
            confirmedMessage: 'Progress updated!',
            failedMessage: 'Failed to update progress'
          },
          showToast: false, // Don't show toast for progress updates
          onSuccess: () => {
            // Update local state
            const currentProgress = userProgress.get(achievementId) || 0
            setUserProgress(prev =>
              new Map(prev).set(achievementId, currentProgress + amount)
            )
          }
        })

        return hash
      } catch (error) {
        console.error('Failed to increment progress:', error)
        throw error
      }
    },
    [
      nftAddress,
      address,
      selectedChainId,
      executeTransaction,
      toast,
      userProgress
    ]
  )

  const hasAchievement = useCallback(
    (achievementId: string): boolean => {
      return userAchievements.includes(achievementId)
    },
    [userAchievements]
  )

  const getProgress = useCallback(
    (achievementId: string): number => {
      return userProgress.get(achievementId) || 0
    },
    [userProgress]
  )

  // Check if user can mint an achievement (has met requirements)
  const canMintAchievement = useCallback(
    async (_achievementId: string): Promise<boolean> => {
      if (!nftAddress || !address) return false

      try {
        // This would typically call a view function on the contract
        // For now, we'll assume the check is done on-chain during minting
        return true
      } catch {
        return false
      }
    },
    [nftAddress, address]
  )

  // Get achievements by category
  const getAchievementsByCategory = useCallback(
    async (category: AchievementCategory): Promise<string[]> => {
      if (!nftAddress) return []

      try {
        const { getPublicClient } = await import(
          '@/lib/blockchain/blockchain-transaction'
        )
        const publicClient = getPublicClient(selectedChainId)

        if (!publicClient) return []

        const achievementIds = await publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'getAchievementsByCategory',
          args: [category]
        })

        return achievementIds as string[]
      } catch (error) {
        console.error('Failed to get achievements by category:', error)
        return []
      }
    },
    [nftAddress, selectedChainId]
  )

  // Get all achievements with pagination
  const getAllAchievements = useCallback(
    async (offset: number = 0, limit: number = 10) => {
      if (!nftAddress) return null

      try {
        const { getPublicClient } = await import(
          '@/lib/blockchain/blockchain-transaction'
        )
        const publicClient = getPublicClient(selectedChainId)

        if (!publicClient) return null

        const result = await publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'getAllAchievements',
          args: [offset, limit]
        })

        const [ids, names, categories, rarities, actives, total] = result as [
          string[],
          string[],
          number[],
          number[],
          boolean[],
          bigint
        ]

        return {
          achievements: ids.map((id, index) => ({
            id,
            name: names[index],
            category: categories[index] as AchievementCategory,
            rarity: rarities[index] as AchievementRarity,
            active: actives[index]
          })),
          total: Number(total)
        }
      } catch (error) {
        console.error('Failed to get all achievements:', error)
        return null
      }
    },
    [nftAddress, selectedChainId]
  )

  // Get user achievement statistics
  const getUserAchievementStats = useCallback(
    async (userAddress?: string): Promise<AchievementStats | null> => {
      if (!nftAddress) return null
      const targetAddress = userAddress || address
      if (!targetAddress) return null

      try {
        const { getPublicClient } = await import(
          '@/lib/blockchain/blockchain-transaction'
        )
        const publicClient = getPublicClient(selectedChainId)

        if (!publicClient) return null

        const result = await publicClient.readContract({
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'getUserAchievementStats',
          args: [targetAddress]
        })

        const [totalAchievements, totalXP, totalCombatPower, completionRate] =
          result as [bigint, bigint, bigint, bigint]

        return {
          totalAchievements: Number(totalAchievements),
          totalXP: Number(totalXP),
          totalCombatPower: Number(totalCombatPower),
          completionRate: Number(completionRate)
        }
      } catch (error) {
        console.error('Failed to get user achievement stats:', error)
        return null
      }
    },
    [nftAddress, address, selectedChainId]
  )

  // Format XP and Combat Power for display
  const formatStats = useCallback(() => {
    return {
      xp: userTotalXP ? Number(userTotalXP) : 0,
      combatPower: userTotalCombatPower ? Number(userTotalCombatPower) : 0
    }
  }, [userTotalXP, userTotalCombatPower])

  // Batch create achievements (admin only)
  const batchCreateAchievements = useCallback(
    async (data: BatchAchievementData) => {
      if (!nftAddress) {
        toast({
          title: 'Error',
          description: 'Achievement NFT contract not deployed on this network',
          variant: 'destructive'
        })
        return
      }

      try {
        const config: TransactionConfig = {
          address: nftAddress as `0x${string}`,
          abi: ACHIEVEMENT_NFT_ABI,
          functionName: 'batchCreateAchievements',
          args: [
            data.achievementIds,
            data.names,
            data.descriptions,
            data.categories,
            data.rarities,
            data.xpRewards,
            data.combatPowerRewards,
            data.requirements,
            data.metadataURIs
          ],
          chainId: selectedChainId
        }

        const hash = await executeTransaction(config, {
          messages: {
            pendingMessage: 'Creating achievements...',
            processingMessage: 'Processing batch creation...',
            confirmedMessage: 'Achievements created successfully!',
            failedMessage: 'Failed to create achievements'
          },
          onSuccess: (_txHash: string) => {
            toast({
              title: 'Success',
              description: `Created ${data.achievementIds.length} achievements`
            })
          },
          onError: (error: Error) => {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive'
            })
          }
        })

        return hash
      } catch (error) {
        console.error('Failed to batch create achievements:', error)
        throw error
      }
    },
    [nftAddress, selectedChainId, executeTransaction, toast]
  )

  return {
    mintAchievement,
    batchMintAchievements,
    batchCreateAchievements,
    updateProgress,
    incrementProgress,
    hasAchievement,
    getProgress,
    canMintAchievement,
    getAchievementsByCategory,
    getAllAchievements,
    getUserAchievementStats,
    formatStats,
    userAchievements,
    userProgress,
    isLoading: isExecuting,
    userTotalXP: formatStats().xp,
    userTotalCombatPower: formatStats().combatPower
  }
}
