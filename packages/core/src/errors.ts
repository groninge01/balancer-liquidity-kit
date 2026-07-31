import type { LiquidityKitError, LiquidityKitErrorCode } from './types'

const retryableCodes = new Set<LiquidityKitErrorCode>(['QUOTE_FAILED', 'SIMULATION_FAILED'])

export function createLiquidityKitError(
  code: LiquidityKitErrorCode,
  message: string,
  options: {
    cause?: unknown
    details?: Record<string, unknown>
    retryable?: boolean
  } = {}
): LiquidityKitError {
  return {
    code,
    message,
    cause: options.cause,
    details: options.details,
    retryable: options.retryable ?? retryableCodes.has(code),
  }
}

export function normalizeError(
  error: unknown,
  fallbackCode: LiquidityKitErrorCode = 'TRANSACTION_FAILED'
): LiquidityKitError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string' &&
    'retryable' in error &&
    typeof (error as { retryable: unknown }).retryable === 'boolean'
  ) {
    return error as LiquidityKitError
  }
  const message = error instanceof Error ? error.message : String(error)
  return createLiquidityKitError(fallbackCode, message, { cause: error })
}
