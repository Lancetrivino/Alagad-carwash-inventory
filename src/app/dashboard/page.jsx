'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useIsMobile } from '@/hooks/useIsMobile'

const S = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' },
  metricLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)' },
  input: { background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  btn: { width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}

export default function Dashboard() {
  const router = useRouter()
  const isMobile = useIsMobile()
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
    const [pRes, lRes] = await Promise.all([fetch('/api/products'), fetch('/api/logbook')])
    setProducts(await pRes.json())
    setLogs(await lRes.json())
    setLoading(false)
  }

  async function adjust(product, delta) {
    const newQty = Math.max(0, product.qty + delta)
    if (newQty === product.qty) return
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, qty: newQty } : p))
    await fetch('/api/products', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, qty: newQty, action: delta > 0 ? 'Restocked' : 'Sold', prev_qty: product.qty }),
    })
    fetchAll()
  }

  const today = new Date().toLocaleDateString('en-CA')
  const todayLogs = logs.filter(l => new Date(l.logged_at).toLocaleDateString('en-CA') === today)
  const todayRevenue = todayLogs.reduce((s, l) => s + l.total, 0)
  const todayCash = todayLogs.filter(l => l.payment_method === 'Cash').reduce((s, l) => s + l.total, 0)
  const todayGcash = todayLogs.filter(l => l.payment_method === 'GCash').reduce((s, l) => s + l.total, 0)
  const todayCashCount = todayLogs.filter(l => l.payment_method === 'Cash').length
  const todayGcashCount = todayLogs.filter(l => l.payment_method === 'GCash').length
  const totalValue = products.reduce((s, p) => s + (p.price ? p.price * p.qty : 0), 0)
  const lowStock = products.filter(p => p.qty <= 2)
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const unpaidLogs = logs.filter(l => l.payment_status === 'unpaid')

  const chartData = (() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-CA')
      const dayLogs = logs.filter(l => new Date(l.logged_at).toLocaleDateString('en-CA') === dateStr)
      days.push({ date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }), revenue: dayLogs.reduce((s, l) => s + l.total, 0), count: dayLogs.length, isToday: i === 0 })
    }
    return days
  })()
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const monthTotal = chartData.reduce((s, d) => s + d.revenue, 0)

  function StatusBadge({ qty }) {
    if (qty === 0) return <span style={{ background: 'rgba(220,50,50,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Out</span>
    if (qty <= 2) return <span style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Low</span>
    return <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>OK</span>
  }

  const pageStyle = {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'Barlow', sans-serif", background: 'var(--navy)',
  }

  const mainStyle = isMobile ? {
    flex: 1, padding: '80px 16px 90px',
    display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto',
  } : {
    flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'auto',
  }

  return (
    <div style={pageStyle}>
      <Sidebar />
      <main style={mainStyle}>

        {!isMobile && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        )}

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                {lowStock.length} chemical{lowStock.length > 1 ? 's' : ''} low/out of stock
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {lowStock.map(p => (
                  <span key={p.id} style={{ fontSize: 11, background: 'rgba(248,113,113,0.15)', color: p.qty === 0 ? '#f87171' : '#fbbf24', border: `1px solid ${p.qty === 0 ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    {p.name} ({p.qty === 0 ? 'OUT' : `${p.qty} left`})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Unpaid alert */}
        {unpaidLogs.length > 0 && (
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💰</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
              {unpaidLogs.length} unpaid — ₱{unpaidLogs.reduce((s, l) => s + l.total, 0).toLocaleString()} pending
            </div>
          </div>
        )}

        {/* Today metrics */}
        <div>
          {!isMobile && <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>Today's Summary</div>}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
            <div style={S.card}>
              <div style={S.metricLabel}>Vehicles</div>
              <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{todayLogs.length}</div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>Revenue</div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: '#4ade80' }}>₱{todayRevenue.toLocaleString()}</div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>Cash</div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: '#fbbf24' }}>₱{todayCash.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{todayCashCount} txn</div>
            </div>
            <div style={S.card}>
              <div style={S.metricLabel}>GCash</div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: 'var(--blue-glow)' }}>₱{todayGcash.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{todayGcashCount} txn</div>
            </div>
          </div>
        </div>

        {/* Inventory metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 14 }}>
          <div style={S.card}>
            <div style={S.metricLabel}>Products</div>
            <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{products.length}</div>
          </div>
          <div style={S.card}>
            <div style={S.metricLabel}>Inv. Value</div>
            <div style={{ fontSize: isMobile ? 15 : 22, fontWeight: 700, color: 'var(--blue-glow)' }}>₱{totalValue.toLocaleString()}</div>
          </div>
          <div style={{ ...S.card, gridColumn: isMobile ? 'span 2' : 'auto' }}>
            <div style={S.metricLabel}>Low / Out</div>
            <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 700, color: lowStock.length > 0 ? '#f87171' : '#4ade80', lineHeight: 1 }}>{lowStock.length}</div>
          </div>
        </div>

        {/* Revenue chart */}
        <div style={{ ...S.card, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Last 30 Days
              </div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#4ade80' }}>₱{monthTotal.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
              {chartData.filter(d => d.revenue > 0).length} active days
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: isMobile ? 80 : 130, position: 'relative' }}>
            {[25, 50, 75, 100].map(pct => (
              <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, height: 1, background: 'rgba(30,58,82,0.5)', pointerEvents: 'none' }} />
            ))}
            {chartData.map((d, i) => {
              const height = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 3 : 0) : 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${d.date}: ₱${d.revenue.toLocaleString()}`}>
                  <div style={{ width: '100%', height: `${height}%`, minHeight: d.revenue > 0 ? 3 : 0, background: d.isToday ? 'linear-gradient(180deg, #3aa0ff, #1e6fbf)' : d.revenue > 0 ? 'rgba(46,141,232,0.45)' : 'rgba(46,141,232,0.08)', borderRadius: '3px 3px 0 0' }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {[0, 9, 19, 29].map(i => (
              <div key={i} style={{ fontSize: 10, color: i === 29 ? 'var(--blue-glow)' : 'var(--text-muted)', fontWeight: i === 29 ? 600 : 400 }}>{chartData[i]?.date}</div>
            ))}
          </div>
        </div>

        {/* Today's vehicles — mobile cards, desktop table */}
        {todayLogs.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Vehicles</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{todayLogs.length} entries</span>
            </div>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {todayLogs.map(l => (
                  <div key={l.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{l.vehicle_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--blue-glow)', fontWeight: 600 }}>{l.plate_no || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#4ade80' }}>₱{l.total?.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(l.logged_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, background: 'rgba(46,141,232,0.15)', color: 'var(--blue-glow)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{l.vehicle_size}</span>
                      <span style={{ fontSize: 11, background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)', color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{l.payment_method}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.crew}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                      <tr key={l.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ ...S.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(l.logged_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{l.vehicle_name}</td>
                        <td style={{ ...S.td, color: 'var(--blue-glow)', fontWeight: 600 }}>{l.plate_no || '—'}</td>
                        <td style={{ ...S.td, maxWidth: 220 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {l.service.split(', ').map((s, i) => (
                              <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{l.crew}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <span style={{ background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)', color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{l.payment_method}</span>
                        </td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>₱{l.total?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stock list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chemical Stock</span>
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: isMobile ? 120 : 180 }} />
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          ) : isMobile ? (
            <div>
              {filtered.map(p => (
                <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.price ? `₱${p.price.toLocaleString()}` : '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => adjust(p, -1)}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center', fontSize: 16, color: p.qty <= 2 ? '#f87171' : 'var(--text-primary)' }}>{p.qty}</span>
                      <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => adjust(p, +1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>{p.price ? `₱${p.price.toLocaleString()}` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => adjust(p, -1)}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{p.qty}</span>
                        <button style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--navy-mid)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => adjust(p, +1)}>+</button>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>{p.price ? `₱${(p.price * p.qty).toLocaleString()}` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {p.qty === 0 ? <span style={{ background: 'rgba(220,50,50,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Out</span>
                        : p.qty <= 2 ? <span style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Low</span>
                          : <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>OK</span>}
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