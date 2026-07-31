import {
  RemoveLiquidity,
  RemoveLiquidityBoostedV3,
  RemoveLiquidityKind,
  Slippage,
  TokenAmount,
  type InputAmount,
  type PoolState,
  type PoolStateWithUnderlyings,
  type RemoveLiquidityBoostedQueryOutput,
  type RemoveLiquidityBuildCallOutput,
  type RemoveLiquidityQueryOutput,
} from '@balancer/sdk'
import type { Address, Hex } from 'viem'
import { getChainConfig } from './chains'
import { createLiquidityKitError } from './errors'
import type { Slippage as KitSlippage } from './types'
import {
  assertV2WeightedPool,
  assertV2StablePool,
  assertV3WeightedPool,
  assertV3BoostedPool,
  type V2WeightedPool,
  type V2StablePool,
  type V3WeightedPool,
  type V3BoostedPool,
} from './addLiquidity'

export type RemoveLiquidityInput = {
  pool: V2WeightedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  bptIn: { address: Address; decimals: number; rawAmount: bigint }
  slippage: KitSlippage
  wethIsEth?: boolean
}

export type RemoveLiquidityQuote = {
  sdk: RemoveLiquidityQueryOutput
  bptIn: TokenAmount
  amountsOut: TokenAmount[]
}

export type RemoveLiquidityPlan = {
  quote: RemoveLiquidityQuote
  call: RemoveLiquidityBuildCallOutput
}

export async function quoteV2WeightedProportionalRemoval(
  input: RemoveLiquidityInput,
  poolState: PoolState = input.pool
): Promise<RemoveLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (input.bptIn.rawAmount <= 0n) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'bptIn must be greater than zero', {
      retryable: false,
    })
  }
  assertV2WeightedPool(poolState)
  const bptIn: InputAmount = {
    address: input.bptIn.address,
    decimals: input.bptIn.decimals,
    rawAmount: input.bptIn.rawAmount,
  }
  const result = await new RemoveLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      bptIn,
      kind: RemoveLiquidityKind.Proportional,
    },
    poolState
  )
  return { sdk: result, bptIn: result.bptIn, amountsOut: result.amountsOut }
}

export function buildV2WeightedProportionalRemoval(
  input: RemoveLiquidityInput,
  quote: RemoveLiquidityQuote
): RemoveLiquidityPlan {
  const call = new RemoveLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    sender: input.sender,
    recipient: input.recipient,
    wethIsEth: input.wethIsEth,
  })
  return { quote, call }
}

export function toRemovalCallData(call: RemoveLiquidityBuildCallOutput): Hex {
  return call.callData
}

export type SingleTokenRemoveLiquidityInput = {
  pool: V2WeightedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  bptIn: { address: Address; decimals: number; rawAmount: bigint }
  tokenOut: Address
  slippage: KitSlippage
  wethIsEth?: boolean
}

export async function quoteV2WeightedSingleTokenRemoval(
  input: SingleTokenRemoveLiquidityInput,
  poolState: PoolState = input.pool
): Promise<RemoveLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (input.bptIn.rawAmount <= 0n) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'bptIn must be greater than zero', {
      retryable: false,
    })
  }
  assertV2WeightedPool(poolState)
  const bptIn: InputAmount = {
    address: input.bptIn.address,
    decimals: input.bptIn.decimals,
    rawAmount: input.bptIn.rawAmount,
  }
  const result = await new RemoveLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      bptIn,
      tokenOut: input.tokenOut,
      kind: RemoveLiquidityKind.SingleTokenExactIn,
    },
    poolState
  )
  return { sdk: result, bptIn: result.bptIn, amountsOut: result.amountsOut }
}

export function buildV2WeightedSingleTokenRemoval(
  input: SingleTokenRemoveLiquidityInput,
  quote: RemoveLiquidityQuote
): RemoveLiquidityPlan {
  const call = new RemoveLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    sender: input.sender,
    recipient: input.recipient,
    wethIsEth: input.wethIsEth,
  })
  return { quote, call }
}

export type V2StableRemoveLiquidityInput = {
  pool: V2StablePool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  bptIn: { address: Address; decimals: number; rawAmount: bigint }
  slippage: KitSlippage
  wethIsEth?: boolean
}

export async function quoteV2StableProportionalRemoval(
  input: V2StableRemoveLiquidityInput,
  poolState: PoolState = input.pool
): Promise<RemoveLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (input.bptIn.rawAmount <= 0n) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'bptIn must be greater than zero', {
      retryable: false,
    })
  }
  assertV2StablePool(poolState)
  const bptIn: InputAmount = {
    address: input.bptIn.address,
    decimals: input.bptIn.decimals,
    rawAmount: input.bptIn.rawAmount,
  }
  const result = await new RemoveLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      bptIn,
      kind: RemoveLiquidityKind.Proportional,
    },
    poolState
  )
  return { sdk: result, bptIn: result.bptIn, amountsOut: result.amountsOut }
}

export function buildV2StableProportionalRemoval(
  input: V2StableRemoveLiquidityInput,
  quote: RemoveLiquidityQuote
): RemoveLiquidityPlan {
  const call = new RemoveLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    sender: input.sender,
    recipient: input.recipient,
    wethIsEth: input.wethIsEth,
  })
  return { quote, call }
}

export type V3WeightedRemoveLiquidityInput = {
  pool: V3WeightedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  bptIn: { address: Address; decimals: number; rawAmount: bigint }
  slippage: KitSlippage
  wethIsEth?: boolean
}

export async function quoteV3WeightedProportionalRemoval(
  input: V3WeightedRemoveLiquidityInput,
  poolState: PoolState = input.pool
): Promise<RemoveLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (input.bptIn.rawAmount <= 0n) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'bptIn must be greater than zero', {
      retryable: false,
    })
  }
  assertV3WeightedPool(poolState)
  const bptIn: InputAmount = {
    address: input.bptIn.address,
    decimals: input.bptIn.decimals,
    rawAmount: input.bptIn.rawAmount,
  }
  const result = await new RemoveLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      bptIn,
      kind: RemoveLiquidityKind.Proportional,
    },
    poolState
  )
  return { sdk: result, bptIn: result.bptIn, amountsOut: result.amountsOut }
}

export function buildV3WeightedProportionalRemoval(
  input: V3WeightedRemoveLiquidityInput,
  quote: RemoveLiquidityQuote
): RemoveLiquidityPlan {
  const call = new RemoveLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    wethIsEth: input.wethIsEth,
    userData: '0x',
  })
  return { quote, call }
}

export type V3BoostedRemoveLiquidityInput = {
  pool: V3BoostedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  bptIn: { address: Address; decimals: number; rawAmount: bigint }
  tokensOut: Address[]
  slippage: KitSlippage
  wethIsEth?: boolean
}

export type V3BoostedRemoveLiquidityQuote = {
  sdk: RemoveLiquidityBoostedQueryOutput
  bptIn: TokenAmount
  amountsOut: TokenAmount[]
}

export type V3BoostedRemoveLiquidityPlan = {
  quote: V3BoostedRemoveLiquidityQuote
  call: RemoveLiquidityBuildCallOutput
}

export async function quoteV3BoostedProportionalRemoval(
  input: V3BoostedRemoveLiquidityInput,
  poolState: PoolStateWithUnderlyings = input.pool
): Promise<V3BoostedRemoveLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (input.bptIn.rawAmount <= 0n) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'bptIn must be greater than zero', {
      retryable: false,
    })
  }
  assertV3BoostedPool(poolState)
  const bptIn: InputAmount = {
    address: input.bptIn.address,
    decimals: input.bptIn.decimals,
    rawAmount: input.bptIn.rawAmount,
  }
  const result = await new RemoveLiquidityBoostedV3().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      bptIn,
      tokensOut: input.tokensOut,
      kind: RemoveLiquidityKind.Proportional,
    },
    poolState
  )
  return { sdk: result, bptIn: result.bptIn, amountsOut: result.amountsOut }
}

export function buildV3BoostedProportionalRemoval(
  input: V3BoostedRemoveLiquidityInput,
  quote: V3BoostedRemoveLiquidityQuote
): V3BoostedRemoveLiquidityPlan {
  const call = new RemoveLiquidityBoostedV3().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    wethIsEth: input.wethIsEth,
  })
  return { quote, call }
}
