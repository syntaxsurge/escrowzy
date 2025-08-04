'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { Network } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { isWalletProvider, WalletProviders } from '@/config/wallet-provider'
import { useUnifiedChainInfo, useNetwork } from '@/context'
import { useDialogState } from '@/hooks/use-dialog-state'
import { cn } from '@/lib'
import {
  DEFAULT_CHAIN_ID,
  isSupportedChainId,
  SUPPORTED_NETWORKS,
  type SupportedChainIds
} from '@/lib/blockchain'

// Dynamically import provider-specific components
const ThirdwebNetworkButton = dynamic(
  () =>
    import('thirdweb/react').then(mod => ({
      default: function ThirdwebNetwork() {
        const activeChain = mod.useActiveWalletChain()
        const networkSwitcher = mod.useNetworkSwitcherModal()
        const { thirdwebClient } = require('@/lib/blockchain/thirdweb-client')
        const {
          getThirdwebMainnets,
          getThirdwebTestnets
        } = require('@/lib/blockchain')

        const mainnets = getThirdwebMainnets()
        const testnets = getThirdwebTestnets()

        if (!activeChain) return null

        return (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              networkSwitcher.open({
                client: thirdwebClient,
                sections: [
                  ...(mainnets.length > 0
                    ? [
                        {
                          label: 'Mainnets',
                          chains: mainnets
                        }
                      ]
                    : []),
                  ...(testnets.length > 0
                    ? [
                        {
                          label: 'Testnets',
                          chains: testnets
                        }
                      ]
                    : [])
                ]
              })
            }}
            className='hover:bg-accent/50 border-border bg-background/50 hover:border-accent flex h-10 items-center gap-2 rounded-xl border px-4 py-2 transition-all'
          >
            <div className='flex items-center gap-3'>
              <mod.ChainProvider chain={activeChain}>
                <div className='bg-muted flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg'>
                  <mod.ChainIcon
                    client={thirdwebClient}
                    className='h-4 w-4 flex-shrink-0'
                    loadingComponent={
                      <div className='h-4 w-4 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600' />
                    }
                  />
                </div>
              </mod.ChainProvider>
              <span className='text-foreground hidden text-sm font-medium sm:inline'>
                {activeChain.name || `Chain ${activeChain.id}`}
              </span>
            </div>
          </Button>
        )
      }
    })),
  { ssr: false }
)

const RainbowKitNetworkButton = dynamic(
  () =>
    import('@rainbow-me/rainbowkit').then(mod => ({
      default: function RainbowKitNetwork() {
        return (
          <mod.ConnectButton.Custom>
            {({ chain, openChainModal }) =>
              chain && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={openChainModal}
                  className='hover:bg-accent/50 border-border bg-background/50 hover:border-accent flex h-10 items-center gap-2 rounded-xl border px-4 py-2 transition-all'
                >
                  <div className='flex items-center gap-3'>
                    {chain.hasIcon && (
                      <div className='bg-muted flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg'>
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className='h-4 w-4'
                          />
                        )}
                      </div>
                    )}
                    <span className='text-foreground hidden text-sm font-medium sm:inline'>
                      {chain.name || 'Unknown Chain'}
                    </span>
                  </div>
                </Button>
              )
            }
          </mod.ConnectButton.Custom>
        )
      }
    })),
  { ssr: false }
)

interface NetworkSelectorProps {
  className?: string
  showLabel?: boolean
  isAuthenticated?: boolean
}

export function NetworkSelector({
  className,
  showLabel = true,
  isAuthenticated = false
}: NetworkSelectorProps) {
  const { chainId } = useUnifiedChainInfo()
  const menuState = useDialogState()
  const { selectedChainId, setSelectedChainId } = useNetwork()

  // Update network context when wallet chain changes
  useEffect(() => {
    if (chainId && isSupportedChainId(chainId)) {
      setSelectedChainId(chainId as SupportedChainIds)
    }
  }, [chainId, setSelectedChainId])

  // If wallet is connected, use provider-specific network button
  if (chainId) {
    if (isWalletProvider(WalletProviders.THIRDWEB)) {
      return <ThirdwebNetworkButton />
    } else if (isWalletProvider(WalletProviders.RAINBOW_KIT)) {
      return <RainbowKitNetworkButton />
    }
  }

  // Fallback network selector for when wallet is not connected
  const currentNetwork = isSupportedChainId(selectedChainId)
    ? SUPPORTED_NETWORKS[selectedChainId]
    : SUPPORTED_NETWORKS[DEFAULT_CHAIN_ID as SupportedChainIds]

  return (
    <DropdownMenu
      open={menuState.isOpen}
      onOpenChange={open => (open ? menuState.open() : menuState.close())}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={cn(
            'hover:bg-accent/50 border-border bg-background/50 hover:border-accent flex h-10 items-center gap-2 rounded-xl border px-4 py-2 transition-all',
            className
          )}
        >
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex h-6 w-6 items-center justify-center rounded-lg'>
              <Network className='text-muted-foreground h-3.5 w-3.5' />
            </div>
            {showLabel && (
              <span className='text-foreground hidden text-sm font-medium sm:inline'>
                {currentNetwork?.name || 'Select Network'}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='border-border bg-background/95 mt-2 w-64 rounded-xl border shadow-xl backdrop-blur-xl'
      >
        <div className='p-2'>
          <div className='mb-2 px-3 py-2'>
            <div className='text-muted-foreground flex items-center justify-between text-xs font-medium'>
              <span>Network</span>
              <span>Chain ID</span>
            </div>
          </div>
          {Object.entries(SUPPORTED_NETWORKS).map(([id, network]) => (
            <DropdownMenuItem
              key={id}
              onClick={() => {
                setSelectedChainId(Number(id) as SupportedChainIds)
                menuState.close()
              }}
              className={cn(
                'hover:bg-accent cursor-pointer rounded-lg px-3 py-3 transition-all',
                selectedChainId === Number(id) &&
                  'bg-primary/10 text-primary hover:bg-primary/15'
              )}
            >
              <div className='flex w-full items-center justify-between'>
                <div className='flex items-center gap-3'>
                  {isAuthenticated && (
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        selectedChainId === Number(id)
                          ? 'bg-primary/20'
                          : 'bg-muted'
                      )}
                    >
                      <Network
                        className={cn(
                          'h-4 w-4',
                          selectedChainId === Number(id)
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                    </div>
                  )}
                  <span className='text-sm font-medium'>{network.name}</span>
                </div>
                <span className='text-muted-foreground text-sm font-medium'>
                  {id}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
