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
  input: { background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)', fontSize: 13 },
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchAll()
    })
  }, [])

  async function fetchAll() {
    const [cRes, lRes] = await Promise.all([
      fetch('/api/customers'),
      fetch('/api/logbook'),
    ])
    setCustomers(await cRes.json())
    setLogs(await lRes.json())
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    c.plate_no?.toLowerCase().includes(search.toLowerCase()) ||
    c.vehicle_name?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLogs = selected
    ? logs.filter(l => l.plate_no === selected.plate_no)
    : []

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Customer Records</div>
          <div style={S.sub}>Vehicle history tracked by plate number</div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 200px))', gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Total Customers</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{customers.length}</div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Repeat Customers</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--blue-glow)' }}>{customers.filter(c => c.total_visits > 1).length}</div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Total Spent</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>₱{customers.reduce((s, c) => s + c.total_spent, 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            placeholder="Search by plate number or vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, width: 320 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
              Clear
            </button>
          )}
        </div>

        {/* Customer table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
              {search ? 'No customers found.' : 'No customers yet. They appear automatically when a plate number is entered in the logbook.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={S.th}>Plate No.</th>
                  <th style={S.th}>Vehicle</th>
                  <th style={S.th}>Size</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Visits</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Total Spent</th>
                  <th style={S.th}>First Visit</th>
                  <th style={S.th}>Last Visit</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>History</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, fontWeight: 700, color: 'var(--blue-glow)' }}>{c.plate_no}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{c.vehicle_name}</td>
                    <td style={S.td}>
                      <span style={{ background: 'rgba(46,141,232,0.15)', color: 'var(--blue-glow)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        {c.vehicle_size}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={{
                        background: c.total_visits >= 5 ? 'rgba(34,197,94,0.15)' : c.total_visits >= 2 ? 'rgba(46,141,232,0.15)' : 'rgba(255,255,255,0.05)',
                        color: c.total_visits >= 5 ? '#4ade80' : c.total_visits >= 2 ? 'var(--blue-glow)' : 'var(--text-muted)',
                        padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      }}>
                        {c.total_visits}x
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right', fontWeight: 600, color: '#4ade80' }}>₱{c.total_spent?.toLocaleString()}</td>
                    <td style={{ ...S.td, color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(c.first_visit + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ ...S.td, color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(c.last_visit + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        onClick={() => setSelected(selected?.plate_no === c.plate_no ? null : c)}
                        style={{
                          padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
                          background: selected?.plate_no === c.plate_no ? 'rgba(46,141,232,0.2)' : 'rgba(46,141,232,0.1)',
                          color: 'var(--blue-glow)', border: '1px solid rgba(46,141,232,0.3)',
                        }}
                      >
                        {selected?.plate_no === c.plate_no ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer visit history */}
        {selected && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--blue)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(46,141,232,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue-glow)' }}>{selected.plate_no}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 10 }}>{selected.vehicle_name} — {selectedLogs.length} visits</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>
            {selectedLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No visit history found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Date & Time</th>
                    <th style={S.th}>Services</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>Payment</th>
                    <th style={S.th}>Crew</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLogs.map(l => (
                    <tr key={l.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...S.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(l.logged_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ ...S.td, maxWidth: 260 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {l.service.split(', ').map((s, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: 'var(--text-secondary)' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={{
                          background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)',
                          color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24',
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        }}>
                          {l.payment_method}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{l.crew}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>₱{l.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  )
}