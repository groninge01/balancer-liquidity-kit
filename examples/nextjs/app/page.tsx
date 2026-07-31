'use client'

import { useState, useEffect } from 'react'
import { parseUnits, formatUnits, erc20Abi } from 'viem'
import { useAccount, useConnect, useDisconnect, useWalletClient, usePublicClient } from 'wagmi'
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
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient({ chainId: 11155111 })

  const [amounts, setAmounts] = useState<string[]>(['', ''])
  const [slippage, setSlippage] = useState('1')
  const [quote, setQuote] = useState<AddLiquidityQuote | undefined>()
  const [plan, setPlan] = useState<AddLiquidityPlan | undefined>()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [txHash, setTxHash] = useState<string | undefined>()
  const [balances, setBalances] = useState<bigint[]>([])
  const [allowances, setAllowances] = useState<bigint[]>([])

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setBalances([])
      setAllowances([])
      return
    }
    let cancelled = false
    async function fetchBalances() {
      const bals: bigint[] = []
      const allow: bigint[] = []
      for (const token of POOL.tokens) {
        try {
          const bal = await publicClient!.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address!],
          }) as bigint
          bals.push(bal)
        } catch { bals.push(0n) }
      }
      if (cancelled) return
      setBalances(bals)
      // Fetch allowances after we have the plan (spender = plan.call.to)
      if (plan) {
        for (const token of POOL.tokens) {
          try {
            const al = await publicClient!.readContract({
              address: token.address as `0x${string}`,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [address!, plan.call.to],
            }) as bigint
            allow.push(al)
          } catch { allow.push(0n) }
        }
        if (!cancelled) setAllowances(allow)
      }
    }
    fetchBalances()
    return () => { cancelled = true }
  }, [isConnected, address, publicClient, plan])

  function hasInsufficientBalance(): boolean {
    return POOL.tokens.some((token, i) => {
      const input = parseUnits(amounts[i] || '0', token.decimals)
      return balances[i] !== undefined && input > balances[i]
    })
  }

  function hasInsufficientAllowance(): boolean {
    if (!plan) return false
    return plan.approvals.some((a, i) => {
      return allowances[i] !== undefined && a.amount > allowances[i]
    })
  }

  async function handleApprove() {
    if (!plan || !walletClient.data || !address) return
    setSending(true)
    setError(undefined)
    try {
      for (let i = 0; i < plan.approvals.length; i++) {
        const approval = plan.approvals[i]
        const currentAllowance = allowances[i] ?? 0n
        if (approval.amount <= currentAllowance) continue
        const hash = await walletClient.data.writeContract({
          address: approval.token,
          abi: erc20Abi,
          functionName: 'approve',
          args: [approval.spender, approval.amount],
          account: address,
        })
        await publicClient!.waitForTransactionReceipt({ hash })
      }
      // Refresh allowances
      const allow: bigint[] = []
      for (const token of POOL.tokens) {
        try {
          const al = await publicClient!.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address!, plan.call.to],
          }) as bigint
          allow.push(al)
        } catch { allow.push(0n) }
      }
      setAllowances(allow)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  async function handleQuote() {
    if (!address) return
    setLoading(true)
    setError(undefined)
    setQuote(undefined)
    setPlan(undefined)
    setTxHash(undefined)
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
        sender: address,
        recipient: address,
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

  async function handleSend() {
    if (!plan || !walletClient.data || !publicClient) return
    setSending(true)
    setError(undefined)
    setTxHash(undefined)
    try {
      const hash = await walletClient.data.sendTransaction({
        to: plan.call.to,
        data: toHexCallData(plan.call),
        value: plan.call.value,
        account: address!,
      })
      setTxHash(hash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'reverted') {
        setError('Transaction reverted')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  const insufficientBalance = hasInsufficientBalance()
  const insufficientAllowance = hasInsufficientAllowance()

  return (
    <div>
      <h1>Balancer Liquidity Kit — Add Liquidity</h1>

      <div className="card">
        <h2>Wallet</h2>
        {!isConnected ? (
          <div className="input-group">
            <label>Connect wallet</label>
            {connectors.map((connector) => (
              <button key={connector.uid} onClick={() => connect({ connector })} style={{ marginRight: '0.5rem' }}>
                {connector.name}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p className="status">Connected: {address}</p>
            <button onClick={() => disconnect()}>Disconnect</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>V3 Weighted — Sepolia</h2>
        <p className="status">Pool: 0x86fde41ff01b35846eb2f27868fb2938addd44c4</p>
        <p className="status">Tokens: usdc-aave (6) / dai-aave (18)</p>
        <p className="status">Pool URL: https://test.balancer.fi/pools/sepolia/v3/0x86fde41ff01b35846eb2f27868fb2938addd44c4</p>
      </div>

      {isConnected && (
        <div className="card">
          <h2>Token Amounts</h2>
          {POOL.tokens.map((token, i) => {
            const balance = balances[i]
            const inputAmount = parseUnits(amounts[i] || '0', token.decimals)
            const hasBalance = balance !== undefined
            const isInsufficient = hasBalance && inputAmount > balance
            return (
              <div key={i} className="input-group">
                <label>
                  {token.symbol} ({token.decimals} decimals)
                  {hasBalance && (
                    <span style={{ marginLeft: '0.5rem', color: isInsufficient ? '#ef4444' : '#888' }}>
                      Balance: {formatUnits(balance, token.decimals)}
                    </span>
                  )}
                </label>
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
                {isInsufficient && (
                  <p className="error" style={{ fontSize: '0.8rem' }}>Insufficient balance</p>
                )}
              </div>
            )
          })}
          <div className="input-group">
            <label>Slippage (%)</label>
            <input value={slippage} onChange={(e) => setSlippage(e.target.value)} type="number" step="any" />
          </div>
          <button onClick={handleQuote} disabled={loading || insufficientBalance}>
            {loading ? 'Quoting...' : 'Get Quote & Build Plan'}
          </button>
        </div>
      )}

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
          <p className="status">Value: {formatUnits(plan.call.value, 18)}</p>
          <p className="status">Min BPT out: {formatUnits(plan.call.minBptOut.amount, plan.call.minBptOut.token.decimals)}</p>
          <p className="status">Calldata: {toHexCallData(plan.call).slice(0, 66)}...</p>
          <h2 style={{ marginTop: '1rem' }}>Approvals</h2>
          {plan.approvals.map((a, i) => {
            const currentAllowance = allowances[i] ?? 0n
            const isSatisfied = a.amount <= currentAllowance
            return (
              <p key={i} className="status" style={{ color: isSatisfied ? '#22c55e' : '#ef4444' }}>
                {POOL.tokens[i].symbol}: {formatUnits(a.amount, POOL.tokens[i].decimals)} needed{' '}
                {isSatisfied ? '✓ approved' : `(allowance: ${formatUnits(currentAllowance, POOL.tokens[i].decimals)})`}
              </p>
            )
          })}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {insufficientAllowance && (
              <button onClick={handleApprove} disabled={sending}>
                {sending ? 'Approving...' : 'Approve Tokens'}
              </button>
            )}
            <button onClick={handleSend} disabled={sending || !walletClient.data || insufficientAllowance || insufficientBalance}>
              {sending ? 'Sending...' : 'Send Transaction'}
            </button>
          </div>
        </div>
      )}

      {txHash && (
        <div className="card">
          <h2>Transaction Sent</h2>
          <p className="success">Hash: {txHash}</p>
          <p className="status">
            View on Etherscan: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>sepolia.etherscan.io/tx/{txHash.slice(0, 10)}...</a>
          </p>
        </div>
      )}
    </div>
  )
}
