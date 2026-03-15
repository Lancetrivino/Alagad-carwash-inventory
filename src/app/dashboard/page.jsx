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
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' },
  metricLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  metricValue: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)' },
  input: { background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif", width: 180 },
  btn: { width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}

export default function Dashboard() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchProducts()
    })
  }, [])

  async function fetchProducts() {
    const res = await fetch('/api/products')
    setProducts(await res.json())
    setLoading(false)
  }

  async function adjust(product, delta) {
    const newQty = Math.max(0, product.qty + delta)
    if (newQty === product.qty) return
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, qty: newQty } : p))
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, qty: newQty, action: delta > 0 ? 'Restocked' : 'Sold', prev_qty: product.qty }),
    })
    fetchProducts()
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const totalValue = products.reduce((s, p) => s + (p.price ? p.price * p.qty : 0), 0)
  const lowStock = products.filter(p => p.qty <= 2).length

  function StatusBadge({ qty }) {
    if (qty === 0) return <span style={{ background: 'rgba(220,50,50,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Out</span>
    if (qty <= 2) return <span style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Low</span>
    return <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>OK</span>
  }

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Dashboard</div>
          <div style={S.sub}>Chemical stock overview</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <div style={S.card}>
            <div style={S.metricLabel}>Total Products</div>
            <div style={S.metricValue}>{products.length}</div>
          </div>
          <div style={S.card}>
            <div style={S.metricLabel}>Inventory Value</div>
            <div style={{ ...S.metricValue, fontSize: 20, color: 'var(--blue-glow)' }}>₱{totalValue.toLocaleString()}</div>
          </div>
          <div style={S.card}>
            <div style={S.metricLabel}>Low / Out of Stock</div>
            <div style={{ ...S.metricValue, color: lowStock > 0 ? '#f87171' : '#4ade80' }}>{lowStock}</div>
          </div>
        </div>

        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stock List</span>
            <input style={S.input} type="text" placeholder="Search chemical..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Product</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Price</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Qty</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Value</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>{p.price ? `₱${p.price.toLocaleString()}` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button style={S.btn} onClick={() => adjust(p, -1)}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{p.qty}</span>
                        <button style={S.btn} onClick={() => adjust(p, +1)}>+</button>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>{p.price ? `₱${(p.price * p.qty).toLocaleString()}` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}><StatusBadge qty={p.qty} /></td>
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