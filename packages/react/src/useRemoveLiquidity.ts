import { useCallback, useState } from 'react'
import {
  quoteV2WeightedProportionalRemoval,
  buildV2WeightedProportionalRemoval,
  quoteV2WeightedSingleTokenRemoval,
  buildV2WeightedSingleTokenRemoval,
  quoteV2StableProportionalRemoval,
  buildV2StableProportionalRemoval,
  quoteV2StableSingleTokenRemoval,
  buildV2StableSingleTokenRemoval,
  quoteV3WeightedProportionalRemoval,
  buildV3WeightedProportionalRemoval,
  quoteV3WeightedSingleTokenRemoval,
  buildV3WeightedSingleTokenRemoval,
  quoteV3BoostedProportionalRemoval,
  buildV3BoostedProportionalRemoval,
  type RemoveLiquidityInput,
  type SingleTokenRemoveLiquidityInput,
  type V2StableRemoveLiquidityInput,
  type V2StableSingleTokenRemoveLiquidityInput,
  type V3WeightedRemoveLiquidityInput,
  type V3WeightedSingleTokenRemoveLiquidityInput,
  type V3BoostedRemoveLiquidityInput,
  type RemoveLiquidityQuote,
  type RemoveLiquidityPlan,
  type V3BoostedRemoveLiquidityQuote,
  type V3BoostedRemoveLiquidityPlan,
} from '@balancer/liquidity-kit-core'

type AnyRemoveLiquidityInput =
  | RemoveLiquidityInput
  | SingleTokenRemoveLiquidityInput
  | V2StableRemoveLiquidityInput
  | V2StableSingleTokenRemoveLiquidityInput
  | V3WeightedRemoveLiquidityInput
  | V3WeightedSingleTokenRemoveLiquidityInput
  | V3BoostedRemoveLiquidityInput

type AnyRemoveLiquidityQuote = RemoveLiquidityQuote | V3BoostedRemoveLiquidityQuote

type AnyRemoveLiquidityPlan = RemoveLiquidityPlan | V3BoostedRemoveLiquidityPlan

export type RemoveLiquidityHookResult = {
  quote?: AnyRemoveLiquidityQuote
  plan?: AnyRemoveLiquidityPlan
  isLoading: boolean
  error?: Error
  refresh: () => void
}

function dispatchQuote(input: AnyRemoveLiquidityInput): Promise<AnyRemoveLiquidityQuote> {
  const pool = input.pool as { protocolVersion: number; type: string }
  const isSingleToken = 'tokenOut' in input && input.tokenOut !== undefined
  if (pool.protocolVersion === 2 && pool.type === 'Weighted') {
    return isSingleToken
      ? quoteV2WeightedSingleTokenRemoval(input as SingleTokenRemoveLiquidityInput)
      : quoteV2WeightedProportionalRemoval(input as RemoveLiquidityInput)
  }
  if (pool.protocolVersion === 2 && pool.type === 'Stable') {
    return isSingleToken
      ? quoteV2StableSingleTokenRemoval(input as V2StableSingleTokenRemoveLiquidityInput)
      : quoteV2StableProportionalRemoval(input as V2StableRemoveLiquidityInput)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Weighted') {
    return isSingleToken
      ? quoteV3WeightedSingleTokenRemoval(input as V3WeightedSingleTokenRemoveLiquidityInput)
      : quoteV3WeightedProportionalRemoval(input as V3WeightedRemoveLiquidityInput)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Boosted') {
    return quoteV3BoostedProportionalRemoval(input as V3BoostedRemoveLiquidityInput)
  }
  throw new Error(`Unsupported pool type: ${pool.type} v${pool.protocolVersion}`)
}

function dispatchBuild(
  input: AnyRemoveLiquidityInput,
  quote: AnyRemoveLiquidityQuote
): AnyRemoveLiquidityPlan {
  const pool = input.pool as { protocolVersion: number; type: string }
  const isSingleToken = 'tokenOut' in input && input.tokenOut !== undefined
  if (pool.protocolVersion === 2 && pool.type === 'Weighted') {
    return isSingleToken
      ? buildV2WeightedSingleTokenRemoval(input as SingleTokenRemoveLiquidityInput, quote as RemoveLiquidityQuote)
      : buildV2WeightedProportionalRemoval(input as RemoveLiquidityInput, quote as RemoveLiquidityQuote)
  }
  if (pool.protocolVersion === 2 && pool.type === 'Stable') {
    return isSingleToken
      ? buildV2StableSingleTokenRemoval(input as V2StableSingleTokenRemoveLiquidityInput, quote as RemoveLiquidityQuote)
      : buildV2StableProportionalRemoval(input as V2StableRemoveLiquidityInput, quote as RemoveLiquidityQuote)
  }
  if (pool.protocolVersion === 3 && pool.type === 'Weighted') {
    return isSingleToken
      ? buildV3WeightedSingleTokenRemoval(
            input as V3WeightedSingleTokenRemoveLiquidityInput,
          quote as RemoveLiquidityQuote
        )
      : buildV3WeightedProportionalRemoval(
          input as V3WeightedRemoveLiquidityInput,
          quote as RemoveLiquidityQuote
        )
  }
  if (pool.protocolVersion === 3 && pool.type === 'Boosted') {
    return buildV3BoostedProportionalRemoval(
      input as V3BoostedRemoveLiquidityInput,
      quote as V3BoostedRemoveLiquidityQuote
    )
  }
  throw new Error(`Unsupported pool type: ${pool.type} v${pool.protocolVersion}`)
}

export function useRemoveLiquidity(params: AnyRemoveLiquidityInput): RemoveLiquidityHookResult {
  const [state, setState] = useState<{
    quote?: AnyRemoveLiquidityQuote
    plan?: AnyRemoveLiquidityPlan
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
