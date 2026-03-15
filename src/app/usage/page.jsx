'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", background: 'var(--navy)' },
  main: { flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 24 },
  heading: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' },
  sub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  select: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif", appearance: 'none' },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)', fontSize: 13 },
}

function FilterBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
      fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
      background: active ? 'var(--blue)' : 'var(--navy-mid)',
      color: active ? '#fff' : 'var(--text-secondary)',
      border: active ? '1px solid var(--blue)' : '1px solid var(--border)',
    }}>{label}</button>
  )
}

export default function UsagePage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [usageLog, setUsageLog] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [usedAt, setUsedAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else { fetchProducts(); fetchUsage() }
    })
  }, [])

  async function fetchProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.filter(p => p.qty > 0))
  }

  async function fetchUsage() {
    const res = await fetch('/api/usage')
    setUsageLog(await res.json())
  }

  async function deleteUsage(id) {
    if (!confirm('Delete this usage record? This cannot be undone.')) return
    await fetch('/api/usage', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchUsage()
  }

  const product = products.find(p => p.id === parseInt(selectedProduct))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!product) return
    if (quantity > product.qty) { setError(`Only ${product.qty} units available`); return }
    setLoading(true); setError('')
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, product_name: product.name, quantity, used_at: usedAt }),
    })
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, qty: product.qty - quantity, action: 'Used', prev_qty: product.qty }),
    })
    setSuccess(true); setSelectedProduct(''); setQuantity(1)
    setUsedAt(new Date().toISOString().split('T')[0])
    setLoading(false); fetchProducts(); fetchUsage()
    setTimeout(() => setSuccess(false), 3000)
  }

  const now = new Date()
  const filtered = usageLog.filter(u => {
    const date = new Date(u.used_at)
    if (filter === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return date >= w }
    if (filter === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    return true
  })

  const summary = filtered.reduce((acc, u) => {
    acc[u.product_name] = (acc[u.product_name] || 0) + u.quantity
    return acc
  }, {})

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Chemical Usage</div>
          <div style={S.sub}>Log chemicals used for car wash services</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Form */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Log Usage</div>

            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', marginBottom: 16 }}>
                Usage logged successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>Chemical</label>
                <select style={S.select} value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setQuantity(1) }} required>
                  <option value="">Select a chemical</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.qty} left)</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Quantity Used</label>
                <input style={S.input} type="number" min="1" max={product?.qty || 1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} required />
                {product && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{product.qty} units available</div>}
              </div>
              <div>
                <label style={S.label}>Date Used</label>
                <input style={S.input} type="date" value={usedAt} onChange={e => setUsedAt(e.target.value)} required />
              </div>
              {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
              <button type="submit" disabled={loading || !product} style={{
                background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
                color: '#fff', border: 'none', borderRadius: 10, padding: '13px',
                fontSize: 14, fontWeight: 700, cursor: loading || !product ? 'not-allowed' : 'pointer',
                opacity: loading || !product ? 0.5 : 1,
                fontFamily: "'Barlow', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {loading ? 'Logging...' : 'Log Usage'}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Usage Summary</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
                <FilterBtn active={filter === 'month'} onClick={() => setFilter('month')} label="Month" />
                <FilterBtn active={filter === 'week'} onClick={() => setFilter('week')} label="Week" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.keys(summary).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No usage recorded yet.</div>
              ) : Object.entries(summary).sort((a, b) => b[1] - a[1]).map(([name, qty]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(30,58,82,0.5)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue-glow)' }}>{qty} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Usage Log</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
              <FilterBtn active={filter === 'month'} onClick={() => setFilter('month')} label="Month" />
              <FilterBtn active={filter === 'week'} onClick={() => setFilter('week')} label="Week" />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No usage records found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={S.th}>Chemical</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Qty Used</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Date</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, fontWeight: 600 }}>{u.product_name}</td>
                    <td style={{ ...S.td, textAlign: 'center', color: 'var(--blue-glow)', fontWeight: 700 }}>{u.quantity}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(u.used_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        onClick={() => deleteUsage(u.id)}
                        style={{
                          padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                          background: 'rgba(248,113,113,0.1)', color: '#f87171',
                          border: '1px solid rgba(248,113,113,0.3)',
                          transition: 'all 0.15s',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}