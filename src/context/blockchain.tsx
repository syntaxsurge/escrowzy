'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode
} from 'react'

import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useDisconnect as useThirdwebDisconnect
} from 'thirdweb/react'
import { formatUnits } from 'viem'
import {
  useAccount,
  useBalance,
  useChainId,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
  useWalletClient
} from 'wagmi'

import { getWalletProvider, WalletProviders } from '@/config/wallet-provider'
import { getChainConfig, getNativeCurrencySymbol } from '@/lib/blockchain'

interface BlockchainContextValue {
  // Wallet info
  address?: string
  isConnected: boolean
  balance?: any
  formattedBalance: string
  disconnect: () => void

  // Chain info
  chainId?: number

  // Auth functions
  signMessage: (message: string) => Promise<string>

  // Transaction functions
  walletClient?: any
  switchChain?: (chainId: number) => Promise<void>

  // Account change detection
  onAddressChange?: (
    callback: (newAddress?: string, oldAddress?: string) => void
  ) => void
}

const BlockchainContext = createContext<BlockchainContextValue | null>(null)

// ThirdWeb implementation
function ThirdwebBlockchainProvider({ children }: { children: ReactNode }) {
  const thirdwebAccount = useActiveAccount()
  const thirdwebWallet = useActiveWallet()
  const activeChain = useActiveWalletChain()
  const { disconnect: thirdwebDisconnect } = useThirdwebDisconnect()

  // Track previous address to detect changes
  const prevAddressRef = useRef<string | undefined>(undefined)
  const addressChangeCallbackRef = useRef<
    ((newAddress?: string, oldAddress?: string) => void) | null
  >(null)

  const chainId = activeChain?.id
  const nativeCurrencySymbol = chainId
    ? getNativeCurrencySymbol(chainId)
    : 'ETH'

  // Detect address changes
  useEffect(() => {
    const currentAddress = thirdwebAccount?.address
    const prevAddress = prevAddressRef.current

    if (currentAddress !== prevAddress) {
      console.log('ThirdWeb account changed:', {
        from: prevAddress,
        to: currentAddress
      })

      // Call the registered callback if it exists
      if (addressChangeCallbackRef.current) {
        addressChangeCallbackRef.current(currentAddress, prevAddress)
      }

      prevAddressRef.current = currentAddress
    }
  }, [thirdwebAccount?.address])

  const contextValue: BlockchainContextValue = {
    address: thirdwebAccount?.address,
    isConnected: !!thirdwebAccount,
    balance: undefined,
    formattedBalance: `0 ${nativeCurrencySymbol}`,
    disconnect: () => {
      if (thirdwebWallet) {
        thirdwebDisconnect(thirdwebWallet)
      }
    },
    chainId,
    signMessage: async (message: string) => {
      if (!thirdwebAccount) throw new Error('No active account')
      return await thirdwebAccount.signMessage({ message })
    },
    walletClient: thirdwebAccount,
    switchChain: async (newChainId: number) => {
      if (thirdwebWallet && thirdwebWallet.switchChain) {
        // Define chain directly without importing from server
        const { defineChain } = await import('thirdweb')
        const chainConfig = getChainConfig(newChainId)

        if (chainConfig) {
          const thirdwebChain = defineChain({
            id: newChainId,
            name: chainConfig.name,
            rpc: chainConfig.rpcUrl
          })
          await thirdwebWallet.switchChain(thirdwebChain)
          return
        }
        throw new Error(`Chain ${newChainId} not supported`)
      }
      throw new Error('Chain switching not supported')
    },
    onAddressChange: callback => {
      addressChangeCallbackRef.current = callback
    }
  }

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  )
}

// Wagmi implementation
function WagmiBlockchainProvider({ children }: { children: ReactNode }) {
  const wagmiAccount = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const wagmiChainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const wagmiBalance = wagmiAccount?.address
    ? useBalance({ address: wagmiAccount.address })
    : null

  // Track previous address to detect changes
  const prevAddressRef = useRef<string | undefined>(undefined)
  const addressChangeCallbackRef = useRef<
    ((newAddress?: string, oldAddress?: string) => void) | null
  >(null)

  const nativeCurrencySymbol = wagmiChainId
    ? getNativeCurrencySymbol(wagmiChainId)
    : 'ETH'

  // Detect address changes
  useEffect(() => {
    const currentAddress = wagmiAccount?.address
    const prevAddress = prevAddressRef.current

    if (currentAddress !== prevAddress) {
      console.log('Wagmi account changed:', {
        from: prevAddress,
        to: currentAddress
      })

      // Call the registered callback if it exists
      if (addressChangeCallbackRef.current) {
        addressChangeCallbackRef.current(currentAddress, prevAddress)
      }

      prevAddressRef.current = currentAddress
    }
  }, [wagmiAccount?.address])

  const contextValue: BlockchainContextValue = {
    address: wagmiAccount?.address,
    isConnected: wagmiAccount?.isConnected || false,
    balance: wagmiBalance?.data,
    formattedBalance: wagmiBalance?.data
      ? `${formatUnits(wagmiBalance.data.value, wagmiBalance.data.decimals)} ${wagmiBalance.data.symbol}`
      : `0 ${nativeCurrencySymbol}`,
    disconnect: wagmiDisconnect,
    chainId: wagmiChainId,
    signMessage: async (message: string) => {
      if (!signMessageAsync) throw new Error('Wagmi provider not available')
      return await signMessageAsync({ message })
    },
    walletClient,
    switchChain: switchChainAsync
      ? async (chainId: number) => {
          await switchChainAsync({ chainId })
        }
      : undefined,
    onAddressChange: callback => {
      addressChangeCallbackRef.current = callback
    }
  }

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  )
}

// Main provider that chooses the right implementation
export function BlockchainProvider({ children }: { children: ReactNode }) {
  const walletProvider = getWalletProvider()

  switch (walletProvider) {
    case WalletProviders.THIRDWEB:
      return <ThirdwebBlockchainProvider>{children}</ThirdwebBlockchainProvider>
    case WalletProviders.RAINBOW_KIT:
      return <WagmiBlockchainProvider>{children}</WagmiBlockchainProvider>
    default:
      throw new Error(`Unsupported wallet provider: ${walletProvider}`)
  }
}

// Main hook to access blockchain functionality
export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider')
  }
  return context
}

// Export specific hooks for convenience
export function useUnifiedWalletInfo() {
  const {
    address,
    isConnected,
    balance,
    formattedBalance,
    disconnect,
    onAddressChange
  } = useBlockchain()
  return {
    address,
    isConnected,
    balance,
    formattedBalance,
    disconnect,
    onAddressChange
  }
}

export function useUnifiedChainInfo() {
  const { chainId } = useBlockchain()
  return { chainId }
}
