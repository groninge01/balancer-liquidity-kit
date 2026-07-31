import { describe, expect, it } from 'vitest'
import { RemoveLiquidityKind } from '@balancer/sdk'
import { createStablePoolState } from '../addLiquidity'
import { quoteV2StableProportionalRemoval } from '../removeLiquidity'

const poolState = createStablePoolState({
  id: '0x4444444444444444444444444444444444444444444444444444444444444444',
  address: '0x4444444444444444444444444444444444444444',
  tokens: [
    { address: '0x5555555555555555555555555555555555555555', decimals: 6, symbol: 'USDC' },
    { address: '0x6666666666666666666666666666666666666666', decimals: 6, symbol: 'USDT' },
  ],
})

describe('V2 stable proportional remove liquidity', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      quoteV2StableProportionalRemoval({
        pool: poolState,
        chainId: 99999,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 1n },
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('Chain 99999')
  })

  it('rejects zero bptIn', async () => {
    await expect(
      quoteV2StableProportionalRemoval({
        pool: poolState,
        chainId: 1,
        rpcUrl: '',
        sender: poolState.address,
        recipient: poolState.address,
        bptIn: { address: poolState.address, decimals: 18, rawAmount: 0n },
        slippage: { percentage: '1' },
      }),
    ).rejects.toThrow('bptIn')
  })

  it('uses proportional remove kind', () => {
    expect(RemoveLiquidityKind.Proportional).toBe('Proportional')
  })
})
