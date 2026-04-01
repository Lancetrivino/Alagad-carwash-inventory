'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useIsMobile } from '@/hooks/useIsMobile'

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", background: 'var(--navy)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  select: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif", appearance: 'none' },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)', fontSize: 13 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
}

function QuickBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
      background: active ? 'var(--blue)' : 'var(--navy-mid)',
      color: active ? '#fff' : 'var(--text-secondary)',
      border: active ? '1px solid var(--blue)' : '1px solid var(--border)',
      whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

export default function RestockPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [products, setProducts] = useState([])
  const [restockLog, setRestockLog] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cost, setCost] = useState('')
  const [restockedAt, setRestockedAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [searchProduct, setSearchProduct] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else { fetchProducts(); fetchRestock() }
    })
  }, [])

  async function fetchProducts() {
    const res = await fetch('/api/products')
    setProducts(await res.json())
  }

  async function fetchRestock() {
    const res = await fetch('/api/restock')
    setRestockLog(await res.json())
  }

  async function deleteRestock(id) {
    if (!confirm('Delete this restock record? Stock quantity will NOT be reversed.')) return
    await fetch('/api/restock', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchRestock()
  }

  const product = products.find(p => p.id === parseInt(selectedProduct))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!product) { setError('Please select a chemical'); return }
    if (quantity < 1) { setError('Quantity must be at least 1'); return }
    setLoading(true); setError('')
    await fetch('/api/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        product_name: product.name,
        quantity: parseInt(quantity),
        cost: parseFloat(cost) || 0,
        restocked_at: restockedAt,
      }),
    })
    setSuccess(true)
    setSelectedProduct(''); setQuantity(1); setCost('')
    setRestockedAt(new Date().toISOString().split('T')[0])
    setLoading(false)
    fetchProducts(); fetchRestock()
    setTimeout(() => setSuccess(false), 3000)
  }

  function applyQuickFilter(filter) {
    setQuickFilter(filter)
    const now = new Date()
    if (filter === 'today') {
      const today = now.toISOString().split('T')[0]
      setStartDate(today); setEndDate(today)
    } else if (filter === 'week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(new Date().setDate(diff))
      setStartDate(monday.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else if (filter === 'month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else {
      setStartDate(''); setEndDate('')
    }
  }

  const filtered = restockLog.filter(r => {
    const matchStart = startDate ? r.restocked_at >= startDate : true
    const matchEnd = endDate ? r.restocked_at <= endDate : true
    const matchSearch = searchProduct
      ? r.product_name?.toLowerCase().includes(searchProduct.toLowerCase())
      : true
    return matchStart && matchEnd && matchSearch
  })

  const totalQty = filtered.reduce((s, r) => s + r.quantity, 0)
  const totalCost = filtered.reduce((s, r) => s + (r.cost || 0), 0)

  // Summary by product
  const productSummary = filtered.reduce((acc, r) => {
    if (!acc[r.product_name]) acc[r.product_name] = { qty: 0, cost: 0 }
    acc[r.product_name].qty += r.quantity
    acc[r.product_name].cost += r.cost || 0
    return acc
  }, {})

  const mainPadding = isMobile ? '80px 16px 90px' : '28px'

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, padding: mainPadding, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }}>

        {!isMobile && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chemical Restock</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Record every restock — auto-adds to current stock</div>
          </div>
        )}

        {/* Form + Summary side by side on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20 }}>

          {/* Restock Form */}
          <div style={{ ...S.card, padding: isMobile ? 16 : 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Record Restock
            </div>

            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', marginBottom: 16 }}>
                ✓ Restocked! Stock quantity updated.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>Chemical</label>
                <select style={S.select} value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
                  <option value="">Select a chemical</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (stock: {p.qty})</option>
                  ))}
                </select>
                {product && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Current stock: <span style={{ color: product.qty <= 2 ? '#f87171' : '#4ade80', fontWeight: 700 }}>{product.qty} units</span>
                    {' → after restock: '}
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>{product.qty + (parseInt(quantity) || 0)} units</span>
                  </div>
                )}
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Quantity Added</label>
                  <input style={S.input} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                </div>
                <div>
                  <label style={S.label}>Cost Paid (₱)</label>
                  <input style={S.input} type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div>
                <label style={S.label}>Date Restocked</label>
                <input style={S.input} type="date" value={restockedAt} onChange={e => setRestockedAt(e.target.value)} required />
              </div>

              {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}

              <button type="submit" disabled={loading || !product} style={{
                background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: isMobile ? '15px' : '13px',
                fontSize: 14, fontWeight: 700,
                cursor: loading || !product ? 'not-allowed' : 'pointer',
                opacity: loading || !product ? 0.5 : 1,
                fontFamily: "'Barlow', sans-serif",
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {loading ? 'Saving...' : '+ Record Restock'}
              </button>
            </form>
          </div>

          {/* Product summary */}
          <div style={{ ...S.card, padding: isMobile ? 16 : 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Restock Summary
            </div>

            {Object.keys(productSummary).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No restock records found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(productSummary)
                  .sort((a, b) => b[1].qty - a[1].qty)
                  .map(([name, data]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(30,58,82,0.5)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{name}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{data.qty} units</div>
                        {data.cost > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₱{data.cost.toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>{totalQty} units</div>
                    {totalCost > 0 && <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>₱{totalCost.toLocaleString()}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Restock log */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Restock Log
              </span>
              <input
                type="text"
                placeholder="Search chemical..."
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                style={{ ...S.input, width: isMobile ? '100%' : 200, padding: '8px 12px', fontSize: 13 }}
              />
            </div>

            {/* Quick filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <QuickBtn active={quickFilter === 'all'} onClick={() => applyQuickFilter('all')} label="All" />
              <QuickBtn active={quickFilter === 'today'} onClick={() => applyQuickFilter('today')} label="Today" />
              <QuickBtn active={quickFilter === 'week'} onClick={() => applyQuickFilter('week')} label="This Week" />
              <QuickBtn active={quickFilter === 'month'} onClick={() => applyQuickFilter('month')} label="This Month" />
            </div>

            {/* Date range */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ ...S.label, marginBottom: 4 }}>Start Date</label>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setQuickFilter('custom') }} style={{ ...S.input, width: isMobile ? '100%' : 160, padding: '8px 12px', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ ...S.label, marginBottom: 4 }}>End Date</label>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setQuickFilter('custom') }} style={{ ...S.input, width: isMobile ? '100%' : 160, padding: '8px 12px', fontSize: 13 }} />
              </div>
              {(startDate || endDate || searchProduct) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); setSearchProduct(''); setQuickFilter('all') }} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--navy-mid)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Records: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Units: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{totalQty}</span>
            </div>
            {totalCost > 0 && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Cost: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>₱{totalCost.toLocaleString()}</span>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
              No restock records found.
            </div>
          ) : isMobile ? (
            <div>
              {filtered.map(r => (
                <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{r.product_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(r.restocked_at + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {r.cost > 0 && <div style={{ fontSize: 12, color: '#fbbf24' }}>₱{r.cost.toLocaleString()}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>+{r.quantity}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>units</div>
                    </div>
                    <button onClick={() => deleteRestock(r.id)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Chemical</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Qty Added</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Cost Paid</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...S.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.restocked_at + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{r.product_name}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#4ade80' }}>+{r.quantity}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: r.cost > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {r.cost > 0 ? `₱${r.cost.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button onClick={() => deleteRestock(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', transition: 'all 0.15s' }}>
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