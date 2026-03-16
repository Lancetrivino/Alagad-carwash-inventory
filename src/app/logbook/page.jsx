'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const VEHICLE_SIZES = [
  { label: 'XSmall (₱140)', value: 'XSmall' },
  { label: 'Small (₱160)', value: 'Small' },
  { label: 'Medium (₱180)', value: 'Medium' },
  { label: 'Large (₱200)', value: 'Large' },
  { label: 'X-Large (₱220)', value: 'X-Large' },
  { label: 'XX-Large (₱250)', value: 'XX-Large' },
  { label: 'Motorcycle (₱120)', value: 'Motorcycle' },
  { label: 'Motorcycle 400cc up (₱180)', value: 'Motorcycle 400cc' },
]

const PRICES = {
  'Alagad Wash (Wash, Vacuum, Tire Black)': { XSmall: 140, Small: 160, Medium: 180, Large: 200, 'X-Large': 220, 'XX-Large': 250 },
  'Premium Engine Wash': { XSmall: 500, Small: 550, Medium: 600, Large: 650, 'X-Large': 700, 'XX-Large': 750 },
  'Bac to Zero': { XSmall: 350, Small: 400, Medium: 450, Large: 500, 'X-Large': 550, 'XX-Large': 600 },
  'Interior Dressing': { XSmall: 100, Small: 120, Medium: 140, Large: 160, 'X-Large': 180, 'XX-Large': 200, Motorcycle: 200, 'Motorcycle 400cc': 250 },
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
  'Hand Wax (Motorcycle)': { Motorcycle: 200, 'Motorcycle 400cc': 250 },
}

// Motorcycle-only services
const MOTO_SERVICES = ['Interior Dressing', 'Hand Wax (Motorcycle)']

// Special combo pricing for motorcycles
const MOTO_COMBOS = {
  Motorcycle: {
    combo: ['Interior Dressing', 'Hand Wax (Motorcycle)'],
    comboPrice: 250,
  },
  'Motorcycle 400cc': {
    combo: ['Interior Dressing', 'Hand Wax (Motorcycle)'],
    comboPrice: 300,
  },
}

// Base wash prices for motorcycles
const MOTO_WASH = {
  Motorcycle: 120,
  'Motorcycle 400cc': 180,
}

const VEHICLES = {
  XSmall: ['Eon', 'Wigo', 'Fit', 'Picanto'],
  Small: ['Sedan', 'Vios', 'Altis', 'Elantra', 'Accent', 'Focus', 'Jazz', 'Tricycle', 'Mirage', 'Reina', 'MG Car', 'Civic'],
  Medium: ['Crossover', 'Avanza', 'Raize', 'Xpander', 'BRV', 'Mobillo', 'Rush', 'Adventure', 'Juke', 'Soul', 'Jimny', 'MG ZS', 'Tucson', 'Bigbike 400cc up', 'Veloz', 'Subaru'],
  Large: ['SUV', 'Fortuner', 'Montero', 'Innova', 'Crosswind', 'Wrangler', 'MUX', 'MG RX5', 'Everest Old', 'Cross', 'CRV'],
  'X-Large': ['Hilux', 'Ranger', 'PJ Cruiser', 'Patrol', 'Everest New', 'Pajero', 'Navarra', 'Strada', 'Pick Up', 'Terra'],
  'XX-Large': ['Van', 'Hi Ace', 'Starex', 'L-300 FB', 'Travis', 'Big Foot', 'Raptor'],
  Motorcycle: ['Mio', 'Click', 'Beat', 'Aerox', 'NMAX', 'PCX', 'Raider', 'Barako', 'TMX'],
  'Motorcycle 400cc': ['CB400', 'CB500', 'Duke 390', 'Duke 400', 'Ninja 400', 'Z400', 'Versys 300', 'Royal Enfield'],
}

const isMoto = (size) => size === 'Motorcycle' || size === 'Motorcycle 400cc'

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

function Toggle({ active, onClick, color, borderColor, bgColor, label, extra }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
      border: active ? `1px solid ${borderColor}` : '1px solid var(--border)',
      background: active ? bgColor : 'var(--navy-mid)',
      transition: 'all 0.15s', width: 'fit-content',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: active ? `2px solid ${color}` : '2px solid var(--border)',
        background: active ? color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <span style={{ color: '#000', fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: active ? color : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}>
        {label} {extra && <span style={{ fontSize: 11, opacity: 0.8 }}>{extra}</span>}
      </span>
    </div>
  )
}

export default function LogbookPage() {
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [crewList, setCrewList] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [tab, setTab] = useState('form')

  const [vehicleName, setVehicleName] = useState('')
  const [plateNo, setPlateNo] = useState('')
  const [vehicleSize, setVehicleSize] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [crew, setCrew] = useState('')
  const [lateNight, setLateNight] = useState(false)
  const [rollbar, setRollbar] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else { fetchLogs(); fetchCrewList() }
    })
  }, [])

  async function fetchLogs() {
    const res = await fetch('/api/logbook')
    setLogs(await res.json())
  }

  async function fetchCrewList() {
    const res = await fetch('/api/crew')
    const data = await res.json()
    setCrewList(data.filter(c => c.active))
  }

  async function deleteLog(id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    await fetch('/api/logbook', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchLogs()
  }

  function toggleService(serviceName) {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    )
  }

  // Smart amount computation with motorcycle combo pricing
  function computeAmount() {
    if (!vehicleSize) return 0

    if (isMoto(vehicleSize)) {
      const washPrice = MOTO_WASH[vehicleSize]
      const hasInterior = selectedServices.includes('Interior Dressing')
      const hasWax = selectedServices.includes('Hand Wax (Motorcycle)')
      const combo = MOTO_COMBOS[vehicleSize]

      // Both selected = combo price
      if (hasInterior && hasWax) {
        return washPrice + combo.comboPrice
      }
      // Only interior
      if (hasInterior) {
        return washPrice + (PRICES['Interior Dressing']?.[vehicleSize] || 0)
      }
      // Only wax
      if (hasWax) {
        return washPrice + (PRICES['Hand Wax (Motorcycle)']?.[vehicleSize] || 0)
      }
      // Wash only
      return washPrice
    }

    // Regular vehicle
    return selectedServices.reduce((sum, s) => sum + (PRICES[s]?.[vehicleSize] || 0), 0)
  }

  const servicesAmount = computeAmount()
  const lateNightFee = lateNight ? 30 : 0
  const rollbarFee = rollbar ? 20 : 0
  const amount = servicesAmount + lateNightFee + rollbarFee
  const total = Math.max(0, amount - (parseFloat(discount) || 0))

  const suggestedVehicles = vehicleSize ? VEHICLES[vehicleSize] || [] : []

  // Get available services based on vehicle type
  const availableServices = vehicleSize
    ? isMoto(vehicleSize)
      ? MOTO_SERVICES
      : Object.keys(PRICES).filter(s => !MOTO_SERVICES.includes(s))
    : Object.keys(PRICES).filter(s => !MOTO_SERVICES.includes(s))

  async function handleSubmit(e) {
    e.preventDefault()

    // For motorcycles, services are optional (wash only is valid)
    if (!isMoto(vehicleSize) && selectedServices.length === 0) {
      setError('Please select at least one service')
      return
    }

    setLoading(true); setError('')

    const serviceLabel = isMoto(vehicleSize)
      ? selectedServices.length === 0
        ? 'Motorcycle Wash'
        : selectedServices.join(', ')
      : selectedServices.join(', ')

    await fetch('/api/logbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_name: vehicleName,
        plate_no: plateNo,
        vehicle_size: vehicleSize,
        service: serviceLabel,
        amount,
        discount: parseFloat(discount) || 0,
        total,
        payment_method: paymentMethod,
        crew,
        logged_at: new Date().toISOString(),
      }),
    })

    setSuccess(true)
    setVehicleName(''); setPlateNo(''); setVehicleSize('')
    setSelectedServices([]); setDiscount(0)
    setPaymentMethod('Cash'); setCrew('')
    setLateNight(false); setRollbar(false)
    setLoading(false)
    fetchLogs()
    setTimeout(() => setSuccess(false), 3000)
  }

  const filteredLogs = filterDate
    ? logs.filter(l => new Date(l.logged_at).toLocaleDateString('en-CA') === filterDate)
    : logs

  const filteredTotal = filteredLogs.reduce((s, l) => s + l.total, 0)

  // Bill breakdown for display
  function getBillLines() {
    if (!vehicleSize) return []
    const lines = []

    if (isMoto(vehicleSize)) {
      lines.push({ label: `Motorcycle Wash (${vehicleSize})`, amount: MOTO_WASH[vehicleSize], color: 'var(--text-secondary)' })
      const hasInterior = selectedServices.includes('Interior Dressing')
      const hasWax = selectedServices.includes('Hand Wax (Motorcycle)')
      const combo = MOTO_COMBOS[vehicleSize]

      if (hasInterior && hasWax) {
        lines.push({ label: 'Interior Dressing + Hand Wax (Combo)', amount: combo.comboPrice, color: '#4ade80' })
      } else {
        if (hasInterior) lines.push({ label: 'Interior Dressing', amount: PRICES['Interior Dressing']?.[vehicleSize], color: 'var(--text-secondary)' })
        if (hasWax) lines.push({ label: 'Hand Wax', amount: PRICES['Hand Wax (Motorcycle)']?.[vehicleSize], color: 'var(--text-secondary)' })
      }
    } else {
      selectedServices.forEach(s => {
        lines.push({ label: s, amount: PRICES[s]?.[vehicleSize] || 0, color: 'var(--text-secondary)' })
      })
    }

    if (lateNight) lines.push({ label: 'Beyond 6:00 PM', amount: 30, color: '#fbbf24', prefix: '+ ' })
    if (rollbar) lines.push({ label: 'W/ Rollbar / Bullbar', amount: 20, color: '#a855f7', prefix: '+ ' })
    if (discount > 0) lines.push({ label: 'Discount', amount: parseFloat(discount), color: '#f87171', prefix: '- ' })

    return lines
  }

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Vehicle Logbook</div>
          <div style={S.sub}>Record every car wash service — date & time auto-captured</div>
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
          <div style={{ ...S.card, maxWidth: 720 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              New Vehicle Entry
            </div>

            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', marginBottom: 16 }}>
                Entry logged successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Vehicle Size</label>
                  <select style={S.select} value={vehicleSize} onChange={e => { setVehicleSize(e.target.value); setVehicleName(''); setSelectedServices([]) }} required>
                    <option value="">Select size</option>
                    <optgroup label="— Regular Vehicles —">
                      {VEHICLE_SIZES.filter(s => !isMoto(s.value)).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="— Motorcycles —">
                      {VEHICLE_SIZES.filter(s => isMoto(s.value)).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Vehicle / Model</label>
                  <input
                    style={S.input} type="text" value={vehicleName}
                    onChange={e => setVehicleName(e.target.value)} required
                    placeholder={vehicleSize ? `e.g. ${suggestedVehicles[0] || ''}` : 'Select size first'}
                    list="vehicle-suggestions"
                  />
                  <datalist id="vehicle-suggestions">
                    {suggestedVehicles.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label style={S.label}>Plate No.</label>
                <input style={S.input} type="text" value={plateNo} onChange={e => setPlateNo(e.target.value.toUpperCase())} placeholder="e.g. ABC 1234" />
              </div>

              {/* Motorcycle wash info banner */}
              {isMoto(vehicleSize) && (
                <div style={{ background: 'rgba(46,141,232,0.08)', border: '1px solid rgba(46,141,232,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--blue-glow)', fontWeight: 600, marginBottom: 6 }}>
                    🏍 Motorcycle Base Wash — ₱{MOTO_WASH[vehicleSize]}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Add-ons below are optional. Combo discount applied when both Interior Dressing + Hand Wax are selected.
                  </div>
                </div>
              )}

              {/* Services */}
              <div>
                <label style={S.label}>
                  {isMoto(vehicleSize) ? 'Add-on Services (optional)' : 'Services'}
                  {selectedServices.length > 0 && (
                    <span style={{ marginLeft: 8, background: 'var(--blue)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                      {selectedServices.length} selected
                    </span>
                  )}
                </label>
                <div style={{
                  display: 'grid', gridTemplateColumns: isMoto(vehicleSize) ? '1fr' : 'repeat(2, 1fr)', gap: 8,
                  background: 'var(--navy-mid)', borderRadius: 10,
                  border: '1px solid var(--border)', padding: 12,
                  maxHeight: isMoto(vehicleSize) ? 'auto' : 280, overflowY: 'auto',
                }}>
                  {availableServices.map(serviceName => {
                    const checked = selectedServices.includes(serviceName)
                    const price = vehicleSize ? PRICES[serviceName]?.[vehicleSize] : null

                    // Check if this service is part of a combo
                    const isInCombo = isMoto(vehicleSize) && MOTO_COMBOS[vehicleSize]?.combo.includes(serviceName)
                    const bothSelected = isMoto(vehicleSize) &&
                      selectedServices.includes('Interior Dressing') &&
                      selectedServices.includes('Hand Wax (Motorcycle)')

                    return (
                      <div
                        key={serviceName}
                        onClick={() => toggleService(serviceName)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                          border: checked ? '1px solid rgba(46,141,232,0.5)' : '1px solid transparent',
                          background: checked ? 'rgba(46,141,232,0.12)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: checked ? '2px solid var(--blue-glow)' : '2px solid var(--border)',
                            background: checked ? 'var(--blue-glow)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: checked ? 600 : 400 }}>
                              {serviceName}
                            </span>
                            {isInCombo && bothSelected && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: '#4ade80', fontWeight: 600 }}>combo</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {price && (
                            <span style={{ fontSize: 11, color: isInCombo && bothSelected ? '#4ade80' : 'var(--blue-glow)', fontWeight: 600, flexShrink: 0, textDecoration: isInCombo && bothSelected ? 'line-through' : 'none', opacity: isInCombo && bothSelected ? 0.6 : 1 }}>
                              ₱{price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Combo hint for motorcycles */}
                {isMoto(vehicleSize) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    💡 Select both Interior Dressing + Hand Wax to get combo price of ₱{MOTO_COMBOS[vehicleSize]?.comboPrice}
                  </div>
                )}

                {!vehicleSize && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Select vehicle size to see services
                  </div>
                )}
              </div>

              {/* Extra Fees */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Toggle
                  active={lateNight}
                  onClick={() => setLateNight(p => !p)}
                  color="#fbbf24"
                  borderColor="rgba(251,191,36,0.4)"
                  bgColor="rgba(251,191,36,0.08)"
                  label="Beyond 6:00 PM"
                  extra="(+₱30)"
                />
                {!isMoto(vehicleSize) && (
                  <Toggle
                    active={rollbar}
                    onClick={() => setRollbar(p => !p)}
                    color="#a855f7"
                    borderColor="rgba(168,85,247,0.4)"
                    bgColor="rgba(168,85,247,0.08)"
                    label="W/ Rollbar / Bullbar"
                    extra="(+₱20)"
                  />
                )}
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Discount (₱)</label>
                  <input style={S.input} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={S.label}>Payment Method</label>
                  <select style={S.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={S.label}>Crew</label>
                <select style={S.select} value={crew} onChange={e => setCrew(e.target.value)} required>
                  <option value="">Select crew member</option>
                  {crewList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Bill Breakdown */}
              <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Bill Breakdown</div>
                {!vehicleSize ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Select vehicle size to see breakdown</div>
                ) : (
                  <>
                    {getBillLines().map((line, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: line.color, marginBottom: 6 }}>
                        <span>{line.label}</span>
                        <span>{line.prefix || ''} ₱{line.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--blue-glow)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                      <span>Total</span><span>₱{total.toLocaleString()}</span>
                    </div>
                  </>
                )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ ...S.card, padding: '14px 20px', display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {filterDate ? 'Filtered' : 'Total'} Entries
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{filteredLogs.length}</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {filterDate ? 'Filtered' : 'Total'} Revenue
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>₱{filteredTotal.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <label style={{ ...S.label, marginBottom: 6 }}>Filter by Date</label>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...S.input, width: 180 }} />
              </div>
              {filterDate && (
                <button onClick={() => setFilterDate('')} style={{
                  marginTop: 20, padding: '8px 14px', borderRadius: 8, fontSize: 12,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                }}>Clear filter</button>
              )}
            </div>

            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1020 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date & Time</th>
                      <th style={S.th}>Vehicle</th>
                      <th style={S.th}>Plate No.</th>
                      <th style={S.th}>Size</th>
                      <th style={S.th}>Services</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Amount</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Discount</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                      <th style={{ ...S.th, textAlign: 'center' }}>Payment</th>
                      <th style={S.th}>Crew</th>
                      <th style={{ ...S.th, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
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
                        <td style={S.td}>
                          <span style={{
                            background: isMoto(l.vehicle_size) ? 'rgba(168,85,247,0.15)' : 'rgba(46,141,232,0.15)',
                            color: isMoto(l.vehicle_size) ? '#a855f7' : 'var(--blue-glow)',
                            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600
                          }}>
                            {l.vehicle_size}
                          </span>
                        </td>
                        <td style={{ ...S.td, maxWidth: 200 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {l.service.split(', ').map((s, i) => (
                              <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{l.amount?.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: '#f87171' }}>
                          {l.discount > 0 ? `- ₱${l.discount?.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>₱{l.total?.toLocaleString()}</td>
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
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <button
                            onClick={() => deleteLog(l.id)}
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}