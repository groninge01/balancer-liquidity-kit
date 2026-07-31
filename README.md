# Balancer Liquidity Kit

A standalone, headless integration layer for Balancer liquidity actions. Provides quoting,
transaction construction, and approval planning for third-party apps.

## Packages

| Package                         | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| `@balancer/liquidity-kit-core`  | Framework-agnostic TypeScript package — quotes, plans, calldata |
| `@balancer/liquidity-kit-react` | Optional React hooks with loading/error state                   |

## Features

- V2/V3 weighted, stable, and boosted pool support
- Add liquidity (unbalanced)
- Remove liquidity (proportional, single-token)
- Approval requirements per transaction
- 11 supported Balancer chains
- Normalized, machine-readable errors
- No React/wagmi dependency in core

## Quick start

```bash
pnpm add @balancer/liquidity-kit-core
```

```ts
import { createWeightedPoolState, quoteV2WeightedAddLiquidity, buildV2WeightedAddLiquidity } from '@balancer/liquidity-kit-core'

const pool = createWeightedPoolState({
  id: '0x...',
  address: '0x...',
  tokens: [
    { address: '0x...', decimals: 18, symbol: 'WETH' },
    { address: '0x...', decimals: 6, symbol: 'USDC' },
  ],
})

const quote = await quoteV2WeightedAddLiquidity({
  pool, chainId: 1, rpcUrl: 'https://...', sender: '0x...', recipient: '0x...',
  amountsIn: [...], slippage: { percentage: '1' },
})

const plan = await buildV2WeightedAddLiquidity({ ... }, quote)
// plan.call.to, plan.call.callData, plan.approvals
```

## Documentation

- [Quickstart](docs/quickstart.md)
- [Add Liquidity Guide](docs/add-liquidity.md)
- [Remove Liquidity Guide](docs/remove-liquidity.md)
- [Pool Support Matrix](docs/pool-support-matrix.md)
- [Transaction Lifecycle](docs/transaction-lifecycle.md)
- [Error Reference](docs/error-reference.md)
- [Security Checklist](docs/security-checklist.md)
- [Versioning Policy](docs/versioning.md)

## Example

A working Next.js example is in `examples/nextjs/`.

```bash
pnpm install
pnpm --filter liquidity-kit-nextjs-example dev
```

## License

MIT
