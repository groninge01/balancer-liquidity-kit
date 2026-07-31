import type { PoolData } from './types'

export const weightedPoolFixture: PoolData = {
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  chainId: 1,
  protocolVersion: 2,
  type: 'Weighted',
  tokens: [
    {
      address: '0x2222222222222222222222222222222222222222',
      decimals: 18,
      symbol: 'WETH',
      index: 0,
    },
    {
      address: '0x3333333333333333333333333333333333333333',
      decimals: 6,
      symbol: 'USDC',
      index: 1,
    },
  ],
  dynamicData: { totalLiquidity: '1000000', swapEnabled: true },
}
