'use client'

import { useState } from 'react'
import { parseUnits, formatUnits } from 'viem'
import {
  createV3WeightedPoolState,
  quoteV3WeightedAddLiquidity,
  buildV3WeightedAddLiquidity,
  toHexCallData,
  type AddLiquidityQuote,
  type AddLiquidityPlan,
  type V3WeightedPool,
} from '@balancer/liquidity-kit-core'

const SEPOLIA_RPC = 'https://rpc.sepolia.org'

const POOL: V3WeightedPool = createV3WeightedPoolState({
  id: '0x86fde41ff01b35846eb2f27868fb2938addd44c4',
  address: '0x86fde41ff01b35846eb2f27868fb2938addd44c4',
  tokens: [
    { address: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8', decimals: 6, symbol: 'usdc-aave' },
    { address: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357', decimals: 18, symbol: 'dai-aave' },
  ],
})

export default function Page() {
  const [amounts, setAmounts] = useState<string[]>(['', ''])
  const [slippage, setSlippage] = useState('1')
  const [sender, setSender] = useState('0x0000000000000000000000000000000000000001')
  const [recipient, setRecipient] = useState('0x0000000000000000000000000000000000000001')
  const [quote, setQuote] = useState<AddLiquidityQuote | undefined>()
  const [plan, setPlan] = useState<AddLiquidityPlan | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleQuote() {
    setLoading(true)
    setError(undefined)
    setQuote(undefined)
    setPlan(undefined)
    try {
      const amountsIn = POOL.tokens.map((token, i) => ({
        address: token.address as `0x${string}`,
        decimals: token.decimals,
        rawAmount: parseUnits(amounts[i] || '0', token.decimals),
      }))

      const params = {
        pool: POOL,
        chainId: 11155111,
        rpcUrl: SEPOLIA_RPC,
        sender: sender as `0x${string}`,
        recipient: recipient as `0x${string}`,
        amountsIn,
        slippage: { percentage: slippage as `${number}` },
      }

      const q = await quoteV3WeightedAddLiquidity(params)
      setQuote(q)
      const p = await buildV3WeightedAddLiquidity(params, q)
      setPlan(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Balancer Liquidity Kit — Add Liquidity</h1>

      <div className="card">
        <h2>V3 Weighted — Sepolia</h2>
        <p className="status">Pool: 0x86fde41ff01b35846eb2f27868fb2938addd44c4</p>
        <p className="status">Tokens: usdc-aave (6) / dai-aave (18)</p>
        <p className="status">Pool URL: https://test.balancer.fi/pools/sepolia/v3/0x86fde41ff01b35846eb2f27868fb2938addd44c4</p>
      </div>

      <div className="card">
        <h2>Token Amounts</h2>
        {POOL.tokens.map((token, i) => (
          <div key={i} className="input-group">
            <label>{token.symbol} ({token.decimals} decimals)</label>
            <div className="token-row">
              <input
                value={amounts[i] ?? ''}
                onChange={(e) => {
                  const next = [...amounts]
                  next[i] = e.target.value
                  setAmounts(next)
                }}
                placeholder="0.0"
                type="number"
                step="any"
              />
              <span>{token.symbol}</span>
            </div>
          </div>
        ))}
        <div className="input-group">
          <label>Slippage (%)</label>
          <input value={slippage} onChange={(e) => setSlippage(e.target.value)} type="number" step="any" />
        </div>
        <div className="input-group">
          <label>Sender Address</label>
          <input value={sender} onChange={(e) => setSender(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Recipient Address</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        </div>
        <button onClick={handleQuote} disabled={loading}>
          {loading ? 'Quoting...' : 'Get Quote & Build Plan'}
        </button>
      </div>

      {error && (
        <div className="card">
          <h2>Error</h2>
          <p className="error">{error}</p>
        </div>
      )}

      {quote && (
        <div className="card">
          <h2>Quote</h2>
          <p className="status">BPT out: {formatUnits(quote.bptOut.amount, quote.bptOut.token.decimals)}</p>
          <p className="status">
            Amounts in: {quote.amountsIn.map((a) => formatUnits(a.amount, a.token.decimals)).join(', ')}
          </p>
        </div>
      )}

      {plan && (
        <div className="card">
          <h2>Transaction Plan</h2>
          <p className="status">To: {plan.call.to}</p>
          <p className="status">Value: {plan.call.value.toString()}</p>
          <p className="status">Min BPT out: {formatUnits(plan.call.minBptOut.amount, plan.call.minBptOut.token.decimals)}</p>
          <p className="status">Calldata: {toHexCallData(plan.call).slice(0, 66)}...</p>
          <h2 style={{ marginTop: '1rem' }}>Approvals Required</h2>
          {plan.approvals.map((a, i) => (
            <p key={i} className="status">
              Token {a.token} → Spender {a.spender}: {a.amount.toString()}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
