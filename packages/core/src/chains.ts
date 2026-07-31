import type { Address } from './types'

export type ChainConfig = {
  chainId: number
  name: string
  vault: Address
  supportsPermit2: boolean
}

const V2_VAULT: Address = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'

export const supportedChains: readonly ChainConfig[] = [
  { chainId: 1, name: 'Ethereum', vault: V2_VAULT, supportsPermit2: true },
] as const

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return supportedChains.find((c) => c.chainId === chainId)
}

export function isSupportedChain(chainId: number): boolean {
  return getChainConfig(chainId) !== undefined
}
