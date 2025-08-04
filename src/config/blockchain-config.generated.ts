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
        subscriptionManager: '0x7b35F0D7322dfcd53204187679Ca6355d384dfec',
        escrowCore: '0xdd665d880F44DAa5B3d18b8a8085def1aa3A9180',
        achievementNFT: '0x8dACe4BE3d1D4c12523E68e2C7f1e0FD5C27d244'
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
