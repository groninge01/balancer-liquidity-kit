import type { Address } from './types'

export type ChainConfig = {
  chainId: number
  name: string
  vault: Address
  supportsPermit2: boolean
  supportsV2: boolean
  supportsV3: boolean
}

const V2_VAULT: Address = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const PERMIT2: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export const supportedChains: readonly ChainConfig[] = [
  { chainId: 1, name: 'Ethereum', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 10, name: 'Optimism', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 100, name: 'Gnosis Chain', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 137, name: 'Polygon', vault: V2_VAULT, supportsPermit2: false, supportsV2: true, supportsV3: false },
  { chainId: 8453, name: 'Base', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 42161, name: 'Arbitrum One', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 43114, name: 'Avalanche', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 11155111, name: 'Sepolia', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
  { chainId: 143, name: 'Monad', vault: ZERO_ADDRESS, supportsPermit2: true, supportsV2: false, supportsV3: true },
  { chainId: 999, name: 'HyperEVM', vault: ZERO_ADDRESS, supportsPermit2: true, supportsV2: false, supportsV3: true },
  { chainId: 9745, name: 'Plasma', vault: V2_VAULT, supportsPermit2: true, supportsV2: true, supportsV3: true },
] as const

export const permit2Address = PERMIT2

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return supportedChains.find((c) => c.chainId === chainId)
}

export function isSupportedChain(chainId: number): boolean {
  return getChainConfig(chainId) !== undefined
}
