import type { Chain } from 'thirdweb'
import { defineChain as defineThirdwebChain } from 'thirdweb'
import { defineChain as defineViemChain } from 'viem'

import { loadBlockchainConfig } from '@/config/blockchain-config-loader'

import AchievementNFTArtifact from '../../../contracts/out/AchievementNFT.sol/AchievementNFT.json'
import EscrowCoreArtifact from '../../../contracts/out/EscrowCore.sol/EscrowCore.json'
import SubscriptionManagerArtifact from '../../../contracts/out/SubscriptionManager.sol/SubscriptionManager.json'

// Extract ABIs from artifacts
export const SUBSCRIPTION_MANAGER_ABI = SubscriptionManagerArtifact.abi
export const ESCROW_CORE_ABI = EscrowCoreArtifact.abi
export const ACHIEVEMENT_NFT_ABI = AchievementNFTArtifact.abi

/* ────────────────────────────────────────────────────────────
 * 1️⃣  Load & cache the (already validated) YAML → TS config
 *     This runs **once per Node process** (and once in the
 *     browser at bundle-eval time).                              */
export const RAW_BLOCKCHAIN_CFG = loadBlockchainConfig()

/* ────────────────────────────────────────────────────────────
 * 2️⃣  Build two maps in ONE pass:
 *     • CHAIN_MAP   – full “heavy” meta  (server only)
 *     • PUBLIC_CHAINS – trimmed browser-safe slice             */

type Native = { name: string; symbol: string; decimals: number }

interface ChainMeta {
  chainId: number
  name: string
  symbol: string
  coingeckoId: string
  explorerUrl: string
  rpcUrl: string
  nativeCurrency: Native
  contractAddress: string
  escrowCoreAddress: string
  achievementNFTAddress: string
  viemChain: ReturnType<typeof defineViemChain>
  thirdwebChain: Chain
  isTestnet: boolean
}
type ChainMap = Record<number, ChainMeta>
type PublicChainMap = Record<
  string,
  {
    /** camel-cased YAML key e.g. `"baseSepolia"` */
    chainId: number
    name: string
    rpcUrl: string
    explorerUrl: string
    nativeCurrency: Native
    coingeckoId: string
    isTestnet: boolean
    contractAddresses: {
      subscriptionManager: string
      escrowCore?: string
      achievementNFT?: string
    }
  }
>

/* Build once (IIFE) – no extra work on later imports. */
const heavy: ChainMap = {}
const client: PublicChainMap = {}

for (const [yamlKey, c] of Object.entries(RAW_BLOCKCHAIN_CFG.chains)) {
  /* expensive objects generated ONCE */
  const viem = defineViemChain({
    id: c.chainId,
    name: c.name,
    nativeCurrency: c.nativeCurrency,
    rpcUrls: { default: { http: [c.rpcUrl] } },
    blockExplorers: { default: { name: c.name, url: c.explorerUrl } },
    testnet: c.isTestnet
  })

  const third = defineThirdwebChain({
    id: c.chainId,
    name: c.name,
    nativeCurrency: c.nativeCurrency,
    blockExplorers: [{ name: c.name, url: c.explorerUrl }],
    ...(c.isTestnet ? { testnet: true } : {}),
    rpc: c.rpcUrl
  } as const)

  /* heavy map (⤵ never shipped to browser) */
  heavy[c.chainId] = {
    chainId: c.chainId,
    name: c.name,
    symbol: c.nativeCurrency.symbol,
    coingeckoId: c.coingeckoId,
    explorerUrl: c.explorerUrl,
    rpcUrl: c.rpcUrl,
    nativeCurrency: c.nativeCurrency,
    contractAddress: c.contractAddresses.subscriptionManager,
    escrowCoreAddress: c.contractAddresses.escrowCore || '',
    achievementNFTAddress: c.contractAddresses.achievementNFT || '',
    viemChain: viem,
    thirdwebChain: third,
    isTestnet: !!c.isTestnet
  }

  /* browser-safe slice (🚚 bundled) */
  client[yamlKey] = {
    chainId: c.chainId,
    name: c.name,
    rpcUrl: c.rpcUrl,
    explorerUrl: c.explorerUrl,
    nativeCurrency: c.nativeCurrency,
    coingeckoId: c.coingeckoId,
    isTestnet: !!c.isTestnet,
    contractAddresses: {
      subscriptionManager: c.contractAddresses.subscriptionManager,
      escrowCore: c.contractAddresses.escrowCore || '',
      achievementNFT: c.contractAddresses.achievementNFT || ''
    }
  }
}

export const CHAIN_MAP = heavy // full meta (Node-only)
export const PUBLIC_CHAINS = client // safe for client bundles

/* ────────────────────────────────────────────────────────────
 * 3️⃣  Derived constants (computed once)                      */

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_MAP).map(Number)
/** TS-friendly union type */
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number]

/** Default chain ⇒ first with a deployed contract else first in list */
export const DEFAULT_CHAIN_ID =
  Object.values(CHAIN_MAP).find(c => c.contractAddress)?.chainId ??
  SUPPORTED_CHAIN_IDS[0]

/* mapping */
const CHAIN_NICKNAMES: Record<number, string> = (() => {
  const out: Record<number, string> = {}
  for (const [key, c] of Object.entries(RAW_BLOCKCHAIN_CFG.chains)) {
    out[c.chainId] = key.charAt(0).toLowerCase() + key.slice(1)
  }
  return out
})()

/* Pre-built thirdweb arrays */
const THIRDWEB_ALL = SUPPORTED_CHAIN_IDS.map(id => CHAIN_MAP[id].thirdwebChain)
const THIRDWEB_MAINNETS = THIRDWEB_ALL.filter(c => !(c as any).testnet)
const THIRDWEB_TESTNETS = THIRDWEB_ALL.filter(c => (c as any).testnet)

/* ────────────────────────────────────────────────────────────
 * 4️⃣  Zero-cost helper functions                            */

/* ---------- primary helpers ---------- */

/**
 * Full heavy config (avoid shipping to browser).
 */
export const getChainConfig = (id: number) => CHAIN_MAP[id]

/** YAML key (camelCase nickname). */
export const getChainNickname = (id: number) => CHAIN_NICKNAMES[id] ?? ''
/** "ETH", "XTZ" … */
export const getNativeCurrencySymbol = (id: number) =>
  CHAIN_MAP[id]?.symbol ?? 'ETH'
/** 18 (default) or chain-specific decimals. */
export const getNativeCurrencyDecimals = (id: number) =>
  CHAIN_MAP[id]?.nativeCurrency.decimals ?? 18
/** RPC HTTP URL. */
export const getRpcUrl = (id: number) => CHAIN_MAP[id]?.rpcUrl ?? ''
/** Block-explorer root URL. */
export const getExplorerUrl = (id: number) => CHAIN_MAP[id]?.explorerUrl ?? ''
/** SubscriptionManager address (may be ''). */
export const getSubscriptionManagerAddress = (id: number) =>
  CHAIN_MAP[id]?.contractAddress ?? ''
/** EscrowCore address (may be ''). */
export const getEscrowCoreAddress = (id: number) =>
  CHAIN_MAP[id]?.escrowCoreAddress ?? ''
/** AchievementNFT address (may be ''). */
export const getAchievementNFTAddress = (id: number) =>
  CHAIN_MAP[id]?.achievementNFTAddress ?? ''
/** Heavy `viem` Chain object. */
export const getViemChain = (id: number) => CHAIN_MAP[id]?.viemChain
/** Heavy `thirdweb` Chain object. */
export const getThirdwebChain = (id: number) => CHAIN_MAP[id]?.thirdwebChain
/** Coingecko token slug ("ethereum", "tezos" …). */
export const getCoingeckoPriceId = (id: number) =>
  CHAIN_MAP[id]?.coingeckoId ?? ''

/* ---------- meta ---------- */

export const getSupportedChainIds = () => SUPPORTED_CHAIN_IDS
export const isSupportedChainId = (id: number) => id in CHAIN_MAP

/**
 * Build a full explorer URL for a transaction.
 * Will still work client-side because only public data is used.
 *
 * @param chainId – numeric chain id
 * @param txHash  – 0x-prefixed transaction hash
 */
export const buildTxUrl = (chainId: number, txHash: string): string =>
  `${getExplorerUrl(chainId)}/tx/${txHash}`

/* ---------- thirdweb convenience ---------- */

export const getSupportedThirdwebChains = () => THIRDWEB_ALL
export const getThirdwebMainnets = () => THIRDWEB_MAINNETS
export const getThirdwebTestnets = () => THIRDWEB_TESTNETS

/* ---------- misc ---------- */

/** YAML network key (e.g. "etherlinkTestnet") given a chainId. */
export const networkKeyFromChainId = (id: number) =>
  Object.entries(RAW_BLOCKCHAIN_CFG.chains).find(
    ([, c]) => c.chainId === id
  )?.[0]

/**
 * Browser-safe slim config keyed by **numeric** chainId.
 * Returns new *references* (not cloned) but underlying objects
 * are immutable so that's safe.
 */
export const getBlockchainConfig = () => ({
  chains: Object.fromEntries(
    SUPPORTED_CHAIN_IDS.map(id => [
      id,
      {
        rpcUrl: CHAIN_MAP[id].rpcUrl,
        contractAddresses: {
          subscriptionManager: CHAIN_MAP[id].contractAddress,
          escrowCore: CHAIN_MAP[id].escrowCoreAddress,
          achievementNFT: CHAIN_MAP[id].achievementNFTAddress
        }
      }
    ])
  ),
  subscriptionPricing: RAW_BLOCKCHAIN_CFG.subscriptionPricing
})

/* ────────────────────────────────────────────────────────────
 * 5️⃣  Client-side network configuration                      */

export type SupportedChainIds = SupportedChainId

export const SUPPORTED_NETWORKS = Object.entries(PUBLIC_CHAINS).reduce(
  (acc, [_chainKey, chain]) => {
    acc[chain.chainId as SupportedChainIds] = {
      name: chain.name,
      nativeCurrency: chain.nativeCurrency.symbol,
      coingeckoId: chain.coingeckoId,
      contractAddress: chain.contractAddresses.subscriptionManager || '',
      escrowCore: chain.contractAddresses.escrowCore || '',
      achievementNFT: chain.contractAddresses.achievementNFT || ''
    }
    return acc
  },
  {} as Record<
    SupportedChainIds,
    {
      name: string
      nativeCurrency: string
      coingeckoId: string
      contractAddress: string
      escrowCore?: string
      achievementNFT?: string
    }
  >
)
