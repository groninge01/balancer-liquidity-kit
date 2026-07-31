'use client'

import { useState, useEffect } from 'react'
import { parseUnits, formatUnits, erc20Abi } from 'viem'
import { useAccount, useConnect, useDisconnect, useWalletClient, usePublicClient } from 'wagmi'
import {
  createWeightedPoolState,
  createStablePoolState,
  createV3WeightedPoolState,
  createV3BoostedPoolState,
  quoteV2WeightedAddLiquidity,
  buildV2WeightedAddLiquidity,
  quoteV2StableAddLiquidity,
  buildV2StableAddLiquidity,
  quoteV3WeightedAddLiquidity,
  buildV3WeightedAddLiquidity,
  quoteV3BoostedAddLiquidity,
  buildV3BoostedAddLiquidity,
  quoteV2WeightedProportionalRemoval,
  buildV2WeightedProportionalRemoval,
  quoteV2WeightedSingleTokenRemoval,
  buildV2WeightedSingleTokenRemoval,
  quoteV2StableProportionalRemoval,
  buildV2StableProportionalRemoval,
  quoteV2StableSingleTokenRemoval,
  buildV2StableSingleTokenRemoval,
  quoteV3WeightedProportionalRemoval,
  buildV3WeightedProportionalRemoval,
  quoteV3WeightedSingleTokenRemoval,
  buildV3WeightedSingleTokenRemoval,
  quoteV3BoostedProportionalRemoval,
  buildV3BoostedProportionalRemoval,
  signAddLiquidityPermit2,
  buildAddLiquidityWithPermit2,
  permit2Address,
  toHexCallData,
  type AddLiquidityQuote,
  type AddLiquidityPlan,
  type V3BoostedAddLiquidityQuote,
  type V3BoostedAddLiquidityPlan,
  type RemoveLiquidityQuote,
  type RemoveLiquidityPlan,
  type V3BoostedRemoveLiquidityQuote,
  type V3BoostedRemoveLiquidityPlan,
  type Permit2Plan,
} from '@balancer/liquidity-kit-core'

const SEPOLIA_RPC = 'https://sepolia.drpc.org'
const CHAIN_ID = 11155111

type PoolOption = {
  label: string
  type: 'V2_WEIGHTED' | 'V2_STABLE' | 'V3_WEIGHTED' | 'V3_BOOSTED'
  id: string
  address: string
  tokens: { address: string; decimals: number; symbol: string }[]
}

const POOLS: PoolOption[] = [
  {
    label: 'V2 Weighted (USDC/WETH)',
    type: 'V2_WEIGHTED',
    id: '0x2bbfd10ecca0809fc14c93b8c7dc779af62ee3f400020000000000000000029c',
    address: '0x2bbfd10ecca0809fc14c93b8c7dc779af62ee3f4',
    tokens: [
      { address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', decimals: 6, symbol: 'USDC' },
      { address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14', decimals: 18, symbol: 'WETH' },
    ],
  },
  {
    label: 'V2 Composable Stable (usdc-aave/dai-aave)',
    type: 'V2_STABLE',
    id: '0x6c3966874f49a2f6a8f2f791f82f65b214e90ccb0000000000000000000001a6',
    address: '0x6c3966874f49a2f6a8f2f791f82f65b214e90ccb',
    tokens: [
      { address: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8', decimals: 6, symbol: 'usdc-aave' },
      { address: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357', decimals: 18, symbol: 'dai-aave' },
    ],
  },
  {
    label: 'V3 Weighted (usdc-aave/dai-aave)',
    type: 'V3_WEIGHTED',
    id: '0x86fde41ff01b35846eb2f27868fb2938addd44c4',
    address: '0x86fde41ff01b35846eb2f27868fb2938addd44c4',
    tokens: [
      { address: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8', decimals: 6, symbol: 'usdc-aave' },
      { address: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357', decimals: 18, symbol: 'dai-aave' },
    ],
  },
  {
    label: 'V3 Boosted (bb-a-USD/stataEthDAI)',
    type: 'V3_BOOSTED',
    id: '0xc832a37c8252117604f1329b4a7fed7076880b27',
    address: '0xc832a37c8252117604f1329b4a7fed7076880b27',
    tokens: [
      { address: '0x59fa488dda749cdd41772bb068bb23ee955a6d7a', decimals: 18, symbol: 'bb-a-USD' },
      { address: '0xde46e43f46ff74a23a65ebb0580cbe3dfe684a17', decimals: 18, symbol: 'stataEthDAI' },
    ],
  },
]

type Action = 'add' | 'remove'
type RemoveMode = 'proportional' | 'single-token'

type AnyQuote = AddLiquidityQuote | V3BoostedAddLiquidityQuote | RemoveLiquidityQuote | V3BoostedRemoveLiquidityQuote
type AnyPlan = AddLiquidityPlan | V3BoostedAddLiquidityPlan | RemoveLiquidityPlan | V3BoostedRemoveLiquidityPlan

export default function Page() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })

  const [poolIdx, setPoolIdx] = useState(2)
  const [action, setAction] = useState<Action>('add')
  const [removeMode, setRemoveMode] = useState<RemoveMode>('proportional')
  const [tokenOutIdx, setTokenOutIdx] = useState(0)
  const [amounts, setAmounts] = useState<string[]>(['', ''])
  const [bptAmount, setBptAmount] = useState('')
  const [slippage, setSlippage] = useState('1')
  const [quote, setQuote] = useState<AnyQuote | undefined>()
  const [plan, setPlan] = useState<AnyPlan | undefined>()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [txHash, setTxHash] = useState<string | undefined>()
  const [balances, setBalances] = useState<bigint[]>([])
  const [allowances, setAllowances] = useState<bigint[]>([])
  const [permit2Allowances, setPermit2Allowances] = useState<bigint[]>([])
  const [permit2Plan, setPermit2Plan] = useState<Permit2Plan | undefined>()
  const [signing, setSigning] = useState(false)
  const [bptBalance, setBptBalance] = useState<bigint | undefined>()

  const pool = POOLS[poolIdx]
  const tokenSymbols = pool.tokens.map(t => t.symbol)

  function getPoolState() {
    const tokens = pool.tokens.map(t => ({ address: t.address as `0x${string}`, decimals: t.decimals }))
    switch (pool.type) {
      case 'V2_WEIGHTED':
        return createWeightedPoolState({ id: pool.id as `0x${string}`, address: pool.address as `0x${string}`, tokens })
      case 'V2_STABLE':
        return createStablePoolState({ id: pool.id as `0x${string}`, address: pool.address as `0x${string}`, tokens })
      case 'V3_WEIGHTED':
        return createV3WeightedPoolState({ id: pool.id as `0x${string}`, address: pool.address as `0x${string}`, tokens })
      case 'V3_BOOSTED':
        return createV3BoostedPoolState({ id: pool.id as `0x${string}`, address: pool.address as `0x${string}`, tokens })
    }
  }

  const isV3 = pool.type === 'V3_WEIGHTED' || pool.type === 'V3_BOOSTED'
  const p2Address = permit2Address as `0x${string}`

  // Reset state when pool or action changes
  useEffect(() => {
    setAmounts(pool.tokens.map(() => ''))
    setBptAmount('')
    setQuote(undefined)
  setPlan(undefined)
  setPermit2Plan(undefined)
  setBalances([])
  setAllowances([])
  setPermit2Allowances([])
  }, [poolIdx, action])

  useEffect(() => {
    if (!isConnected || !address || !publicClient) return
    let cancelled = false
    async function fetchBalances() {
      const bals: bigint[] = []
      for (const token of pool.tokens) {
        try {
          const bal = (await publicClient!.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address!],
          })) as bigint
          bals.push(bal)
        } catch {
          bals.push(0n)
        }
      }
      if (!cancelled) setBalances(bals)
        // Fetch BPT balance
        try {
          const bptBal = (await publicClient!.readContract({
            address: pool.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address!],
        })) as bigint
        if (!cancelled) setBptBalance(bptBal)
      } catch {
        if (!cancelled) setBptBalance(0n)
      }
        // Fetch Permit2 allowances for V3 pools
        if (isV3) {
        const p2Allow: bigint[] = []
        for (const token of pool.tokens) {
          try {
            const al = (await publicClient!.readContract({
              address: token.address as `0x${string}`,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [address!, p2Address],
            })) as bigint
            p2Allow.push(al)
          } catch {
            p2Allow.push(0n)
          }
        }
        if (!cancelled) setPermit2Allowances(p2Allow)
      }
    }
    fetchBalances()
    return () => { cancelled = true }
  }, [isConnected, address, publicClient, poolIdx])

  useEffect(() => {
    if (!isConnected || !address || !publicClient || !plan) return
    let cancelled = false
    async function fetchAllowances() {
      const spender = (plan as { call: { to: string } }).call.to
      const allow: bigint[] = []
      for (const token of pool.tokens) {
        try {
          const al = (await publicClient!.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address!, spender as `0x${string}`],
          })) as bigint
          allow.push(al)
        } catch {
          allow.push(0n)
        }
      }
      if (!cancelled) setAllowances(allow)
    }
    fetchAllowances()
    return () => { cancelled = true }
  }, [plan, isConnected, address, publicClient, poolIdx])

  function hasInsufficientBalance(): boolean {
    if (action === 'add') {
      return pool.tokens.some((token, i) => {
        const input = parseUnits(amounts[i] || '0', token.decimals)
        return balances[i] !== undefined && input > balances[i]
      })
    }
    if (action === 'remove' && bptBalance !== undefined) {
        return parseUnits(bptAmount || '0', 18) > bptBalance
    }
    return false
  }

  function hasInsufficientAllowance(): boolean {
    if (!plan || action === 'remove') return false
    if (!('approvals' in plan)) return false
    return (plan as { approvals: { amount: bigint }[] }).approvals.some((a, i) => {
      return allowances[i] !== undefined && a.amount > allowances[i]
    })
  }

  async function handleQuote() {
    if (!address) return
    setLoading(true)
    setError(undefined)
    setQuote(undefined)
    setPlan(undefined)
    setTxHash(undefined)
    try {
      const poolState = getPoolState() as never
      if (action === 'add') {
        const amountsIn = pool.tokens.map((token, i) => ({
          address: token.address as `0x${string}`,
          decimals: token.decimals,
          rawAmount: parseUnits(amounts[i] || '0', token.decimals),
        }))
        const params = {
          pool: poolState,
          chainId: CHAIN_ID,
          rpcUrl: SEPOLIA_RPC,
          sender: address,
          recipient: address,
          amountsIn,
          slippage: { percentage: slippage as `${number}` },
        }
        let q: AnyQuote, p: AnyPlan
        if (pool.type === 'V2_WEIGHTED') {
          q = await quoteV2WeightedAddLiquidity(params as never) as AnyQuote
          p = await buildV2WeightedAddLiquidity(params as never, q as never) as AnyPlan
        } else if (pool.type === 'V2_STABLE') {
          q = await quoteV2StableAddLiquidity(params as never) as AnyQuote
          p = await buildV2StableAddLiquidity(params as never, q as never) as AnyPlan
        } else if (pool.type === 'V3_WEIGHTED') {
          q = await quoteV3WeightedAddLiquidity(params as never) as AnyQuote
          p = await buildV3WeightedAddLiquidity(params as never, q as never) as AnyPlan
        } else {
          q = await quoteV3BoostedAddLiquidity(params as never) as AnyQuote
          p = await buildV3BoostedAddLiquidity(params as never, q as never) as AnyPlan
        }
        setQuote(q)
        setPlan(p)
      } else {
        const bptIn = {
          address: pool.address as `0x${string}`,
          decimals: 18,
          rawAmount: parseUnits(bptAmount || '0', 18),
        }
        const baseParams = {
          pool: poolState,
          chainId: CHAIN_ID,
          rpcUrl: SEPOLIA_RPC,
          sender: address,
          recipient: address,
          bptIn,
          slippage: { percentage: slippage as `${number}` },
        }
        let q: AnyQuote, p: AnyPlan
        if (pool.type === 'V2_WEIGHTED') {
          if (removeMode === 'single-token') {
            const params = { ...baseParams, tokenOut: pool.tokens[tokenOutIdx].address as `0x${string}` }
            q = await quoteV2WeightedSingleTokenRemoval(params as never) as AnyQuote
            p = buildV2WeightedSingleTokenRemoval(params as never, q as never) as AnyPlan
          } else {
            q = await quoteV2WeightedProportionalRemoval(baseParams as never) as AnyQuote
            p = buildV2WeightedProportionalRemoval(baseParams as never, q as never) as AnyPlan
          }
        } else if (pool.type === 'V2_STABLE') {
          if (removeMode === 'single-token') {
            const params = { ...baseParams, tokenOut: pool.tokens[tokenOutIdx].address as `0x${string}` }
            q = await quoteV2StableSingleTokenRemoval(params as never) as AnyQuote
            p = buildV2StableSingleTokenRemoval(params as never, q as never) as AnyPlan
          } else {
            q = await quoteV2StableProportionalRemoval(baseParams as never) as AnyQuote
            p = buildV2StableProportionalRemoval(baseParams as never, q as never) as AnyPlan
          }
        } else if (pool.type === 'V3_WEIGHTED') {
          if (removeMode === 'single-token') {
            const params = { ...baseParams, tokenOut: pool.tokens[tokenOutIdx].address as `0x${string}` }
            q = await quoteV3WeightedSingleTokenRemoval(params as never) as AnyQuote
            p = buildV3WeightedSingleTokenRemoval(params as never, q as never) as AnyPlan
          } else {
            q = await quoteV3WeightedProportionalRemoval(baseParams as never) as AnyQuote
            p = buildV3WeightedProportionalRemoval(baseParams as never, q as never) as AnyPlan
          }
        } else {
          const params = { ...baseParams, tokensOut: pool.tokens.map(t => t.address as `0x${string}`) }
          q = await quoteV3BoostedProportionalRemoval(params as never) as AnyQuote
          p = buildV3BoostedProportionalRemoval(params as never, q as never) as AnyPlan
        }
        setQuote(q)
        setPlan(p)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!plan || !walletClient.data || !address) return
    if (!('approvals' in plan)) return
    setSending(true)
    setError(undefined)
    try {
      const approvals = (plan as { approvals: { token: string; spender: string; amount: bigint }[] }).approvals
      for (let i = 0; i < approvals.length; i++) {
        const approval = approvals[i]
        const currentAllowance = allowances[i] ?? 0n
        if (approval.amount <= currentAllowance) continue
        const hash = await walletClient.data.writeContract({
          address: approval.token as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [approval.spender as `0x${string}`, approval.amount],
          account: address,
        })
        await publicClient!.waitForTransactionReceipt({ hash })
      }
      const spender = (plan as { call: { to: string } }).call.to
      const allow: bigint[] = []
      for (const token of pool.tokens) {
        try {
          const al = (await publicClient!.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address!, spender as `0x${string}`],
          })) as bigint
          allow.push(al)
        } catch {
          allow.push(0n)
        }
      }
      setAllowances(allow)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  async function handleApprovePermit2() {
    if (!walletClient.data || !address) return
    setSending(true)
    setError(undefined)
    try {
        for (let i = 0; i < pool.tokens.length; i++) {
          const currentAllowance = permit2Allowances[i] ?? 0n
          const neededAmount = parseUnits(amounts[i] || '0', pool.tokens[i].decimals)
        if (neededAmount <= currentAllowance) continue
        const hash = await walletClient.data.writeContract({
            address: pool.tokens[i].address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [p2Address, 2n ** 256n - 1n],
          account: address,
        })
        await publicClient!.waitForTransactionReceipt({ hash })
        }
        const p2Allow: bigint[] = []
        for (const token of pool.tokens) {
        try {
          const al = (await publicClient!.readContract({
            address: token.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address!, p2Address],
          })) as bigint
          p2Allow.push(al)
        } catch {
          p2Allow.push(0n)
        }
        }
        setPermit2Allowances(p2Allow)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setSending(false)
      }
    }

    async function handleSignPermit2() {
      if (!quote || !walletClient.data || !address) return
      setSigning(true)
      setError(undefined)
      try {
        const permit2 = await signAddLiquidityPermit2({
        chainId: CHAIN_ID,
        client: walletClient.data as never,
        owner: address,
        quote: quote as AddLiquidityQuote,
        slippage: { percentage: slippage as `${number}` },
        sender: address,
        recipient: address,
        wethIsEth: false,
        })
        const p2Plan = buildAddLiquidityWithPermit2(
        quote as AddLiquidityQuote,
        permit2,
        { percentage: slippage as `${number}` },
        address,
        address,
        false
        )
        setPermit2Plan(p2Plan)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setSigning(false)
      }
    }

    async function handleSend() {
      if (!plan || !walletClient.data || !publicClient) return
      setSending(true)
      setError(undefined)
      setTxHash(undefined)
      try {
        const call = isV3 && permit2Plan ? permit2Plan.call : plan.call
        const callData = 'callData' in call ? call.callData : (call as { callData: string }).callData
        const hash = await walletClient.data.sendTransaction({
        to: call.to as `0x${string}`,
        data: callData as `0x${string}`,
        value: call.value,
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
  const supportsSingleToken = pool.type !== 'V3_BOOSTED'

  const needsPermit2Approval = isV3 && action === 'add' && pool.tokens.some((token, i) => {
    const needed = parseUnits(amounts[i] || '0', token.decimals)
    return (permit2Allowances[i] ?? 0n) < needed
  })
  const hasPermit2Signature = !!permit2Plan
  const canSendV3 = isV3 && action === 'add' ? !needsPermit2Approval && hasPermit2Signature : !insufficientAllowance
  const canSend = canSendV3 && !insufficientBalance

  return (
    <div>
      <h1>Balancer Liquidity Kit</h1>

      <div className="card">
        <h2>Wallet</h2>
        {!isConnected ? (
          <div className="input-group">
            <label>Connect wallet</label>
            {connectors.map(connector => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                style={{ marginRight: '0.5rem' }}
              >
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
        <h2>Configuration</h2>
        <div className="input-group">
          <label>Pool</label>
          <select
            onChange={e => setPoolIdx(Number(e.target.value))}
            style={{ background: '#1a1a1a', color: '#e0e0e0', padding: '0.5rem', borderRadius: '4px', border: '1px solid #333' }}
            value={poolIdx}
          >
            {POOLS.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Action</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setAction('add')}
              style={{ background: action === 'add' ? '#2563eb' : '#333' }}
            >
              Add Liquidity
            </button>
            <button
              onClick={() => setAction('remove')}
              style={{ background: action === 'remove' ? '#2563eb' : '#333' }}
            >
              Remove Liquidity
            </button>
          </div>
        </div>
        {action === 'remove' && supportsSingleToken && (
          <div className="input-group">
            <label>Remove mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setRemoveMode('proportional')}
                style={{ background: removeMode === 'proportional' ? '#2563eb' : '#333' }}
              >
                Proportional
              </button>
              <button
                onClick={() => setRemoveMode('single-token')}
                style={{ background: removeMode === 'single-token' ? '#2563eb' : '#333' }}
              >
                Single Token
              </button>
            </div>
          </div>
        )}
        {action === 'remove' && removeMode === 'single-token' && supportsSingleToken && (
          <div className="input-group">
            <label>Token out</label>
            <select
              onChange={e => setTokenOutIdx(Number(e.target.value))}
              style={{ background: '#1a1a1a', color: '#e0e0e0', padding: '0.5rem', borderRadius: '4px', border: '1px solid #333' }}
              value={tokenOutIdx}
            >
              {pool.tokens.map((t, i) => (
                <option key={i} value={i}>{t.symbol}</option>
              ))}
            </select>
          </div>
        )}
        <p className="status">Pool: {pool.id}</p>
        <p className="status">Tokens: {tokenSymbols.join(' / ')}</p>
      </div>

      {isConnected && (
        <div className="card">
          <h2>{action === 'add' ? 'Token Amounts' : 'BPT Amount'}</h2>
          {action === 'add' ? (
            pool.tokens.map((token, i) => {
              const balance = balances[i]
              const inputAmount = parseUnits(amounts[i] || '0', token.decimals)
              const hasBalance = balance !== undefined
              const isInsufficient = hasBalance && inputAmount > balance
              return (
                <div className="input-group" key={i}>
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
                      onChange={e => {
                        const next = [...amounts]
                        next[i] = e.target.value
                        setAmounts(next)
                      }}
                      placeholder="0.0"
                      step="any"
                      type="number"
                      value={amounts[i] ?? ''}
                    />
                    <span>{token.symbol}</span>
                  </div>
                  {isInsufficient && (
                    <p className="error" style={{ fontSize: '0.8rem' }}>Insufficient balance</p>
                  )}
                </div>
              )
            })
          ) : (
            <div className="input-group">
              <label>
                  BPT to burn (18 decimals)
                {bptBalance !== undefined && (
                  <span
                      style={{
                        marginLeft: '0.5rem',
                        color:
                          bptBalance < parseUnits(bptAmount || '0', 18)
                            ? '#ef4444'
                            : '#888',
                      }}
                    >
                      Balance: {formatUnits(bptBalance, 18)}
                  </span>
                )}
              </label>
              <div className="token-row">
                <input
                  onChange={e => setBptAmount(e.target.value)}
                  placeholder="0.0"
                  step="any"
                  type="number"
                  value={bptAmount}
                />
                <span>BPT</span>
              </div>
              {bptBalance !== undefined &&
                bptBalance < parseUnits(bptAmount || '0', 18) && (
                  <p className="error" style={{ fontSize: '0.8rem' }}>
                    Insufficient BPT balance
                  </p>
                )}
            </div>
          )}
          <div className="input-group">
            <label>Slippage (%)</label>
            <input
              onChange={e => setSlippage(e.target.value)}
              step="any"
              type="number"
              value={slippage}
            />
          </div>
          <button disabled={loading || insufficientBalance} onClick={handleQuote}>
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
          {'bptOut' in quote && (
            <p className="status">
              BPT out:{' '}
              {formatUnits(
                (quote as { bptOut: { amount: bigint } }).bptOut.amount,
                (quote as { bptOut: { token: { decimals: number } } }).bptOut.token.decimals
              )}
            </p>
          )}
          {'amountsOut' in quote && (
            <p className="status">
              Amounts out:{' '}
              {(quote as { amountsOut: { amount: bigint; token: { decimals: number } }[] }).amountsOut.map(a => formatUnits(a.amount, a.token.decimals)).join(', ')}
            </p>
          )}
          {'amountsIn' in quote && (
            <p className="status">
              Amounts in:{' '}
              {(quote as { amountsIn: { amount: bigint; token: { decimals: number } }[] }).amountsIn.map(a => formatUnits(a.amount, a.token.decimals)).join(', ')}
            </p>
          )}
          {'priceImpact' in quote && (quote as { priceImpact?: { percentage: number } }).priceImpact && (
            <p className="status">
              Price impact: {(quote as { priceImpact: { percentage: number } }).priceImpact.percentage}%
            </p>
          )}
        </div>
      )}

      {plan && (
        <div className="card">
          <h2>Transaction Plan</h2>
          <p className="status">To: {plan.call.to}</p>
          <p className="status">Value: {formatUnits(plan.call.value, 18)}</p>
          {'minBptOut' in plan.call && (
            <p className="status">
              Min BPT out:{' '}
              {formatUnits(
                (plan.call as { minBptOut: { amount: bigint } }).minBptOut.amount,
                (plan.call as { minBptOut: { token: { decimals: number } } }).minBptOut.token.decimals
              )}
            </p>
          )}
          {'maxBptIn' in plan.call && (
            <p className="status">
              Max BPT in:{' '}
              {formatUnits(
                (plan.call as { maxBptIn: { amount: bigint } }).maxBptIn.amount,
                (plan.call as { maxBptIn: { token: { decimals: number } } }).maxBptIn.token.decimals
              )}
            </p>
          )}
          {'minAmountsOut' in plan.call && (
            <p className="status">
              Min amounts out:{' '}
              {(plan.call as { minAmountsOut: { amount: bigint; token: { decimals: number } }[] }).minAmountsOut.map(a => formatUnits(a.amount, a.token.decimals)).join(', ')}
            </p>
          )}
          <p className="status">Calldata: {toHexCallData(plan.call as never).slice(0, 66)}...</p>
          {'approvals' in plan && (plan as { approvals: { token: string; spender: string; amount: bigint }[] }).approvals.length > 0 && (
            <>
              <h2 style={{ marginTop: '1rem' }}>Approvals</h2>
              {(plan as { approvals: { token: string; spender: string; amount: bigint }[] }).approvals.map((a, i) => {
                const currentAllowance = allowances[i] ?? 0n
                const isSatisfied = a.amount <= currentAllowance
                return (
                  <p className="status" key={i} style={{ color: isSatisfied ? '#22c55e' : '#ef4444' }}>
                    {tokenSymbols[i]}: {formatUnits(a.amount, pool.tokens[i].decimals)} needed{' '}
                    {isSatisfied
                      ? '✓ approved'
                      : `(allowance: ${formatUnits(currentAllowance, pool.tokens[i].decimals)})`}
                  </p>
                )
              })}
            </>
          )}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {isV3 && action === 'add' && needsPermit2Approval && (
              <button disabled={sending} onClick={handleApprovePermit2}>
                {sending ? 'Approving...' : '1. Approve to Permit2'}
              </button>
            )}
            {isV3 && action === 'add' && !needsPermit2Approval && !hasPermit2Signature && (
              <button disabled={signing} onClick={handleSignPermit2}>
                  {signing ? 'Signing...' : '2. Sign Permit2'}
                </button>
              )}
            {isV3 && action === 'add' && hasPermit2Signature && (
                <p className="status" style={{ color: '#22c55e' }}>✓ Permit2 signed</p>
            )}
            {!isV3 && action === 'add' && insufficientAllowance && (
              <button disabled={sending} onClick={handleApprove}>
                {sending ? 'Approving...' : 'Approve Tokens'}
              </button>
            )}
            <button
              disabled={sending || signing || !walletClient.data || !canSend}
              onClick={handleSend}
            >
              {sending ? 'Sending...' : isV3 && action === 'add' ? '3. Send Transaction' : 'Send Transaction'}
            </button>
          </div>
        </div>
      )}

      {txHash && (
        <div className="card">
          <h2>Transaction Sent</h2>
          <p className="success">Hash: {txHash}</p>
          <p className="status">
            View on Etherscan:{' '}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
              target="_blank"
            >
              sepolia.etherscan.io/tx/{txHash.slice(0, 10)}...
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
