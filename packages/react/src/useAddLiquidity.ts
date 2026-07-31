import { useCallback, useState } from 'react'
import {
  quoteV2WeightedAddLiquidity,
  buildV2WeightedAddLiquidity,
  type AddLiquidityInput,
  type AddLiquidityQuote,
  type AddLiquidityPlan,
} from '@balancer/liquidity-kit-core'

export type AddLiquidityHookResult = {
  quote?: AddLiquidityQuote
  plan?: AddLiquidityPlan
  isLoading: boolean
  error?: Error
  refresh: () => void
}

export function useAddLiquidity(params: AddLiquidityInput): AddLiquidityHookResult {
  const [state, setState] = useState<{
    quote?: AddLiquidityQuote
    plan?: AddLiquidityPlan
    isLoading: boolean
    error?: Error
  }>({ isLoading: false })

  const refresh = useCallback(() => {
    setState({ isLoading: true })
    quoteV2WeightedAddLiquidity(params)
      .then(quote => {
        return buildV2WeightedAddLiquidity(params, quote)
      })
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
