import { describe, expect, it } from 'vitest'
import { AddLiquidityKind } from '@balancer/sdk'
import { assertV3BoostedPool, createV3BoostedPoolState, quoteV3BoostedAddLiquidity } from '../addLiquidity'

const poolState = createV3BoostedPoolState({
  id: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  tokens: [
    { address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', decimals: 18, symbol: 'waUSDC', underlyingToken: { address: '0xcccccccccccccccccccccccccccccccccccccccc', decimals: 6, symbol: 'USDC' } },
    { address: '0xdddddddddddddddddddddddddddddddddddddddd', decimals: 18, symbol: 'waUSDT', underlyingToken: { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 6, symbol: 'USDT' } },
  ],
})

describe('V3 boosted add liquidity', () => {
  it('creates a valid V3 boosted pool state', () => {
    assertV3BoostedPool(poolState)
    expect(poolState.protocolVersion).toBe(3)
    expect(poolState.type).toBe('Boosted')
  })

  it('rejects empty amountsIn', async () => {
    await expect(
      quoteV3BoostedAddLiquidity({
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
      quoteV3BoostedAddLiquidity({
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

  it('uses unbalanced add liquidity kind', () => {
    expect(AddLiquidityKind.Unbalanced).toBe('Unbalanced')
  })
})
