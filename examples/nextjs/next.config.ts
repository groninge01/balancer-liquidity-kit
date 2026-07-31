import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@balancer/liquidity-kit-core', '@balancer/liquidity-kit-react'],
  webpack: (config) => {
    config.externals = config.externals || []
    config.externals.push({
      '@x402/evm/upto/client': 'commonjs @x402/evm/upto/client',
      '@x402/evm/exact/client': 'commonjs @x402/evm/exact/client',
      '@x402/core/client': 'commonjs @x402/core/client',
    })
    return config
  },
}

export default config
