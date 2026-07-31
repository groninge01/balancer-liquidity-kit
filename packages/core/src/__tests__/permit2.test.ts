import { describe, expect, it } from 'vitest'
import { getChainConfig, zeroAddress } from '../chains'
import { signAddLiquidityPermit2 } from '../permit2'
import { createWeightedPoolState, quoteV2WeightedAddLiquidity, type AddLiquidityQuote } from '../addLiquidity'

const poolState = createWeightedPoolState({
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  tokens: [
    { address: '0x2222222222222222222222222222222222222222', decimals: 18, symbol: 'WETH' },
    { address: '0x3333333333333333333333333333333333333333', decimals: 6, symbol: 'USDC' },
  ],
})

describe('Permit2', () => {
  it('rejects unsupported chain', async () => {
    await expect(
      signAddLiquidityPermit2({
        chainId: 99999,
        client: {} as never,
        owner: '0x0000000000000000000000000000000000000001',
        quote: {} as AddLiquidityQuote,
        slippage: { percentage: '1' },
        sender: poolState.address,
        recipient: poolState.address,
      }),
    ).rejects.toThrow('Chain 99999')
  })

  it('rejects chains without Permit2 support', async () => {
    await expect(
      signAddLiquidityPermit2({
        chainId: 137,
        client: {} as never,
        owner: '0x0000000000000000000000000000000000000001',
        quote: {} as AddLiquidityQuote,
        slippage: { percentage: '1' },
        sender: poolState.address,
        recipient: poolState.address,
      }),
    ).rejects.toThrow('Permit2 is not supported')
  })

  it('Permit2 address is zero for Polygon', () => {
    expect(getChainConfig(137)?.permit2).toBe(zeroAddress)
  })

  it('Permit2 address is set for Ethereum', () => {
    expect(getChainConfig(1)?.permit2).toBe('0x000000000022D473030F116dDEE9F6B43aC78BA3')
  })
})
