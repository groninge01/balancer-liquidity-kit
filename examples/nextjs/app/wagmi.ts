'use client'

import { http, createConfig, createStorage } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  storage: createStorage({ key: 'liquidity-kit-example' }),
  ssr: true,
  transports: {
    [sepolia.id]: http('https://sepolia.drpc.org'),
  },
})
