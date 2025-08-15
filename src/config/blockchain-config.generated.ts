// This file is auto-generated. Do not edit directly.
// Generated from: ./config/blockchains.yaml

import type { BlockchainConfig } from './blockchain-config-loader'

export const blockchainConfig: BlockchainConfig = {
  subscriptionPricing: {
    pro: 3,
    enterprise: 5
  },
  chains: {
    coreTestnet: {
      chainId: 1114,
      name: 'Core Testnet',
      rpcUrl: 'https://rpc.test2.btcs.network',
      explorerUrl: 'https://scan.test2.btcs.network',
      logo: 'https://scan.coredao.org/static/media/logo.c1d0f86f4f44fb96e27e.svg',
      nativeCurrency: {
        name: 'Core',
        symbol: 'tCORE',
        decimals: 18
      },
      coingeckoId: 'coredao',
      isTestnet: true,
      contractAddresses: {
        subscriptionManager: '0x761D0dbB45654513AdF1BF6b5D217C0f8B3c5737',
        escrowCore: '0x27E9062ee91A0D60De39984346cAeD53bE68024c',
        achievementNFT: '0x158E396020b4A86f351D766fC7748C862c493b6B'
      }
    },
    coreMainnet: {
      chainId: 1116,
      name: 'Core',
      rpcUrl: 'https://rpc.coredao.org',
      explorerUrl: 'https://scan.coredao.org',
      logo: 'https://scan.coredao.org/static/media/logo.c1d0f86f4f44fb96e27e.svg',
      nativeCurrency: {
        name: 'Core',
        symbol: 'CORE',
        decimals: 18
      },
      coingeckoId: 'coredao',
      isTestnet: false,
      contractAddresses: {
        subscriptionManager: '',
        escrowCore: '',
        achievementNFT: ''
      }
    }
  }
}
