import { ZERO_ADDRESS, VAULT_V2, PERMIT2, AddressProvider, type Address } from '@balancer/sdk'

export type ChainConfig = {
  chainId: number
  name: string
  vaultV2: Address
  vaultV3: Address
  permit2: Address
  supportsV2: boolean
  supportsV3: boolean
}

function buildChainConfig(chainId: number, name: string, supportsV2: boolean, supportsV3: boolean): ChainConfig {
  return {
    chainId,
    name,
    vaultV2: supportsV2 ? (VAULT_V2[chainId] ?? ZERO_ADDRESS) : ZERO_ADDRESS,
    vaultV3: supportsV3 ? AddressProvider.Vault(chainId) : ZERO_ADDRESS,
    permit2: PERMIT2[chainId] ?? ZERO_ADDRESS,
    supportsV2,
    supportsV3,
  }
}

export const supportedChains: readonly ChainConfig[] = [
  buildChainConfig(1, 'Ethereum', true, true),
  buildChainConfig(10, 'Optimism', true, true),
  buildChainConfig(100, 'Gnosis Chain', true, true),
  buildChainConfig(137, 'Polygon', true, false),
  buildChainConfig(8453, 'Base', true, true),
  buildChainConfig(42161, 'Arbitrum One', true, true),
  buildChainConfig(43114, 'Avalanche', true, true),
  buildChainConfig(11155111, 'Sepolia', true, true),
  buildChainConfig(143, 'Monad', false, true),
  buildChainConfig(999, 'HyperEVM', false, true),
  buildChainConfig(9745, 'Plasma', true, true),
] as const

export { ZERO_ADDRESS as zeroAddress }

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return supportedChains.find((c) => c.chainId === chainId)
}

export function isSupportedChain(chainId: number): boolean {
  return getChainConfig(chainId) !== undefined
}
