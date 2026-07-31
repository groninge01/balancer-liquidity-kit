import { describe, expect, it } from 'vitest'
import { AddLiquidityKind, Slippage } from '@balancer/sdk'
import { assertV2WeightedPool, createWeightedPoolState, poolDataToPoolState, quoteV2WeightedAddLiquidity } from '../addLiquidity'
import { getPoolCapabilities } from '../pool'
import { getChainConfig, isSupportedChain } from '../chains'
import { createLiquidityKitError, normalizeError } from '../errors'
import { weightedPoolFixture } from '../fixtures'

const poolState = createWeightedPoolState({
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  tokens: [
    { address: '0x2222222222222222222222222222222222222222', decimals: 18, symbol: 'WETH' },
    { address: '0x3333333333333333333333333333333333333333', decimals: 6, symbol: 'USDC' },
  ],
})

describe('chains', () => {
  it('supports Ethereum mainnet', () => {
    expect(isSupportedChain(1)).toBe(true)
    expect(getChainConfig(1)?.name).toBe('Ethereum')
  })

  it('rejects unsupported chains', () => {
    expect(isSupportedChain(999)).toBe(false)
  })

  it('supports all Balancer V2 chains', () => {
    const expectedChains = [1, 10, 56, 100, 137, 146, 250, 252, 324, 1101, 8453, 34443, 42161, 43114, 11155111]
    for (const chainId of expectedChains) {
      expect(isSupportedChain(chainId)).toBe(true)
    }
  })

  it('reports Permit2 support correctly', () => {
    expect(getChainConfig(1)?.supportsPermit2).toBe(true)
    expect(getChainConfig(42161)?.supportsPermit2).toBe(true)
    expect(getChainConfig(56)?.supportsPermit2).toBe(false)
    expect(getChainConfig(250)?.supportsPermit2).toBe(false)
  })

  it('uses Fantom-specific vault address', () => {
    expect(getChainConfig(250)?.vault).toBe('0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce')
  })
})

describe('errors', () => {
  it('creates retryable errors for quote failures', () => {
    const err = createLiquidityKitError('QUOTE_FAILED', 'test')
    expect(err.retryable).toBe(true)
  })

  it('creates non-retryable errors for unsupported pools', () => {
    const err = createLiquidityKitError('UNSUPPORTED_POOL', 'test')
    expect(err.retryable).toBe(false)
  })

  it('normalizes unknown errors', () => {
    const err = normalizeError(new Error('boom'))
    expect(err.code).toBe('TRANSACTION_FAILED')
    expect(err.message).toBe('boom')
  })

  it('passes through already-normalized errors', () => {
    const original = createLiquidityKitError('QUOTE_FAILED', 'test')
    const err = normalizeError(original)
    expect(err).toBe(original)
  })
})

describe('pool', () => {
  it('validates a supported pool', () => {
    expect(() => getPoolCapabilities(weightedPoolFixture)).not.toThrow()
  })

  it('detects capabilities for weighted pool', () => {
    const caps = getPoolCapabilities(weightedPoolFixture)
    expect(caps.canAddLiquidity).toBe(true)
    expect(caps.canRemoveLiquidity).toBe(true)
    expect(caps.canStake).toBe(false)
    expect(caps.supportsPermit2).toBe(true)
  })
})

describe('addLiquidity', () => {
  it('creates a valid V2 weighted pool state', () => {
    assertV2WeightedPool(poolState)
    expect(poolState.protocolVersion).toBe(2)
    expect(poolState.type).toBe('Weighted')
  })

  it('converts PoolData to PoolState', () => {
    const state = poolDataToPoolState(weightedPoolFixture)
    assertV2WeightedPool(state)
    expect(state.tokens).toHaveLength(2)
  })

  it('rejects empty amountsIn', async () => {
    await expect(
      quoteV2WeightedAddLiquidity({
        pool: poolState,
        chainId: 1,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        amountsIn: [],
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('amountsIn')
  })

  it('rejects unsupported chain', async () => {
    await expect(
      quoteV2WeightedAddLiquidity({
        pool: poolState,
        chainId: 999,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        amountsIn: [{ address: poolState.tokens[0].address, decimals: 18, rawAmount: 1n }],
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('Chain 999')
  })

  it('uses SDK add-liquidity kind and slippage types', () => {
    expect(AddLiquidityKind.Unbalanced).toBe('Unbalanced')
    expect(Slippage.fromPercentage('1').percentage).toBe(1)
  })
})
