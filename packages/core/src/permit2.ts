import {
  AddLiquidity,
  Permit2Helper,
  Slippage,
  type AddLiquidityBaseBuildCallInput,
  type AddLiquidityBuildCallOutput,
  type AddLiquidityQueryOutput,
  type Permit2,
  type PublicWalletClient,
} from '@balancer/sdk'
import type { Account, Address } from 'viem'
import { getChainConfig, zeroAddress } from './chains'
import { createLiquidityKitError } from './errors'
import type { Slippage as KitSlippage } from './types'
import type { AddLiquidityQuote, AddLiquidityInput } from './addLiquidity'

export type Permit2Plan = {
  permit2: Permit2
  call: AddLiquidityBuildCallOutput
}

export type SignPermit2Input = {
  chainId: number
  client: PublicWalletClient
  owner: Address | Account
  quote: AddLiquidityQuote
  slippage: KitSlippage
  sender: Address
  recipient: Address
  wethIsEth?: boolean
  nonces?: number[]
  expirations?: number[]
}

export async function signAddLiquidityPermit2(input: SignPermit2Input): Promise<Permit2> {
  const chain = getChainConfig(input.chainId)
  if (!chain) throw createLiquidityKitError('UNSUPPORTED_CHAIN', `Chain ${input.chainId} is not supported`, { retryable: false })
  if (chain.permit2 === zeroAddress) throw createLiquidityKitError('UNSUPPORTED_POOL', `Permit2 is not supported on chain ${input.chainId}`, { retryable: false })
  const buildCallInput = {
    ...input.quote.sdk,
    slippage: Slippage.fromPercentage(input.slippage.percentage),
    wethIsEth: input.wethIsEth,
  } as AddLiquidityBaseBuildCallInput
  return Permit2Helper.signAddLiquidityApproval({
    ...buildCallInput,
    client: input.client as never,
    owner: input.owner as never,
    nonces: input.nonces,
    expirations: input.expirations,
  })
}

export function buildAddLiquidityWithPermit2(
  quote: AddLiquidityQuote,
  permit2: Permit2,
  slippage: KitSlippage,
  sender: Address,
  recipient: Address,
  wethIsEth?: boolean,
): Permit2Plan {
  const call = new AddLiquidity().buildCallWithPermit2(
    {
      ...quote.sdk,
      slippage: Slippage.fromPercentage(slippage.percentage),
      wethIsEth,
      sender,
      recipient,
    } as unknown as never,
    permit2,
  )
  return { permit2, call }
}
