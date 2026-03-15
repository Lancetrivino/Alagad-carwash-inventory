'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const VEHICLE_SIZES = [
  { label: 'XSmall (₱140)', value: 'XSmall', base: 140 },
  { label: 'Small (₱160)', value: 'Small', base: 160 },
  { label: 'Medium (₱180)', value: 'Medium', base: 180 },
  { label: 'Large (₱200)', value: 'Large', base: 200 },
  { label: 'X-Large (₱220)', value: 'X-Large', base: 220 },
  { label: 'XX-Large (₱250)', value: 'XX-Large', base: 250 },
]

const SERVICES = [
  'Alagad Wash (Wash, Vacuum, Tire Black)',
  'Premium Engine Wash',
  'Bac to Zero',
  'Interior Dressing',
  'Spray Wax',
  'Machine Wax',
  'Acid Rain Removal',
  'Headlight Ext. Polishing',
  'Seat Cover Installation/Removal',
  'Cement Removal',
  'Asphalt Removal',
  'Trim Black Restoration',
  'Glass Detailing',
  'Mags Detailing',
  'Engine Detailing',
  'Interior Detailing',
  'Exterior Detailing',
  'Ceramic Coating',
]

const PRICES = {
  'Alagad Wash (Wash, Vacuum, Tire Black)': { XSmall: 160, Small: 180, Medium: 200, Large: 230, 'X-Large': 250, 'XX-Large': 300 },
  'Premium Engine Wash': { XSmall: 500, Small: 550, Medium: 600, Large: 650, 'X-Large': 700, 'XX-Large': 750 },
  'Bac to Zero': { XSmall: 350, Small: 400, Medium: 450, Large: 500, 'X-Large': 550, 'XX-Large': 600 },
  'Interior Dressing': { XSmall: 100, Small: 120, Medium: 140, Large: 160, 'X-Large': 180, 'XX-Large': 200 },
  'Spray Wax': { XSmall: 300, Small: 400, Medium: 500, Large: 600, 'X-Large': 700, 'XX-Large': 800 },
  'Machine Wax': { XSmall: 500, Small: 600, Medium: 700, Large: 800, 'X-Large': 900, 'XX-Large': 1000 },
  'Acid Rain Removal': { XSmall: 500, Small: 600, Medium: 700, Large: 800, 'X-Large': 900, 'XX-Large': 1000 },
  'Headlight Ext. Polishing': { XSmall: 500, Small: 500, Medium: 500, Large: 500, 'X-Large': 500, 'XX-Large': 500 },
  'Seat Cover Installation/Removal': { XSmall: 300, Small: 320, Medium: 340, Large: 360, 'X-Large': 400, 'XX-Large': 450 },
  'Cement Removal': { XSmall: 300, Small: 350, Medium: 400, Large: 450, 'X-Large': 500, 'XX-Large': 550 },
  'Asphalt Removal': { XSmall: 300, Small: 350, Medium: 400, Large: 450, 'X-Large': 500, 'XX-Large': 550 },
  'Trim Black Restoration': { XSmall: 1200, Small: 1400, Medium: 1600, Large: 1800, 'X-Large': 2000, 'XX-Large': 2200 },
  'Glass Detailing': { XSmall: 1200, Small: 1400, Medium: 1600, Large: 1800, 'X-Large': 2000, 'XX-Large': 2200 },
  'Mags Detailing': { XSmall: 1200, Small: 1400, Medium: 1600, Large: 1800, 'X-Large': 2000, 'XX-Large': 2200 },
  'Engine Detailing': { XSmall: 1200, Small: 1400, Medium: 1600, Large: 1800, 'X-Large': 2000, 'XX-Large': 2200 },
  'Interior Detailing': { XSmall: 5000, Small: 5500, Medium: 6000, Large: 6500, 'X-Large': 7000, 'XX-Large': 7500 },
  'Exterior Detailing': { XSmall: 5000, Small: 5500, Medium: 6000, Large: 6500, 'X-Large': 7000, 'XX-Large': 7500 },
  'Ceramic Coating': { XSmall: 14000, Small: 16000, Medium: 18000, Large: 20000, 'X-Large': 22000, 'XX-Large': 24000 },
}

const VEHICLES = {
  XSmall: ['Eon', 'Wigo', 'Fit', 'Picanto'],
  Small: ['Sedan', 'Vios', 'Altis', 'Elantra', 'Accent', 'Focus', 'Jazz', 'Tricycle', 'Mirage', 'Reina', 'MG Car', 'Civic'],
  Medium: ['Crossover', 'Avanza', 'Raize', 'Xpander', 'BRV', 'Mobillo', 'Rush', 'Adventure', 'Juke', 'Soul', 'Jimny', 'MG ZS', 'Tucson', 'Bigbike 400cc up', 'Veloz', 'Subaru'],
  Large: ['SUV', 'Fortuner', 'Montero', 'Innova', 'Crosswind', 'Wrangler', 'MUX', 'MG RX5', 'Everest Old', 'Cross', 'CRV'],
  'X-Large': ['Hilux', 'Ranger', 'PJ Cruiser', 'Patrol', 'Everest New', 'Pajero', 'Navarra', 'Strada', 'Pick Up', 'Terra'],
  'XX-Large': ['Van', 'Hi Ace', 'Starex', 'L-300 FB', 'Travis', 'Big Foot', 'Raptor'],
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", background: 'var(--navy)' },
  main: { flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'auto' },
  heading: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' },
  sub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  select: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif", appearance: 'none' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '11px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)', fontSize: 13 },
}

export default function LogbookPage() {
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [tab, setTab] = useState('form')

  const [vehicleName, setVehicleName] = useState('')
  const [plateNo, setPlateNo] = useState('')
  const [vehicleSize, setVehicleSize] = useState('')
  const [service, setService] = useState('')
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [crew, setCrew] = useState('')
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 16))

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchLogs()
    })
  }, [])

  // Auto-fill amount when service + size selected
  useEffect(() => {
    if (service && vehicleSize && PRICES[service]?.[vehicleSize]) {
      setAmount(PRICES[service][vehicleSize])
    }
  }, [service, vehicleSize])

  async function fetchLogs() {
    const res = await fetch('/api/logbook')
    setLogs(await res.json())
  }

  const total = Math.max(0, (parseFloat(amount) || 0) - (parseFloat(discount) || 0))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    await fetch('/api/logbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_name: vehicleName,
        plate_no: plateNo,
        vehicle_size: vehicleSize,
        service,
        amount: parseFloat(amount),
        discount: parseFloat(discount) || 0,
        total,
        payment_method: paymentMethod,
        crew,
        logged_at: new Date(loggedAt).toISOString(),
      }),
    })

    setSuccess(true)
    setVehicleName(''); setPlateNo(''); setVehicleSize('')
    setService(''); setAmount(''); setDiscount(0)
    setPaymentMethod('Cash'); setCrew('')
    setLoggedAt(new Date().toISOString().slice(0, 16))
    setLoading(false)
    fetchLogs()
    setTimeout(() => setSuccess(false), 3000)
  }

  const filteredLogs = filterDate
    ? logs.filter(l => new Date(l.logged_at).toLocaleDateString('en-CA') === filterDate)
    : logs

  const todayTotal = filteredLogs.reduce((s, l) => s + l.total, 0)
  const todayCount = filteredLogs.length

  const suggestedVehicles = vehicleSize ? VEHICLES[vehicleSize] || [] : []

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Vehicle Logbook</div>
          <div style={S.sub}>Record every car wash service</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['form', 'logs'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
              background: tab === t ? 'var(--blue)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              border: tab === t ? '1px solid var(--blue)' : '1px solid var(--border)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {t === 'form' ? '+ New Entry' : 'View Logs'}
            </button>
          ))}
        </div>

        {tab === 'form' && (
          <div style={{ ...S.card, maxWidth: 680 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              New Vehicle Entry
            </div>

            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', marginBottom: 16 }}>
                Entry logged successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Vehicle Size</label>
                  <select style={S.select} value={vehicleSize} onChange={e => { setVehicleSize(e.target.value); setVehicleName(''); setService(''); setAmount('') }} required>
                    <option value="">Select size</option>
                    {VEHICLE_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Vehicle / Model</label>
                  <input
                    style={S.input}
                    type="text"
                    value={vehicleName}
                    onChange={e => setVehicleName(e.target.value)}
                    required
                    placeholder={vehicleSize ? `e.g. ${suggestedVehicles[0] || 'Vehicle model'}` : 'Select size first'}
                    list="vehicle-suggestions"
                  />
                  <datalist id="vehicle-suggestions">
                    {suggestedVehicles.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Plate No.</label>
                  <input style={S.input} type="text" value={plateNo} onChange={e => setPlateNo(e.target.value.toUpperCase())} placeholder="e.g. ABC 1234" />
                </div>
                <div>
                  <label style={S.label}>Date & Time</label>
                  <input style={S.input} type="datetime-local" value={loggedAt} onChange={e => setLoggedAt(e.target.value)} required />
                </div>
              </div>

              <div>
                <label style={S.label}>Service</label>
                <select style={S.select} value={service} onChange={e => setService(e.target.value)} required>
                  <option value="">Select service</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Amount (₱)</label>
                  <input style={S.input} type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Auto-filled by service + size" />
                </div>
                <div>
                  <label style={S.label}>Discount (₱)</label>
                  <input style={S.input} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Payment Method</label>
                  <select style={S.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Crew</label>
                  <input style={S.input} type="text" value={crew} onChange={e => setCrew(e.target.value)} required placeholder="Enter crew name" />
                </div>
              </div>

              {/* Total Preview */}
              <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Amount</span><span>₱{(parseFloat(amount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  <span>Discount</span><span>- ₱{(parseFloat(discount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--blue-glow)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span>Total</span><span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}

              <button type="submit" disabled={loading} style={{
                background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
                color: '#fff', border: 'none', borderRadius: 10, padding: '13px',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1, fontFamily: "'Barlow', sans-serif",
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </form>
          </div>
        )}

        {tab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Summary + Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ ...S.card, padding: '14px 20px', display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {filterDate ? 'Filtered' : 'Total'} Entries
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{todayCount}</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {filterDate ? 'Filtered' : 'Total'} Revenue
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>₱{todayTotal.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <label style={{ ...S.label, marginBottom: 6 }}>Filter by Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  style={{ ...S.input, width: 180 }}
                />
              </div>
              {filterDate && (
                <button onClick={() => setFilterDate('')} style={{
                  marginTop: 20, padding: '8px 14px', borderRadius: 8, fontSize: 12,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                }}>Clear filter</button>
              )}
            </div>

            {/* Table */}
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date & Time</th>
                      <th style={S.th}>Vehicle</th>
                      <th style={S.th}>Plate No.</th>
                      <th style={S.th}>Size</th>
                      <th style={S.th}>Service</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Amount</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Discount</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                      <th style={{ ...S.th, textAlign: 'center' }}>Payment</th>
                      <th style={S.th}>Crew</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                          No entries found.
                        </td>
                      </tr>
                    ) : filteredLogs.map(l => (
                      <tr key={l.id}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...S.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(l.logged_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{l.vehicle_name}</td>
                        <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{l.plate_no || '—'}</td>
                        <td style={{ ...S.td }}>
                          <span style={{ background: 'rgba(46,141,232,0.15)', color: 'var(--blue-glow)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {l.vehicle_size}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.service}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{l.amount?.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: '#f87171' }}>
                          {l.discount > 0 ? `- ₱${l.discount?.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>₱{l.total?.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <span style={{
                            background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)',
                            color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24',
                            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600
                          }}>
                            {l.payment_method}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{l.crew}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}