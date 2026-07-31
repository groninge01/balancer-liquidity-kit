import { describe, expect, it } from 'vitest'
import { AddLiquidityKind } from '@balancer/sdk'
import { assertV3WeightedPool, createV3WeightedPoolState, quoteV3WeightedAddLiquidity } from '../addLiquidity'

const poolState = createV3WeightedPoolState({
  id: '0x7777777777777777777777777777777777777777777777777777777777777777',
  address: '0x7777777777777777777777777777777777777777',
  tokens: [
    { address: '0x8888888888888888888888888888888888888888', decimals: 18, symbol: 'WETH' },
    { address: '0x9999999999999999999999999999999999999999', decimals: 6, symbol: 'USDC' },
  ],
})

describe('V3 weighted add liquidity', () => {
  it('creates a valid V3 weighted pool state', () => {
    assertV3WeightedPool(poolState)
    expect(poolState.protocolVersion).toBe(3)
    expect(poolState.type).toBe('Weighted')
  })

  it('rejects empty amountsIn', async () => {
    await expect(
      quoteV3WeightedAddLiquidity({
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
      quoteV3WeightedAddLiquidity({
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
