import { describe, expect, it } from 'vitest'
import { RemoveLiquidityKind } from '@balancer/sdk'
import { createV3WeightedPoolState } from '../addLiquidity'
import { quoteV3WeightedSingleTokenRemoval } from '../removeLiquidity'

const poolState = createV3WeightedPoolState({
  id: '0x7777777777777777777777777777777777777777777777777777777777777777',
  address: '0x7777777777777777777777777777777777777777',
  tokens: [
    { address: '0x8888888888888888888888888888888888888888', decimals: 18 },
    { address: '0x9999999999999999999999999999999999999999', decimals: 6 },
  ],
})

describe('V3 weighted single-token remove liquidity', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      quoteV3WeightedSingleTokenRemoval({
        pool: poolState,
        chainId: 99999,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 1n },
        tokenOut: poolState.tokens[0].address,
        slippage: { percentage: '1' },
      })
    ).rejects.toThrow('Chain 99999')
  })

  it('rejects zero bptIn', async () => {
    await expect(
      quoteV3WeightedSingleTokenRemoval({
        pool: poolState,
        chainId: 1,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 0n },
        tokenOut: poolState.tokens[0].address,
        slippage: { percentage: '1' },
      })
    ).rejects.toThrow('bptIn')
  })

  it('uses single-token-exact-in kind', () => {
    expect(RemoveLiquidityKind.SingleTokenExactIn).toBe('SingleTokenExactIn')
  })
})
