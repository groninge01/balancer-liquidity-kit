import type { Address } from './types'

export type ChainConfig = {
  chainId: number
  name: string
  vault: Address
  supportsPermit2: boolean
  protocolVersion: 2 | 3
}

const V2_VAULT: Address = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
const FANTOM_VAULT: Address = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce'
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const PERMIT2: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export const supportedChains: readonly ChainConfig[] = [
  { chainId: 1, name: 'Ethereum', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 10, name: 'Optimism', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 100, name: 'Gnosis Chain', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 137, name: 'Polygon', vault: V2_VAULT, supportsPermit2: false, protocolVersion: 2 },
  { chainId: 146, name: 'Sonic', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 250, name: 'Fantom', vault: FANTOM_VAULT, supportsPermit2: false, protocolVersion: 2 },
  { chainId: 252, name: 'Fraxtal', vault: V2_VAULT, supportsPermit2: false, protocolVersion: 2 },
  { chainId: 8453, name: 'Base', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 34443, name: 'Mode', vault: V2_VAULT, supportsPermit2: false, protocolVersion: 2 },
  { chainId: 42161, name: 'Arbitrum One', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 43114, name: 'Avalanche', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 11155111, name: 'Sepolia', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 2 },
  { chainId: 143, name: 'Monad', vault: ZERO_ADDRESS, supportsPermit2: true, protocolVersion: 3 },
  { chainId: 999, name: 'HyperEVM', vault: ZERO_ADDRESS, supportsPermit2: true, protocolVersion: 3 },
  { chainId: 9745, name: 'Plasma', vault: V2_VAULT, supportsPermit2: true, protocolVersion: 3 },
  { chainId: 196, name: 'X Layer', vault: ZERO_ADDRESS, supportsPermit2: true, protocolVersion: 3 },
] as const

export const permit2Address = PERMIT2

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return supportedChains.find((c) => c.chainId === chainId)
}

export function isSupportedChain(chainId: number): boolean {
  return getChainConfig(chainId) !== undefined
}
