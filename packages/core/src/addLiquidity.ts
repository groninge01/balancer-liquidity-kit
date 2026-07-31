import {
  AddLiquidity,
  AddLiquidityBoostedV3,
  AddLiquidityKind,
  Slippage,
  Token,
  TokenAmount,
  type AddLiquidityBoostedQueryOutput,
  type AddLiquidityBuildCallOutput,
  type AddLiquidityQueryOutput,
  type InputAmount,
  type PoolState,
  type PoolStateWithUnderlyings,
} from '@balancer/sdk'
import type { Address, Hex } from 'viem'
import { getChainConfig } from './chains'
import { createLiquidityKitError } from './errors'
import type { PoolData, Slippage as KitSlippage } from './types'

export type V2WeightedPool = PoolState & { protocolVersion: 2; type: 'Weighted' }

export type AddLiquidityInput = {
  pool: V2WeightedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  amountsIn: readonly { address: Address; decimals: number; rawAmount: bigint }[]
  slippage: KitSlippage
  wethIsEth?: boolean
}

export type AddLiquidityQuote = {
  sdk: AddLiquidityQueryOutput
  bptOut: TokenAmount
  amountsIn: TokenAmount[]
}

export type AddLiquidityPlan = {
  quote: AddLiquidityQuote
  call: AddLiquidityBuildCallOutput
  approvals: readonly { token: Address; spender: Address; amount: bigint }[]
}

function toInputAmount(input: {
  address: Address
  decimals: number
  rawAmount: bigint
}): InputAmount {
  return { address: input.address, decimals: input.decimals, rawAmount: input.rawAmount }
}

export function assertV2WeightedPool(pool: PoolState): asserts pool is V2WeightedPool {
  if (pool.protocolVersion !== 2 || pool.type !== 'Weighted') {
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool must be a V2 weighted pool', {
      retryable: false,
    })
  }
}

export function createWeightedPoolState(input: {
  id: Hex
  address: Address
  tokens: readonly { address: Address; decimals: number; symbol?: string }[]
}): V2WeightedPool {
  return {
    id: input.id,
    address: input.address,
    type: 'Weighted',
    protocolVersion: 2,
    tokens: input.tokens.map((token, index) => ({
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      index,
    })),
  }
}

export function createSdkToken(input: {
  address: Address
  decimals: number
  symbol?: string
}): Token {
  return new Token(1, input.address, input.decimals, input.symbol)
}

export function createSdkAmount(input: {
  address: Address
  decimals: number
  amount: bigint
}): TokenAmount {
  return TokenAmount.fromRawAmount(createSdkToken(input), input.amount)
}

export async function quoteV2WeightedAddLiquidity(
  input: AddLiquidityInput,
  poolState: PoolState = input.pool
): Promise<AddLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (!input.amountsIn.length) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'amountsIn must not be empty', {
      retryable: false,
    })
  }
  assertV2WeightedPool(poolState)
  const result = await new AddLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      amountsIn: input.amountsIn.map(toInputAmount),
      kind: AddLiquidityKind.Unbalanced,
    },
    poolState
  )
  return { sdk: result, bptOut: result.bptOut, amountsIn: result.amountsIn }
}

export async function buildV2WeightedAddLiquidity(
  input: AddLiquidityInput,
  quote: AddLiquidityQuote
): Promise<AddLiquidityPlan> {
  const call = new AddLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    sender: input.sender,
    recipient: input.recipient,
    wethIsEth: input.wethIsEth,
  })
  return {
    quote,
    call,
    approvals: input.amountsIn.map(amount => ({
      token: amount.address,
      spender: call.to,
      amount: amount.rawAmount,
    })),
  }
}

export function toHexCallData(call: AddLiquidityBuildCallOutput): Hex {
  return call.callData
}

export function poolDataToPoolState(pool: PoolData): V2WeightedPool {
  if (pool.protocolVersion !== 2 || pool.type !== 'Weighted') {
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool must be a V2 weighted pool', {
      retryable: false,
    })
  }
  return {
    id: pool.id,
    address: pool.address,
    type: pool.type,
    protocolVersion: 2,
    tokens: pool.tokens.map(t => ({
      address: t.address,
      decimals: t.decimals,
      symbol: t.symbol,
      index: t.index,
    })),
  }
}

export type V2StablePool = PoolState & { protocolVersion: 2; type: 'Stable' }

export function assertV2StablePool(pool: PoolState): asserts pool is V2StablePool {
  if (pool.protocolVersion !== 2 || pool.type !== 'Stable') {
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool must be a V2 stable pool', {
      retryable: false,
    })
  }
}

export function createStablePoolState(input: {
  id: Hex
  address: Address
  tokens: readonly { address: Address; decimals: number; symbol?: string }[]
}): V2StablePool {
  return {
    id: input.id,
    address: input.address,
    type: 'Stable',
    protocolVersion: 2,
    tokens: input.tokens.map((token, index) => ({
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      index,
    })),
  }
}

export type V2StableAddLiquidityInput = {
  pool: V2StablePool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  amountsIn: readonly { address: Address; decimals: number; rawAmount: bigint }[]
  slippage: KitSlippage
  wethIsEth?: boolean
}

export async function quoteV2StableAddLiquidity(
  input: V2StableAddLiquidityInput,
  poolState: PoolState = input.pool
): Promise<AddLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (!input.amountsIn.length) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'amountsIn must not be empty', {
      retryable: false,
    })
  }
  assertV2StablePool(poolState)
  const result = await new AddLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      amountsIn: input.amountsIn.map(toInputAmount),
      kind: AddLiquidityKind.Unbalanced,
    },
    poolState
  )
  return { sdk: result, bptOut: result.bptOut, amountsIn: result.amountsIn }
}

export async function buildV2StableAddLiquidity(
  input: V2StableAddLiquidityInput,
  quote: AddLiquidityQuote
): Promise<AddLiquidityPlan> {
  const call = new AddLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    sender: input.sender,
    recipient: input.recipient,
    wethIsEth: input.wethIsEth,
  })
  return {
    quote,
    call,
    approvals: input.amountsIn.map(amount => ({
      token: amount.address,
      spender: call.to,
      amount: amount.rawAmount,
    })),
  }
}

export type V3WeightedPool = PoolState & { protocolVersion: 3; type: 'Weighted' }

export function assertV3WeightedPool(pool: PoolState): asserts pool is V3WeightedPool {
  if (pool.protocolVersion !== 3 || pool.type !== 'Weighted') {
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool must be a V3 weighted pool', {
      retryable: false,
    })
  }
}

export function createV3WeightedPoolState(input: {
  id: Hex
  address: Address
  tokens: readonly { address: Address; decimals: number; symbol?: string }[]
}): V3WeightedPool {
  return {
    id: input.id,
    address: input.address,
    type: 'Weighted',
    protocolVersion: 3,
    tokens: input.tokens.map((token, index) => ({
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      index,
    })),
  }
}

export type V3WeightedAddLiquidityInput = {
  pool: V3WeightedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  amountsIn: readonly { address: Address; decimals: number; rawAmount: bigint }[]
  slippage: KitSlippage
  wethIsEth?: boolean
}

export async function quoteV3WeightedAddLiquidity(
  input: V3WeightedAddLiquidityInput,
  poolState: PoolState = input.pool
): Promise<AddLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (!input.amountsIn.length) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'amountsIn must not be empty', {
      retryable: false,
    })
  }
  assertV3WeightedPool(poolState)
  const result = await new AddLiquidity().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      amountsIn: input.amountsIn.map(toInputAmount),
      kind: AddLiquidityKind.Unbalanced,
    },
    poolState
  )
  return { sdk: result, bptOut: result.bptOut, amountsIn: result.amountsIn }
}

export async function buildV3WeightedAddLiquidity(
  input: V3WeightedAddLiquidityInput,
  quote: AddLiquidityQuote
): Promise<AddLiquidityPlan> {
  const call = new AddLiquidity().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    wethIsEth: input.wethIsEth,
    userData: '0x',
  })
  return {
    quote,
    call,
    approvals: input.amountsIn.map(amount => ({
      token: amount.address,
      spender: call.to,
      amount: amount.rawAmount,
    })),
  }
}

export type V3BoostedPool = PoolStateWithUnderlyings & { protocolVersion: 3; type: 'Boosted' }

export function assertV3BoostedPool(pool: PoolStateWithUnderlyings): asserts pool is V3BoostedPool {
  if (pool.protocolVersion !== 3 || pool.type !== 'Boosted') {
    throw createLiquidityKitError('UNSUPPORTED_POOL', 'Pool must be a V3 boosted pool', {
      retryable: false,
    })
  }
}

export function createV3BoostedPoolState(input: {
  id: Hex
  address: Address
  tokens: readonly {
    address: Address
    decimals: number
    symbol?: string
    underlyingToken?: { address: Address; decimals: number; symbol?: string } | null
  }[]
}): V3BoostedPool {
  return {
    id: input.id,
    address: input.address,
    type: 'Boosted',
    protocolVersion: 3,
    tokens: input.tokens.map((token, index) => ({
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      index,
      underlyingToken: token.underlyingToken
        ? {
            address: token.underlyingToken.address,
            decimals: token.underlyingToken.decimals,
            symbol: token.underlyingToken.symbol,
            index: 0,
          }
        : null,
    })),
  }
}

export type V3BoostedAddLiquidityInput = {
  pool: V3BoostedPool
  chainId: number
  rpcUrl: string
  sender: Address
  recipient: Address
  amountsIn: readonly { address: Address; decimals: number; rawAmount: bigint }[]
  slippage: KitSlippage
  wethIsEth?: boolean
}

export type V3BoostedAddLiquidityQuote = {
  sdk: AddLiquidityBoostedQueryOutput
  bptOut: TokenAmount
  amountsIn: TokenAmount[]
}

export type V3BoostedAddLiquidityPlan = {
  quote: V3BoostedAddLiquidityQuote
  call: AddLiquidityBuildCallOutput
  approvals: readonly { token: Address; spender: Address; amount: bigint }[]
}

export async function quoteV3BoostedAddLiquidity(
  input: V3BoostedAddLiquidityInput,
  poolState: PoolStateWithUnderlyings = input.pool
): Promise<V3BoostedAddLiquidityQuote> {
  const chain = getChainConfig(input.chainId)
  if (!chain) {
    throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, {
      retryable: false,
    })
  }
  if (!input.amountsIn.length) {
    throw createLiquidityKitError('INVALID_AMOUNT', 'amountsIn must not be empty', {
      retryable: false,
    })
  }
  assertV3BoostedPool(poolState)
  const result = await new AddLiquidityBoostedV3().query(
    {
      chainId: input.chainId,
      rpcUrl: input.rpcUrl,
      sender: input.sender,
      amountsIn: input.amountsIn.map(toInputAmount),
      kind: AddLiquidityKind.Unbalanced,
    },
    poolState
  )
  return { sdk: result, bptOut: result.bptOut, amountsIn: result.amountsIn }
}

export async function buildV3BoostedAddLiquidity(
  input: V3BoostedAddLiquidityInput,
  quote: V3BoostedAddLiquidityQuote
): Promise<V3BoostedAddLiquidityPlan> {
  const call = new AddLiquidityBoostedV3().buildCall({
    ...quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    wethIsEth: input.wethIsEth,
  })
  return {
    quote,
    call,
    approvals: input.amountsIn.map(amount => ({
      token: amount.address,
      spender: call.to,
      amount: amount.rawAmount,
    })),
  }
}
