import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@balancer/liquidity-kit-core', '@balancer/liquidity-kit-react'],
  turbopack: {
    resolveAlias: {
      '@x402/evm/upto/client': { browser: 'data:text/javascript,export{}', node: 'data:text/javascript,export{}' },
      '@x402/evm/exact/client': { browser: 'data:text/javascript,export{}', node: 'data:text/javascript,export{}' },
      '@x402/core/client': { browser: 'data:text/javascript,export{}', node: 'data:text/javascript,export{}' },
    },
  },
}

export default config
