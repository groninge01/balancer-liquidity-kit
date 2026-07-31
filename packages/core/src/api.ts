import { createLiquidityKitError } from './errors'
import type { ApiClientOptions, BalancerApiClient } from './types'

export function createBalancerApiClient(options: ApiClientOptions): BalancerApiClient {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const timeoutMs = options.timeoutMs ?? 10_000
  const retries = options.retries ?? 2
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  return {
    async get<T>(path: string, init?: RequestInit): Promise<T> {
      let lastError: unknown
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const response = await fetchImpl(`${baseUrl}${path}`, { ...init, signal: controller.signal })
          if (response.ok) return (await response.json()) as T
          if (response.status < 500 && response.status !== 429) {
            throw createLiquidityKitError('QUOTE_FAILED', `Balancer API returned ${response.status}`, {
              details: { status: response.status },
              retryable: false,
            })
          }
          lastError = new Error(`Balancer API returned ${response.status}`)
        } catch (error) {
          lastError = error
        } finally {
          clearTimeout(timeout)
        }
      }
      throw createLiquidityKitError('QUOTE_FAILED', 'Balancer API request failed', { cause: lastError })
    },
  }
}
