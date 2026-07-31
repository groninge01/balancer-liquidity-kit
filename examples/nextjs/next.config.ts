import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@balancer/liquidity-kit-core', '@balancer/liquidity-kit-react'],
}

export default config
