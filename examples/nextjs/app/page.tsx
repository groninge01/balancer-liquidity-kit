'use client'

import { useState } from 'react'
import { createWeightedPoolState, quoteV2WeightedAddLiquidity, buildV2WeightedAddLiquidity, toHexCallData, type AddLiquidityQuote, type AddLiquidityPlan } from '@balancer/liquidity-kit-core'

const POOL = createWeightedPoolState({
  id: '0x1111111111111111111111111111111111111111111111111111111111111111',
  address: '0x1111111111111111111111111111111111111111',
  tokens: [
    { address: '0x2222222222222222222222222222222222222222', decimals: 18, symbol: 'WETH' },
    { address: '0x3333333333333333333333333333333333333333', decimals: 6, symbol: 'USDC' },
  ],
})

export default function Page() {
  const [rpcUrl, setRpcUrl] = useState('https://eth.llamarpc.com')
  const [sender, setSender] = useState('0x0000000000000000000000000000000000000001')
  const [recipient, setRecipient] = useState('0x0000000000000000000000000000000000000001')
  const [amount0, setAmount0] = useState('1000000000000000000')
  const [amount1, setAmount1] = useState('1000000')
  const [slippage, setSlippage] = useState('1')
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
      const q = await quoteV2WeightedAddLiquidity({
        pool: POOL,
        chainId: 1,
        rpcUrl,
        sender: sender as `0x${string}`,
        recipient: recipient as `0x${string}`,
        amountsIn: [
          { address: POOL.tokens[0].address, decimals: 18, rawAmount: BigInt(amount0) },
          { address: POOL.tokens[1].address, decimals: 6, rawAmount: BigInt(amount1) },
        ],
        slippage: { percentage: slippage as `${number}` },
      })
      setQuote(q)
      const p = await buildV2WeightedAddLiquidity({
        pool: POOL,
        chainId: 1,
        rpcUrl,
        sender: sender as `0x${string}`,
        recipient: recipient as `0x${string}`,
        amountsIn: [
          { address: POOL.tokens[0].address, decimals: 18, rawAmount: BigInt(amount0) },
          { address: POOL.tokens[1].address, decimals: 6, rawAmount: BigInt(amount1) },
        ],
        slippage: { percentage: slippage as `${number}` },
      }, q)
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
        <h2>Pool: V2 Weighted (WETH / USDC)</h2>
        <div className="input-group">
          <label>RPC URL</label>
          <input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Sender Address</label>
          <input value={sender} onChange={(e) => setSender(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Recipient Address</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <h2>Token Amounts</h2>
        <div className="input-group">
          <label>WETH (18 decimals)</label>
          <div className="token-row">
            <input value={amount0} onChange={(e) => setAmount0(e.target.value)} />
            <span>WETH</span>
          </div>
        </div>
        <div className="input-group">
          <label>USDC (6 decimals)</label>
          <div className="token-row">
            <input value={amount1} onChange={(e) => setAmount1(e.target.value)} />
            <span>USDC</span>
          </div>
        </div>
        <div className="input-group">
          <label>Slippage (%)</label>
          <input value={slippage} onChange={(e) => setSlippage(e.target.value)} />
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
          <p className="status">BPT out: {quote.bptOut.amount.toString()}</p>
          <p className="status">Amounts in: {quote.amountsIn.map((a) => a.amount.toString()).join(', ')}</p>
        </div>
      )}

      {plan && (
        <div className="card">
          <h2>Transaction Plan</h2>
          <p className="status">To: {plan.call.to}</p>
          <p className="status">Value: {plan.call.value.toString()}</p>
          <p className="status">Min BPT out: {plan.call.minBptOut.amount.toString()}</p>
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
