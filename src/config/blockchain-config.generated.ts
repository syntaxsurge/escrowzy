// This file is auto-generated. Do not edit directly.
// Generated from: ./config/blockchains.yaml

import type { BlockchainConfig } from './blockchain-config-loader'

export const blockchainConfig: BlockchainConfig = {
  subscriptionPricing: {
    pro: 3,
    enterprise: 5
  },
  chains: {
    etherlinkTestnet: {
      chainId: 128123,
      name: 'Etherlink Testnet',
      rpcUrl: 'https://node.ghostnet.etherlink.com',
      explorerUrl: 'https://testnet.explorer.etherlink.com',
      nativeCurrency: {
        name: 'Tezos',
        symbol: 'XTZ',
        decimals: 18
      },
      coingeckoId: 'tezos',
      isTestnet: true,
      contractAddresses: {
        subscriptionManager: '0x4AD722AEFf2D98ABB879aA4f7E907659263C3641',
        escrowCore: '0x8b1B9DCa3dAc6A2fb0AE3518D1e33DC277fc7B25',
        achievementNFT: '0xee946764766Fa09e54794F2a0aA3CB3A133e163E'
      }
    },
    etherlink: {
      chainId: 42793,
      name: 'Etherlink',
      rpcUrl: 'https://node.mainnet.etherlink.com',
      explorerUrl: 'https://explorer.etherlink.com',
      nativeCurrency: {
        name: 'Tezos',
        symbol: 'XTZ',
        decimals: 18
      },
      coingeckoId: 'tezos',
      isTestnet: false,
      contractAddresses: {
        subscriptionManager: '',
        escrowCore: '',
        achievementNFT: ''
      }
    }
  }
}
