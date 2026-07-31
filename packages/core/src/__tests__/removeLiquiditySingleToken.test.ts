import { describe, expect, it } from 'vitest'
import { RemoveLiquidityKind } from '@balancer/sdk'
import { createWeightedPoolState } from '../addLiquidity'
import { quoteV2WeightedSingleTokenRemoval } from '../removeLiquidity'

const poolState = createWeightedPoolState({
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  tokens: [
    { address: '0x2222222222222222222222222222222222222222', decimals: 18, symbol: 'WETH' },
    { address: '0x3333333333333333333333333333333333333333', decimals: 6, symbol: 'USDC' },
  ],
})

describe('V2 weighted single-token remove liquidity', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      quoteV2WeightedSingleTokenRemoval({
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
      quoteV2WeightedSingleTokenRemoval({
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

  it('uses SDK single-token-exact-in kind', () => {
    expect(RemoveLiquidityKind.SingleTokenExactIn).toBe('SingleTokenExactIn')
  })
})
