'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", background: 'var(--navy)' },
  main: { flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'auto' },
  heading: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' },
  sub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' },
  metricLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)' },
  input: { background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  btn: { width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}

export default function Dashboard() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchAll()
    })
  }, [])

  async function fetchAll() {
    const [pRes, lRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/logbook'),
    ])
    setProducts(await pRes.json())
    setLogs(await lRes.json())
    setLoading(false)
  }

  async function adjust(product, delta) {
    const newQty = Math.max(0, product.qty + delta)
    if (newQty === product.qty) return
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, qty: newQty } : p))
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: product.id,
        qty: newQty,
        action: delta > 0 ? 'Restocked' : 'Sold',
        prev_qty: product.qty,
      }),
    })
    fetchAll()
  }

  // Today's stats
  const today = new Date().toLocaleDateString('en-CA')
  const todayLogs = logs.filter(l => new Date(l.logged_at).toLocaleDateString('en-CA') === today)
  const todayRevenue = todayLogs.reduce((s, l) => s + l.total, 0)
  const todayCash = todayLogs.filter(l => l.payment_method === 'Cash').reduce((s, l) => s + l.total, 0)
  const todayGcash = todayLogs.filter(l => l.payment_method === 'GCash').reduce((s, l) => s + l.total, 0)
  const todayCashCount = todayLogs.filter(l => l.payment_method === 'Cash').length
  const todayGcashCount = todayLogs.filter(l => l.payment_method === 'GCash').length

  // Inventory stats
  const totalValue = products.reduce((s, p) => s + (p.price ? p.price * p.qty : 0), 0)
  const lowStock = products.filter(p => p.qty <= 2)
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  // Monthly chart — last 30 days
  const chartData = (() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-CA')
      const dayLogs = logs.filter(l => new Date(l.logged_at).toLocaleDateString('en-CA') === dateStr)
      days.push({
        date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        revenue: dayLogs.reduce((s, l) => s + l.total, 0),
        count: dayLogs.length,
        isToday: i === 0,
      })
    }
    return days
  })()

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const monthTotal = chartData.reduce((s, d) => s + d.revenue, 0)
  const activeDays = chartData.filter(d => d.revenue > 0).length

  function StatusBadge({ qty }) {
    if (qty === 0) return (
      <span style={{ background: 'rgba(220,50,50,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Out</span>
    )
    if (qty <= 2) return (
      <span style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Low</span>
    )
    return (
      <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>OK</span>
    )
  }

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>

        {/* Header */}
        <div>
          <div style={S.heading}>Dashboard</div>
          <div style={S.sub}>
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Low stock alert banner */}
        {lowStock.length > 0 && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>
                {lowStock.length} chemical{lowStock.length > 1 ? 's' : ''} running low or out of stock!
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {lowStock.map(p => (
                  <span key={p.id} style={{
                    fontSize: 11, background: 'rgba(248,113,113,0.15)',
                    color: p.qty === 0 ? '#f87171' : '#fbbf24',
                    border: `1px solid ${p.qty === 0 ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`,
                    padding: '2px 10px', borderRadius: 999, fontWeight: 600,
                  }}>
                    {p.name} ({p.qty === 0 ? 'OUT' : `${p.qty} left`})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Today section */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>
            Today's Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div style={S.card}>
              <div style={S.metricLabel}>Vehicles Served</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{todayLogs.length}</div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>Today's Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>₱{todayRevenue.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {todayLogs.length} transactions
              </div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>Cash</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>₱{todayCash.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {todayCashCount} transaction{todayCashCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>GCash</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue-glow)' }}>₱{todayGcash.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {todayGcashCount} transaction{todayGcashCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory section */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>
            Inventory Overview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div style={S.card}>
              <div style={S.metricLabel}>Total Products</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{products.length}</div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>Inventory Value</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue-glow)' }}>₱{totalValue.toLocaleString()}</div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>Low / Out of Stock</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: lowStock.length > 0 ? '#f87171' : '#4ade80', lineHeight: 1 }}>
                {lowStock.length}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly revenue chart */}
        <div style={{ ...S.card, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Revenue — Last 30 Days
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>₱{monthTotal.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeDays} active days</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Today</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue-glow)' }}>₱{todayRevenue.toLocaleString()}</div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, padding: '0 2px', position: 'relative' }}>
            {/* Gridlines */}
            {[25, 50, 75, 100].map(pct => (
              <div key={pct} style={{
                position: 'absolute', left: 0, right: 0,
                bottom: `${pct}%`, height: 1,
                background: 'rgba(30,58,82,0.5)',
                pointerEvents: 'none',
              }} />
            ))}
            {chartData.map((d, i) => {
              const height = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 3 : 0) : 0
              return (
                <div
                  key={i}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                  title={`${d.date}: ₱${d.revenue.toLocaleString()} (${d.count} vehicles)`}
                >
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    minHeight: d.revenue > 0 ? 3 : 0,
                    background: d.isToday
                      ? 'linear-gradient(180deg, #3aa0ff, #1e6fbf)'
                      : d.revenue > 0
                        ? 'rgba(46,141,232,0.45)'
                        : 'rgba(46,141,232,0.08)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.2s',
                    cursor: d.revenue > 0 ? 'pointer' : 'default',
                  }} />
                </div>
              )
            })}
          </div>

          {/* X axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 2px' }}>
            {[0, 6, 13, 20, 27, 29].map(i => (
              <div key={i} style={{ fontSize: 10, color: i === 29 ? 'var(--blue-glow)' : 'var(--text-muted)', fontWeight: i === 29 ? 600 : 400 }}>
                {chartData[i]?.date}
              </div>
            ))}
          </div>
        </div>

        {/* Today's vehicle list */}
        {todayLogs.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Today's Vehicles
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{todayLogs.length} entries</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Time</th>
                    <th style={S.th}>Vehicle</th>
                    <th style={S.th}>Plate</th>
                    <th style={S.th}>Services</th>
                    <th style={S.th}>Crew</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>Payment</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLogs.map(l => (
                    <tr key={l.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...S.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(l.logged_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{l.vehicle_name}</td>
                      <td style={{ ...S.td, color: 'var(--blue-glow)', fontWeight: 600 }}>{l.plate_no || '—'}</td>
                      <td style={{ ...S.td, maxWidth: 220 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {l.service.split(', ').map((s, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{l.crew}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={{
                          background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)',
                          color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24',
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        }}>
                          {l.payment_method}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                        ₱{l.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Chemical Stock
            </span>
            <input
              type="text"
              placeholder="Search chemical..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, width: 180 }}
            />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
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
                  <tr key={p.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {p.price ? `₱${p.price.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button style={S.btn} onClick={() => adjust(p, -1)}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{p.qty}</span>
                        <button style={S.btn} onClick={() => adjust(p, +1)}>+</button>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {p.price ? `₱${(p.price * p.qty).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <StatusBadge qty={p.qty} />
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