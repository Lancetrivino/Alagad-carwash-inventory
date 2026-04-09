'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useIsMobile } from '@/hooks/useIsMobile'

const VEHICLE_SIZES = [
  { label: 'XSmall (₱160)', value: 'XSmall' },
  { label: 'Small (₱180)', value: 'Small' },
  { label: 'Medium (₱200)', value: 'Medium' },
  { label: 'Large (₱230)', value: 'Large' },
  { label: 'X-Large (₱250)', value: 'X-Large' },
  { label: 'XX-Large (₱300)', value: 'XX-Large' },
  { label: 'Motorcycle (₱120)', value: 'Motorcycle' },
  { label: 'Motorcycle 400cc up (₱180)', value: 'Motorcycle 400cc' },
]

const PRICES = {
  'Alagad Wash (Wash, Vacuum, Tire Black)': { XSmall: 160, Small: 180, Medium: 200, Large: 230, 'X-Large': 250, 'XX-Large': 300, Motorcycle: 120, 'Motorcycle 400cc': 180 },
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

const MOTO_SERVICES = ['Interior Dressing', 'Hand Wax (Motorcycle)']
const MOTO_COMBOS = {
  Motorcycle: { combo: ['Interior Dressing', 'Hand Wax (Motorcycle)'], comboPrice: 250 },
  'Motorcycle 400cc': { combo: ['Interior Dressing', 'Hand Wax (Motorcycle)'], comboPrice: 300 },
}
const MOTO_WASH = { Motorcycle: 120, 'Motorcycle 400cc': 180 }
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
const DETAILING_SERVICES = [
  'Glass Detailing', 'Mags Detailing', 'Engine Detailing',
  'Interior Detailing', 'Exterior Detailing', 'Ceramic Coating', 'Trim Black Restoration',
]

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", background: 'var(--navy)' },
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
  const isMobile = useIsMobile()
  const [logs, setLogs] = useState([])
  const [crewList, setCrewList] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('form')

  // Filter states
  const [filterDate, setFilterDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [searchLog, setSearchLog] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form states
  const [vehicleName, setVehicleName] = useState('')
  const [plateNo, setPlateNo] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [vehicleSize, setVehicleSize] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [crew, setCrew] = useState([])
  const [lateNight, setLateNight] = useState(false)
  const [rollbar, setRollbar] = useState(false)
  const [splitMode, setSplitMode] = useState('assign')
  const [serviceAssignments, setServiceAssignments] = useState({})
  const [manualSplits, setManualSplits] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else { fetchLogs(); fetchCrewList() }
    })
  }, [])

  useEffect(() => {
    const assignments = {}
    selectedServices.forEach(s => {
      assignments[s] = serviceAssignments[s] || (crew[0] || '')
    })
    setServiceAssignments(assignments)
  }, [selectedServices, crew])

  useEffect(() => {
    if (crew.length === 0) { setManualSplits({}); return }
    const even = Math.floor(100 / crew.length)
    const splits = {}
    crew.forEach((c, i) => {
      splits[c] = i === crew.length - 1 ? 100 - even * (crew.length - 1) : even
    })
    setManualSplits(splits)
  }, [crew])

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

  async function markAsPaid(id) {
    await fetch('/api/logbook', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, markPaid: true }),
    })
    fetchLogs()
  }

  function applyQuickFilter(filter) {
    setQuickFilter(filter)
    const now = new Date()
    if (filter === 'today') {
      const today = now.toISOString().split('T')[0]
      setStartDate(today); setEndDate(today); setFilterDate('')
    } else if (filter === 'week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(new Date().setDate(diff))
      setStartDate(monday.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
      setFilterDate('')
    } else if (filter === 'month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
      setFilterDate('')
    } else {
      setStartDate(''); setEndDate(''); setFilterDate('')
    }
  }

  function toggleService(serviceName) {
    setSelectedServices(prev =>
      prev.includes(serviceName) ? prev.filter(s => s !== serviceName) : [...prev, serviceName]
    )
  }

  function toggleCrewMember(name) {
    setCrew(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  function computeAmount() {
    if (!vehicleSize) return 0
    if (isMoto(vehicleSize)) {
      const washPrice = MOTO_WASH[vehicleSize]
      const hasInterior = selectedServices.includes('Interior Dressing')
      const hasWax = selectedServices.includes('Hand Wax (Motorcycle)')
      const combo = MOTO_COMBOS[vehicleSize]
      if (hasInterior && hasWax) return washPrice + combo.comboPrice
      if (hasInterior) return washPrice + (PRICES['Interior Dressing']?.[vehicleSize] || 0)
      if (hasWax) return washPrice + (PRICES['Hand Wax (Motorcycle)']?.[vehicleSize] || 0)
      return washPrice
    }
    return selectedServices.reduce((sum, s) => sum + (PRICES[s]?.[vehicleSize] || 0), 0)
  }

  const servicesAmount = computeAmount()
  const lateNightFee = lateNight ? 30 : 0
  const rollbarFee = rollbar ? 20 : 0
  const amount = servicesAmount + lateNightFee + rollbarFee
  const total = Math.max(0, amount - (parseFloat(discount) || 0))
  const suggestedVehicles = vehicleSize ? VEHICLES[vehicleSize] || [] : []
  const availableServices = vehicleSize
    ? isMoto(vehicleSize)
      ? MOTO_SERVICES
      : Object.keys(PRICES).filter(s => s !== 'Hand Wax (Motorcycle)')
    : Object.keys(PRICES).filter(s => s !== 'Hand Wax (Motorcycle)')

  function buildCrewAssignment() {
    if (crew.length <= 1) return null
    if (splitMode === '5050') return { mode: '5050' }
    if (splitMode === 'manual' && crew.length > 1 && Math.abs(manualTotal - 100) >= 0.01)
    return { mode: 'assign', assignments: serviceAssignments }
  }

  function getCrewCutPreview() {
    if (crew.length === 0 || total === 0) return []
    if (crew.length === 1) {
      const crewCut = selectedServices.reduce((sum, s) => {
        const isDetailing = DETAILING_SERVICES.some(d => s.includes(d))
        return sum + (PRICES[s]?.[vehicleSize] || 0) * (isDetailing ? 0.40 : 0.30)
      }, 0)
      return [{ name: crew[0], cut: Math.round(crewCut) }]
    }
    if (splitMode === '5050') {
      const perPerson = total / crew.length
      return crew.map(c => ({ name: c, cut: Math.round(perPerson * 0.30) }))
    }
    if (splitMode === 'manual') {
      return crew.map(c => {
        const pct = (parseFloat(manualSplits[c]) || 0) / 100
        return { name: c, pct: manualSplits[c], cut: Math.round(total * pct * 0.30) }
      })
    }
    return crew.map(c => {
      let crewCut = 0
      selectedServices.forEach(s => {
        if (serviceAssignments[s] === c) {
          const isDetailing = DETAILING_SERVICES.some(d => s.includes(d))
          crewCut += (PRICES[s]?.[vehicleSize] || 0) * (isDetailing ? 0.40 : 0.30)
        }
      })
      return { name: c, cut: Math.round(crewCut) }
    })
  }

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
      selectedServices.forEach(s => lines.push({ label: s, amount: PRICES[s]?.[vehicleSize] || 0, color: 'var(--text-secondary)' }))
    }
    if (lateNight) lines.push({ label: 'Beyond 6:00 PM', amount: 30, color: '#fbbf24', prefix: '+ ' })
    if (rollbar) lines.push({ label: 'W/ Rollbar / Bullbar', amount: 20, color: '#a855f7', prefix: '+ ' })
    if (discount > 0) lines.push({ label: 'Discount', amount: parseFloat(discount), color: '#f87171', prefix: '- ' })
    return lines
  }

  const manualTotal = Object.values(manualSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isMoto(vehicleSize) && selectedServices.length === 0) { setError('Please select at least one service'); return }
    if (crew.length === 0) { setError('Please select at least one crew member'); return }
    if (splitMode === 'manual' && crew.length > 1 && Math.abs(manualTotal - 100) > 0.1) { setError(`Manual split must total 100% (currently ${manualTotal}%)`); return }
    setLoading(true); setError('')

    const serviceLabel = isMoto(vehicleSize)
      ? selectedServices.length === 0 ? 'Motorcycle Wash' : selectedServices.join(', ')
      : selectedServices.join(', ')

    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]
    const loggedAt = new Date(`${entryDate}T${timeStr}`).toISOString()

    await fetch('/api/logbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_name: vehicleName, plate_no: plateNo, vehicle_size: vehicleSize,
        service: serviceLabel, amount, discount: parseFloat(discount) || 0, total,
        payment_method: paymentMethod, payment_status: paymentStatus,
        crew: crew.join(', '), crew_assignment: buildCrewAssignment(), logged_at: loggedAt,
      }),
    })

    setSuccess(true)
    setVehicleName(''); setPlateNo(''); setVehicleSize('')
    setSelectedServices([]); setDiscount(0)
    setPaymentMethod('Cash'); setPaymentStatus('paid')
    setCrew([]); setLateNight(false); setRollbar(false)
    setSplitMode('assign'); setServiceAssignments({})
    setEntryDate(new Date().toISOString().split('T')[0])
    setLoading(false)
    fetchLogs()
    setTimeout(() => setSuccess(false), 3000)
  }

  const filteredLogs = logs.filter(l => {
    const d = new Date(l.logged_at).toLocaleDateString('en-CA')
    const matchDate = filterDate ? d === filterDate : true
    const matchStart = startDate && !filterDate ? d >= startDate : true
    const matchEnd = endDate && !filterDate ? d <= endDate : true
    const matchSearch = searchLog
      ? l.plate_no?.toLowerCase().includes(searchLog.toLowerCase()) ||
        l.crew?.toLowerCase().includes(searchLog.toLowerCase()) ||
        l.vehicle_name?.toLowerCase().includes(searchLog.toLowerCase())
      : true
    const matchStatus = statusFilter === 'all' ? true : l.payment_status === statusFilter
    return matchDate && matchStart && matchEnd && matchSearch && matchStatus
  })

  const filteredTotal = filteredLogs.reduce((s, l) => s + l.total, 0)
  const filteredCash = filteredLogs.filter(l => l.payment_method === 'Cash').reduce((s, l) => s + l.total, 0)
  const filteredGcash = filteredLogs.filter(l => l.payment_method === 'GCash').reduce((s, l) => s + l.total, 0)
  const unpaidLogs = logs.filter(l => l.payment_status === 'unpaid')
  const crewCutPreview = getCrewCutPreview()
  const mainPadding = isMobile ? '80px 16px 90px' : '28px'

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, padding: mainPadding, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }}>

        {!isMobile && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehicle Logbook</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Record every car wash service — time auto-captured</div>
          </div>
        )}

        {/* Unpaid alert */}
        {unpaidLogs.length > 0 && (
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💰</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
                {unpaidLogs.length} unpaid — ₱{unpaidLogs.reduce((s, l) => s + l.total, 0).toLocaleString()} pending
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {unpaidLogs.map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '4px 10px' }}>
                    <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
                      {l.vehicle_name} {l.plate_no ? `(${l.plate_no})` : ''} — ₱{l.total.toLocaleString()}
                    </span>
                    <button onClick={() => markAsPaid(l.id)} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fbbf24', color: '#000', border: 'none', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
                      Mark Paid
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['form', 'logs'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: isMobile ? '10px 0' : '8px 20px',
              flex: isMobile ? 1 : 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600,
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

        {/* ── FORM TAB ── */}
        {tab === 'form' && (
          <div style={{ ...S.card, maxWidth: isMobile ? '100%' : 720, padding: isMobile ? 16 : 24 }}>
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
                      {VEHICLE_SIZES.filter(s => !isMoto(s.value)).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </optgroup>
                    <optgroup label="— Motorcycles —">
                      {VEHICLE_SIZES.filter(s => isMoto(s.value)).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Vehicle / Model</label>
                  <input style={S.input} type="text" value={vehicleName} onChange={e => setVehicleName(e.target.value)} required
                    placeholder={vehicleSize ? `e.g. ${suggestedVehicles[0] || ''}` : 'Select size first'} list="vehicle-suggestions" />
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
                  <label style={S.label}>Date</label>
                  <input style={S.input} type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Time auto-captured on save</div>
                </div>
              </div>

              {isMoto(vehicleSize) && (
                <div style={{ background: 'rgba(46,141,232,0.08)', border: '1px solid rgba(46,141,232,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--blue-glow)', fontWeight: 600, marginBottom: 4 }}>🏍 Motorcycle Base Wash — ₱{MOTO_WASH[vehicleSize]}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add-ons optional. Combo price when both selected.</div>
                </div>
              )}

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
                  display: 'grid',
                  gridTemplateColumns: isMoto(vehicleSize) ? '1fr' : isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: 8, background: 'var(--navy-mid)', borderRadius: 10,
                  border: '1px solid var(--border)', padding: 12,
                  maxHeight: isMoto(vehicleSize) ? 'auto' : 260, overflowY: 'auto',
                }}>
                  {availableServices.map(serviceName => {
                    const checked = selectedServices.includes(serviceName)
                    const price = vehicleSize ? PRICES[serviceName]?.[vehicleSize] : null
                    const isInCombo = isMoto(vehicleSize) && MOTO_COMBOS[vehicleSize]?.combo.includes(serviceName)
                    const bothSelected = isMoto(vehicleSize) && selectedServices.includes('Interior Dressing') && selectedServices.includes('Hand Wax (Motorcycle)')
                    return (
                      <div key={serviceName} onClick={() => toggleService(serviceName)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 10, padding: isMobile ? '12px' : '9px 12px', borderRadius: 8, cursor: 'pointer',
                        border: checked ? '1px solid rgba(46,141,232,0.5)' : '1px solid transparent',
                        background: checked ? 'rgba(46,141,232,0.12)' : 'transparent', transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: isMobile ? 20 : 16, height: isMobile ? 20 : 16, borderRadius: 4, flexShrink: 0,
                            border: checked ? '2px solid var(--blue-glow)' : '2px solid var(--border)',
                            background: checked ? 'var(--blue-glow)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                          </div>
                          <div>
                            <span style={{ fontSize: isMobile ? 13 : 12, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: checked ? 600 : 400 }}>
                              {serviceName}
                            </span>
                            {isInCombo && bothSelected && <span style={{ marginLeft: 6, fontSize: 10, color: '#4ade80', fontWeight: 600 }}>combo</span>}
                          </div>
                        </div>
                        {price && (
                          <span style={{ fontSize: 12, color: 'var(--blue-glow)', fontWeight: 600, flexShrink: 0, opacity: isInCombo && bothSelected ? 0.6 : 1 }}>
                            ₱{price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {isMoto(vehicleSize) && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>💡 Select both for combo price of ₱{MOTO_COMBOS[vehicleSize]?.comboPrice}</div>}
                {!vehicleSize && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Select vehicle size to see services</div>}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Toggle active={lateNight} onClick={() => setLateNight(p => !p)} color="#fbbf24" borderColor="rgba(251,191,36,0.4)" bgColor="rgba(251,191,36,0.08)" label="Beyond 6:00 PM" extra="(+₱30)" />
                {!isMoto(vehicleSize) && <Toggle active={rollbar} onClick={() => setRollbar(p => !p)} color="#a855f7" borderColor="rgba(168,85,247,0.4)" bgColor="rgba(168,85,247,0.08)" label="W/ Rollbar / Bullbar" extra="(+₱20)" />}
              </div>

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Discount (₱)</label>
                  <input style={S.input} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={S.label}>Payment Method</label>
                  <select style={S.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={S.label}>Payment Status</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { value: 'paid', label: '✓ Paid', color: '#4ade80', border: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.08)' },
                    { value: 'unpaid', label: '⏳ Not Paid Yet', color: '#fbbf24', border: 'rgba(251,191,36,0.4)', bg: 'rgba(251,191,36,0.08)' },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => setPaymentStatus(opt.value)} style={{
                      flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      border: paymentStatus === opt.value ? `1px solid ${opt.border}` : '1px solid var(--border)',
                      background: paymentStatus === opt.value ? opt.bg : 'var(--navy-mid)',
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: paymentStatus === opt.value ? `2px solid ${opt.color}` : '2px solid var(--border)', background: paymentStatus === opt.value ? opt.color : 'transparent' }} />
                      <span style={{ fontSize: 13, fontWeight: paymentStatus === opt.value ? 600 : 400, color: paymentStatus === opt.value ? opt.color : 'var(--text-secondary)' }}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={S.label}>
                  Crew
                  {crew.length > 0 && <span style={{ marginLeft: 8, background: 'var(--blue)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{crew.length} selected</span>}
                </label>
                <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {crewList.map(c => {
                    const selected = crew.includes(c.name)
                    return (
                      <div key={c.id} onClick={() => toggleCrewMember(c.name)} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: isMobile ? '10px 16px' : '8px 14px', borderRadius: 8, cursor: 'pointer',
                        border: selected ? '1px solid rgba(46,141,232,0.5)' : '1px solid var(--border)',
                        background: selected ? 'rgba(46,141,232,0.12)' : 'transparent', transition: 'all 0.15s',
                      }}>
                        <div style={{
                          width: isMobile ? 32 : 28, height: isMobile ? 32 : 28, borderRadius: '50%', flexShrink: 0,
                          background: selected ? 'linear-gradient(135deg, var(--blue), var(--blue-glow))' : 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: selected ? '#fff' : 'var(--text-muted)',
                          border: selected ? 'none' : '1px solid var(--border)',
                        }}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: selected ? 600 : 400 }}>{c.name}</span>
                      </div>
                    )
                  })}
                </div>
                {crew.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Select one or more crew members</div>}
              </div>

              {crew.length >= 2 && (
                <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Salary Split Mode</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                      { key: 'assign', label: 'By Service' },
                      { key: '5050', label: 'Even Split' },
                      { key: 'manual', label: 'Manual %' },
                    ].map(m => (
                      <div key={m.key} onClick={() => setSplitMode(m.key)} style={{
                        flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                        border: splitMode === m.key ? '1px solid rgba(46,141,232,0.5)' : '1px solid var(--border)',
                        background: splitMode === m.key ? 'rgba(46,141,232,0.12)' : 'transparent',
                        transition: 'all 0.15s', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: splitMode === m.key ? 'var(--blue-glow)' : 'var(--text-secondary)' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {splitMode === 'assign' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedServices.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Select services above to assign them</div>
                      ) : selectedServices.map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₱{(PRICES[s]?.[vehicleSize] || 0).toLocaleString()}</div>
                          </div>
                          <select value={serviceAssignments[s] || ''} onChange={e => setServiceAssignments(prev => ({ ...prev, [s]: e.target.value }))} style={{ ...S.select, width: 130, padding: '8px 12px', fontSize: 13 }}>
                            <option value="">Unassigned</option>
                            {crew.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {splitMode === '5050' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {crew.map((c, i) => (
                        <div key={c} style={{ flex: 1, minWidth: 80, background: 'rgba(46,141,232,0.08)', border: '1px solid rgba(46,141,232,0.2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{c}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-glow)' }}>
                            {i === crew.length - 1 ? 100 - Math.floor(100 / crew.length) * (crew.length - 1) : Math.floor(100 / crew.length)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {splitMode === 'manual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {crew.map(c => (
                        <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                            {c[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{c}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                           <input type="number" min="0" max="100" step="0.1" value={manualSplits[c] || 0} onChange={e => setManualSplits(prev => ({ ...prev, [c]: parseFloat(e.target.value) || 0 }))} style={{ ...S.input, width: 90, padding: '8px 12px', textAlign: 'center' }} />
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                        <span style={{ fontWeight: 700, color: Math.abs(manualTotal - 100) < 0.01 ? '#4ade80' : '#f87171' }}>{parseFloat(manualTotal.toFixed(1))}%</span>
                        {Math.abs(manualTotal - 100) >= 0.01 && <span style={{ color: '#f87171', fontSize: 11 }}>must equal 100%</span>}
                      </div>
                    </div>
                  )}

                  {crewCutPreview.length > 0 && total > 0 && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Estimated Crew Pay</div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {crewCutPreview.map(c => (
                          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.name}:</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>₱{c.cut.toLocaleString()}</span>
                            {c.pct && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({c.pct}%)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Bill Breakdown</div>
                {!vehicleSize ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Select vehicle size to see breakdown</div>
                ) : (
                  <>
                    {getBillLines().map((line, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: line.color, marginBottom: 6 }}>
                        <span>{line.label}</span>
                        <span>{line.prefix || ''}₱{line.amount?.toLocaleString()}</span>
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
                color: '#fff', border: 'none', borderRadius: 10,
                padding: isMobile ? '16px' : '13px',
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontFamily: "'Barlow', sans-serif",
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </form>
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Filters */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>

              {/* Quick filters */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This Week' },
                  { key: 'month', label: 'This Month' },
                ].map(f => (
                  <button key={f.key} onClick={() => applyQuickFilter(f.key)} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
                    background: quickFilter === f.key ? 'var(--blue)' : 'var(--navy-mid)',
                    color: quickFilter === f.key ? '#fff' : 'var(--text-secondary)',
                    border: quickFilter === f.key ? '1px solid var(--blue)' : '1px solid var(--border)',
                  }}>{f.label}</button>
                ))}
              </div>

              {/* Date range + search + status */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'flex-end' }}>
                <div>
                  <label style={{ ...S.label, marginBottom: 4 }}>Start Date</label>
                  <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setFilterDate(''); setQuickFilter('custom') }}
                    style={{ ...S.input, width: isMobile ? '100%' : 160, padding: '8px 12px', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ ...S.label, marginBottom: 4 }}>End Date</label>
                  <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setFilterDate(''); setQuickFilter('custom') }}
                    style={{ ...S.input, width: isMobile ? '100%' : 160, padding: '8px 12px', fontSize: 13 }} />
                </div>
                <div style={{ flex: isMobile ? 'none' : 1 }}>
                  <label style={{ ...S.label, marginBottom: 4 }}>Search</label>
                  <input type="text" placeholder="Plate, crew, vehicle..." value={searchLog} onChange={e => setSearchLog(e.target.value)}
                    style={{ ...S.input, width: isMobile ? '100%' : 200, padding: '8px 12px', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ ...S.label, marginBottom: 4 }}>Status</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ value: 'all', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }].map(f => (
                      <button key={f.value} onClick={() => setStatusFilter(f.value)} style={{
                        flex: isMobile ? 1 : 'none',
                        padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
                        background: statusFilter === f.value ? 'var(--blue)' : 'var(--navy-mid)',
                        color: statusFilter === f.value ? '#fff' : 'var(--text-secondary)',
                        border: statusFilter === f.value ? '1px solid var(--blue)' : '1px solid var(--border)',
                      }}>{f.label}</button>
                    ))}
                  </div>
                </div>
                {(startDate || endDate || searchLog || filterDate || statusFilter !== 'all') && (
                  <button onClick={() => { setStartDate(''); setEndDate(''); setSearchLog(''); setFilterDate(''); setStatusFilter('all'); setQuickFilter('all') }}
                    style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, auto)', gap: isMobile ? 12 : 0, alignItems: 'center' }}>
              {[
                { label: 'Entries', value: filteredLogs.length, color: 'var(--text-primary)', big: true },
                { label: 'Total', value: `₱${filteredTotal.toLocaleString()}`, color: '#4ade80' },
                { label: 'Cash', value: `₱${filteredCash.toLocaleString()}`, color: '#fbbf24' },
                { label: 'GCash', value: `₱${filteredGcash.toLocaleString()}`, color: 'var(--blue-glow)' },
                ...(unpaidLogs.length > 0 ? [{ label: 'Unpaid', value: `₱${unpaidLogs.reduce((s, l) => s + l.total, 0).toLocaleString()}`, color: '#fbbf24' }] : []),
              ].map((m, i, arr) => (
                <div key={i} style={{ textAlign: isMobile ? 'left' : 'center', padding: isMobile ? 0 : '0 20px', borderRight: !isMobile && i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: m.big ? 22 : 18, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No entries found.</div>
                ) : filteredLogs.map(l => {
                  const isUnpaid = l.payment_status === 'unpaid'
                  return (
                    <div key={l.id} style={{
                      background: isUnpaid ? 'rgba(251,191,36,0.05)' : 'var(--surface)',
                      border: `1px solid ${isUnpaid ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
                      borderRadius: 12, padding: 14,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{l.vehicle_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--blue-glow)', fontWeight: 600 }}>{l.plate_no || '—'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: isUnpaid ? '#fbbf24' : '#4ade80' }}>₱{l.total?.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(l.logged_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {l.service.split(', ').map((s, i) => (
                          <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{s}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, background: isMoto(l.vehicle_size) ? 'rgba(168,85,247,0.15)' : 'rgba(46,141,232,0.15)', color: isMoto(l.vehicle_size) ? '#a855f7' : 'var(--blue-glow)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{l.vehicle_size}</span>
                          <span style={{ fontSize: 11, background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)', color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{l.payment_method}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.crew}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isUnpaid && (
                            <button onClick={() => markAsPaid(l.id)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                              ⏳ Mark Paid
                            </button>
                          )}
                          <button onClick={() => deleteLog(l.id)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop table */
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1100 }}>
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
                        <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
                        <th style={S.th}>Crew</th>
                        <th style={{ ...S.th, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr><td colSpan={12} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No entries found.</td></tr>
                      ) : filteredLogs.map(l => {
                        const isUnpaid = l.payment_status === 'unpaid'
                        return (
                          <tr key={l.id}
                            style={{ background: isUnpaid ? 'rgba(251,191,36,0.04)' : 'transparent' }}
                            onMouseEnter={e => e.currentTarget.style.background = isUnpaid ? 'rgba(251,191,36,0.08)' : 'var(--surface-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = isUnpaid ? 'rgba(251,191,36,0.04)' : 'transparent'}
                          >
                            <td style={{ ...S.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {new Date(l.logged_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ ...S.td, fontWeight: 600 }}>{l.vehicle_name}</td>
                            <td style={{ ...S.td, color: 'var(--blue-glow)', fontWeight: 600 }}>{l.plate_no || '—'}</td>
                            <td style={S.td}>
                              <span style={{ background: isMoto(l.vehicle_size) ? 'rgba(168,85,247,0.15)' : 'rgba(46,141,232,0.15)', color: isMoto(l.vehicle_size) ? '#a855f7' : 'var(--blue-glow)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                {l.vehicle_size}
                              </span>
                            </td>
                            <td style={{ ...S.td, maxWidth: 180 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {l.service.split(', ').map((s, i) => (
                                  <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{s}</span>
                                ))}
                              </div>
                            </td>
                            <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{l.amount?.toLocaleString()}</td>
                            <td style={{ ...S.td, textAlign: 'right', color: '#f87171' }}>{l.discount > 0 ? `- ₱${l.discount?.toLocaleString()}` : '—'}</td>
                            <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: isUnpaid ? '#fbbf24' : '#4ade80' }}>₱{l.total?.toLocaleString()}</td>
                            <td style={{ ...S.td, textAlign: 'center' }}>
                              <span style={{ background: l.payment_method === 'GCash' ? 'rgba(34,197,94,0.15)' : 'rgba(250,191,36,0.15)', color: l.payment_method === 'GCash' ? '#4ade80' : '#fbbf24', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                {l.payment_method}
                              </span>
                            </td>
                            <td style={{ ...S.td, textAlign: 'center' }}>
                              {isUnpaid ? (
                                <button onClick={() => markAsPaid(l.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', whiteSpace: 'nowrap' }}>
                                  ⏳ Mark Paid
                                </button>
                              ) : (
                                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>✓ Paid</span>
                              )}
                            </td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {l.crew.split(', ').map((c, i) => (
                                  <span key={i} style={{ background: 'rgba(46,141,232,0.1)', color: 'var(--blue-glow)', border: '1px solid rgba(46,141,232,0.2)', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{c}</span>
                                ))}
                                {l.crew_assignment && (
                                  <span style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>
                                    {l.crew_assignment.mode === '5050' ? 'even' : l.crew_assignment.mode === 'manual' ? 'manual' : 'assigned'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ ...S.td, textAlign: 'center' }}>
                              <button onClick={() => deleteLog(l.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow', sans-serif", background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', transition: 'all 0.15s' }}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}