import { describe, expect, it } from 'vitest'
import { RemoveLiquidityKind } from '@balancer/sdk'
import { createV3BoostedPoolState } from '../addLiquidity'
import { quoteV3BoostedProportionalRemoval } from '../removeLiquidity'

const poolState = createV3BoostedPoolState({
  id: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  tokens: [
    { address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', decimals: 18, symbol: 'waUSDC', underlyingToken: { address: '0xcccccccccccccccccccccccccccccccccccccccc', decimals: 6, symbol: 'USDC' } },
    { address: '0xdddddddddddddddddddddddddddddddddddddddd', decimals: 18, symbol: 'waUSDT', underlyingToken: { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 6, symbol: 'USDT' } },
  ],
})

describe('V3 boosted proportional remove liquidity', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      quoteV3BoostedProportionalRemoval({
        pool: poolState,
        chainId: 99999,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 1n },
        tokensOut: [poolState.tokens[0].address, poolState.tokens[1].address],
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('Chain 99999')
  })

  it('rejects zero bptIn', async () => {
    await expect(
      quoteV3BoostedProportionalRemoval({
        pool: poolState,
        chainId: 1,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 0n },
        tokensOut: [poolState.tokens[0].address, poolState.tokens[1].address],
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('bptIn')
  })

  it('uses proportional remove kind', () => {
    expect(RemoveLiquidityKind.Proportional).toBe('Proportional')
  })
})
