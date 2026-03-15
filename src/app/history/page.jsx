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
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 },
  metricLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)' },
}

export default function HistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchTransactions()
    })
  }, [])

  async function fetchTransactions() {
    const res = await fetch('/api/transactions')
    setTransactions(await res.json())
    setLoading(false)
  }

  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0)

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Transaction History</div>
          <div style={S.sub}>All recorded sales</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 200px))', gap: 14 }}>
          <div style={{ ...S.card, padding: '18px 20px' }}>
            <div style={S.metricLabel}>Total Sales</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{transactions.length}</div>
          </div>
          <div style={{ ...S.card, padding: '18px 20px' }}>
            <div style={S.metricLabel}>Total Revenue</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>₱{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>All Transactions</span>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No transactions yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={S.th}>Customer</th>
                  <th style={S.th}>Chemical</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Qty</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Unit Price</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, fontWeight: 600 }}>{t.customer_name}</td>
                    <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{t.product_name}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{t.quantity}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{t.unit_price?.toLocaleString()}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>₱{t.total?.toLocaleString()}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(t.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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