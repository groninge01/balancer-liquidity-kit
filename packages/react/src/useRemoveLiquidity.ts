import { useCallback, useState } from 'react'
import {
  quoteV2WeightedProportionalRemoval,
  buildV2WeightedProportionalRemoval,
  type RemoveLiquidityInput,
  type RemoveLiquidityQuote,
  type RemoveLiquidityPlan,
} from '@balancer/liquidity-kit-core'

export type RemoveLiquidityHookResult = {
  quote?: RemoveLiquidityQuote
  plan?: RemoveLiquidityPlan
  isLoading: boolean
  error?: Error
  refresh: () => void
}

export function useRemoveLiquidity(params: RemoveLiquidityInput): RemoveLiquidityHookResult {
  const [state, setState] = useState<{ quote?: RemoveLiquidityQuote; plan?: RemoveLiquidityPlan; isLoading: boolean; error?: Error }>({ isLoading: false })

  const refresh = useCallback(() => {
    setState({ isLoading: true })
    quoteV2WeightedProportionalRemoval(params)
      .then((quote) => {
        return buildV2WeightedProportionalRemoval(params, quote)
      })
      .then((plan) => {
        setState({ quote: plan.quote, plan, isLoading: false })
      })
      .catch((error) => {
        setState({ isLoading: false, error: error instanceof Error ? error : new Error(String(error)) })
      })
  }, [params])

  return { ...state, refresh }
}
