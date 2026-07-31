import { useCallback, useState } from 'react'
import {
  quoteV2WeightedAddLiquidity,
  buildV2WeightedAddLiquidity,
  quoteV2StableAddLiquidity,
  buildV2StableAddLiquidity,
  quoteV3WeightedAddLiquidity,
  buildV3WeightedAddLiquidity,
  quoteV3BoostedAddLiquidity,
  buildV3BoostedAddLiquidity,
  type AddLiquidityInput,
  type V2StableAddLiquidityInput,
  type V3WeightedAddLiquidityInput,
  type V3BoostedAddLiquidityInput,
  type AddLiquidityQuote,
  type AddLiquidityPlan,
  type V3BoostedAddLiquidityQuote,
  type V3BoostedAddLiquidityPlan,
} from '@balancer/liquidity-kit-core'

type AnyAddLiquidityInput =
  | AddLiquidityInput
  | V2StableAddLiquidityInput
  | V3WeightedAddLiquidityInput
  | V3BoostedAddLiquidityInput

type AnyAddLiquidityQuote = AddLiquidityQuote | V3BoostedAddLiquidityQuote

type AnyAddLiquidityPlan = AddLiquidityPlan | V3BoostedAddLiquidityPlan

export type AddLiquidityHookResult = {
  quote?: AnyAddLiquidityQuote
  plan?: AnyAddLiquidityPlan
  isLoading: boolean
  error?: Error
  refresh: () => void
}

function dispatchQuote(input: AnyAddLiquidityInput): Promise<AnyAddLiquidityQuote> {
  const pool = input.pool as { protocolVersion: number; type: string }
  if (pool.protocolVersion === 2 && pool.type === 'Weighted') {
    return quoteV2WeightedAddLiquidity(input as AddLiquidityInput)
  }
  if (pool.protocolVersion === 2 && pool.type === 'Stable') {
    return quoteV2StableAddLiquidity(input as V2StableAddLiquidityInput)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Weighted') {
    return quoteV3WeightedAddLiquidity(input as V3WeightedAddLiquidityInput)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Boosted') {
    return quoteV3BoostedAddLiquidity(input as V3BoostedAddLiquidityInput)
  }
  throw new Error(`Unsupported pool type: ${pool.type} v${pool.protocolVersion}`)
}

function dispatchBuild(
  input: AnyAddLiquidityInput,
  quote: AnyAddLiquidityQuote
): Promise<AnyAddLiquidityPlan> {
  const pool = input.pool as { protocolVersion: number; type: string }
  if (pool.protocolVersion === 2 && pool.type === 'Weighted') {
    return buildV2WeightedAddLiquidity(input as AddLiquidityInput, quote as AddLiquidityQuote)
  }
  if (pool.protocolVersion === 2 && pool.type === 'Stable') {
    return buildV2StableAddLiquidity(input as V2StableAddLiquidityInput, quote as AddLiquidityQuote)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Weighted') {
    return buildV3WeightedAddLiquidity(input as V3WeightedAddLiquidityInput, quote as AddLiquidityQuote)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Boosted') {
    return buildV3BoostedAddLiquidity(
      input as V3BoostedAddLiquidityInput,
      quote as V3BoostedAddLiquidityQuote
    )
  }
  throw new Error(`Unsupported pool type: ${pool.type} v${pool.protocolVersion}`)
}

export function useAddLiquidity(params: AnyAddLiquidityInput): AddLiquidityHookResult {
  const [state, setState] = useState<{
    quote?: AnyAddLiquidityQuote
    plan?: AnyAddLiquidityPlan
    isLoading: boolean
    error?: Error
  }>({ isLoading: false })

  const refresh = useCallback(() => {
    setState({ isLoading: true })
    dispatchQuote(params)
      .then(quote => dispatchBuild(params, quote))
      .then(plan => {
        setState({ quote: plan.quote, plan, isLoading: false })
      })
      .catch(error => {
        setState({
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      })
  }, [params])

  return { ...state, refresh }
}
