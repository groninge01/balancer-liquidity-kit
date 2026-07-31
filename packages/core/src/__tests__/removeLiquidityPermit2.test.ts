import { describe, expect, it } from 'vitest'
import { signRemoveLiquidityPermit } from '../permit2'
import { createWeightedPoolState } from '../addLiquidity'
import type { RemoveLiquidityQuote } from '../removeLiquidity'

const poolState = createWeightedPoolState({
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  tokens: [
    { address: '0x2222222222222222222222222222222222222222', decimals: 18 },
    { address: '0x3333333333333333333333333333333333333333', decimals: 6 },
  ],
})

describe('Remove liquidity Permit2', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      signRemoveLiquidityPermit({
        chainId: 99999,
        client: {} as never,
        owner: '0x0000000000000000000000000000000000000001',
        quote: {} as RemoveLiquidityQuote,
        slippage: { percentage: '1' },
        sender: poolState.address,
        recipient: poolState.address,
      })
    ).rejects.toThrow('Chain 99999')
  })

  it('rejects chains without Permit2 support', async () => {
    await expect(
      signRemoveLiquidityPermit({
        chainId: 137,
        client: {} as never,
        owner: '0x0000000000000000000000000000000000000001',
        quote: {} as RemoveLiquidityQuote,
        slippage: { percentage: '1' },
        sender: poolState.address,
        recipient: poolState.address,
      })
    ).rejects.toThrow('Permit2 is not supported')
  })
})
