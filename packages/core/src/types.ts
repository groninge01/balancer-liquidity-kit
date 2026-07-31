import type { Address, Hex } from 'viem'

export type { Address, Hex }

export type PoolReference = { id: string; chainId: number }
export type TokenReference = { address: Address; chainId: number }
export type TokenAmount = { token: Address; amount: bigint; decimals: number }
export type TokenAmountInput = { token: Address; amount: bigint }
export type HumanAmount = `${number}`
export type Slippage = { percentage: `${number}` }

export type PoolToken = {
  address: Address
  decimals: number
  symbol?: string
  index: number
}

export type PoolDynamicData = {
  totalLiquidity?: string
  swapEnabled?: boolean
  blockNumber?: bigint
}

export type PoolData = {
  id: Hex
  address: Address
  chainId: number
  protocolVersion: 2 | 3
  type: string
  tokens: PoolToken[]
  dynamicData: PoolDynamicData
}

export interface PoolDataProvider {
  getPool(reference: PoolReference): Promise<PoolData>
  getTokenPrices?(tokens: TokenReference[]): Promise<TokenPriceMap>
}

export type TokenPriceMap = Record<string, string>

export type PoolCapabilities = {
  canAddLiquidity: boolean
  canRemoveLiquidity: boolean
  canStake: boolean
  canUnstake: boolean
  supportsPermit2: boolean
  supportsNativeAsset: boolean
}

export type LiquidityKitClient = {
  publicClient: unknown
  walletClient?: unknown
  account?: Address
}

export type TransactionRequest = {
  to: Address
  data: Hex
  value: bigint
  chainId: number
  description: string
  kind: 'approval' | 'permit2' | 'liquidity' | 'stake' | 'unstake'
}

export type ApprovalRequirement = {
  token: Address
  spender: Address
  requiredAmount: bigint
  currentAllowance: bigint
  isSatisfied: boolean
}

export type LiquidityWarning = { code: string; message: string }

export type LiquidityKitErrorCode =
  | 'UNSUPPORTED_CHAIN'
  | 'UNSUPPORTED_POOL'
  | 'POOL_NOT_FOUND'
  | 'INVALID_AMOUNT'
  | 'INSUFFICIENT_BALANCE'
  | 'INSUFFICIENT_ALLOWANCE'
  | 'QUOTE_FAILED'
  | 'SIMULATION_FAILED'
  | 'PRICE_IMPACT_TOO_HIGH'
  | 'TRANSACTION_REJECTED'
  | 'TRANSACTION_FAILED'
  | 'WALLET_NOT_CONNECTED'

export type LiquidityKitError = {
  code: LiquidityKitErrorCode
  message: string
  cause?: unknown
  details?: Record<string, unknown>
  retryable: boolean
}

export type ApiClientOptions = {
  baseUrl: string
  fetch?: typeof globalThis.fetch
  timeoutMs?: number
  retries?: number
}

export type BalancerApiClient = {
  get<T>(path: string, init?: RequestInit): Promise<T>
}
