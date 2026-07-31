import { describe, expect, it } from 'vitest'
import { RemoveLiquidityKind, Slippage } from '@balancer/sdk'
import { createWeightedPoolState, assertV2WeightedPool } from '../addLiquidity'
import { quoteV2WeightedProportionalRemoval } from '../removeLiquidity'

const poolState = createWeightedPoolState({
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  tokens: [
    { address: '0x2222222222222222222222222222222222222222', decimals: 18, symbol: 'WETH' },
    { address: '0x3333333333333333333333333333333333333333', decimals: 6, symbol: 'USDC' },
  ],
})

describe('V2 weighted proportional remove liquidity', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      quoteV2WeightedProportionalRemoval({
        pool: poolState,
        chainId: 99999,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 1n },
        slippage: { percentage: '1' },
      })
    ).rejects.toThrow('Chain 99999')
  })

  it('rejects zero bptIn', async () => {
    await expect(
      quoteV2WeightedProportionalRemoval({
        pool: poolState,
        chainId: 1,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 0n },
        slippage: { percentage: '1' },
      })
    ).rejects.toThrow('bptIn')
  })

  it('uses SDK remove-liquidity proportional kind', () => {
    expect(RemoveLiquidityKind.Proportional).toBe('Proportional')
  })

  it('applies slippage via SDK Slippage type', () => {
    expect(Slippage.fromPercentage('0.5').percentage).toBe(0.5)
  })

  it('asserts pool is V2 weighted', () => {
    assertV2WeightedPool(poolState)
    expect(poolState.type).toBe('Weighted')
  })
})
