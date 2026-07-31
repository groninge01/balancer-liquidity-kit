import { getChainConfig } from './chains'
import { createLiquidityKitError } from './errors'
import type {
  PoolCapabilities,
  PoolData,
  PoolDataProvider,
  PoolReference,
} from './types'

const supportedPoolTypes = new Set(['Weighted', 'Stable', 'Boosted', 'ComposableStable'])

export function validatePool(pool: PoolData): void {
  if (!getChainConfig(pool.chainId))
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${pool.chainId} is not supported`, { retryable: false })
  if (!/^0x[a-fA-F0-9]{40}$/.test(pool.address))
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool address is invalid', { retryable: false })
  if (!supportedPoolTypes.has(pool.type))
    throw createLiquidityKitError('UNSUPPORTED_POOL', `Pool type ${pool.type} is not supported`, { retryable: false })
  if (pool.tokens.length === 0)
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool has no tokens', { retryable: false })
}

export function getPoolCapabilities(pool: PoolData): PoolCapabilities {
  const chain = getChainConfig(pool.chainId)
  const supported = chain !== undefined && supportedPoolTypes.has(pool.type)
  return {
    canAddLiquidity: supported,
    canRemoveLiquidity: supported,
    canStake: false,
    canUnstake: false,
    supportsPermit2: supported && Boolean(chain?.supportsPermit2),
    supportsNativeAsset: supported && pool.tokens.some((t) => t.symbol === 'WETH'),
  }
}

export function createValidatingPoolProvider(provider: PoolDataProvider): PoolDataProvider {
  return {
    async getPool(reference: PoolReference) {
      const pool = await provider.getPool(reference)
      validatePool(pool)
      if (pool.id.toLowerCase() !== reference.id.toLowerCase() || pool.chainId !== reference.chainId) {
        throw createLiquidityKitError('POOL_NOT_FOUND', 'Provider returned a different pool', { retryable: false })
      }
      return pool
    },
    getTokenPrices: provider.getTokenPrices?.bind(provider),
  }
}
