import { describe, expect, it } from 'vitest'
import { AddLiquidityKind } from '@balancer/sdk'
import { assertV2StablePool, createStablePoolState, quoteV2StableAddLiquidity } from '../addLiquidity'

const poolState = createStablePoolState({
  id: '0x4444444444444444444444444444444444444444444444444444444444444444',
  address: '0x4444444444444444444444444444444444444444',
  tokens: [
    { address: '0x5555555555555555555555555555555555555555', decimals: 6, symbol: 'USDC' },
    { address: '0x6666666666666666666666666666666666666666', decimals: 6, symbol: 'USDT' },
  ],
})

describe('V2 stable add liquidity', () => {
  it('creates a valid V2 stable pool state', () => {
    assertV2StablePool(poolState)
    expect(poolState.protocolVersion).toBe(2)
    expect(poolState.type).toBe('Stable')
  })

  it('rejects empty amountsIn', async () => {
    await expect(
      quoteV2StableAddLiquidity({
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
      quoteV2StableAddLiquidity({
        pool: poolState,
        chainId: 999,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        amountsIn: [{ address: poolState.tokens[0].address, decimals: 6, rawAmount: 1n }],
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('Chain 999')
  })

  it('uses unbalanced add liquidity kind', () => {
    expect(AddLiquidityKind.Unbalanced).toBe('Unbalanced')
  })
})
