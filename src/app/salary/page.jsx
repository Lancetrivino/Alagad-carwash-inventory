'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const DETAILING_SERVICES = [
  'Glass Detailing',
  'Mags Detailing',
  'Engine Detailing',
  'Interior Detailing',
  'Exterior Detailing',
  'Ceramic Coating',
  'Trim Black Restoration',
]

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", background: 'var(--navy)' },
  main: { flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'auto' },
  heading: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' },
  sub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
  select: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif", appearance: 'none' },
  th: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 },
  td: { padding: '12px 16px', borderBottom: '1px solid rgba(30,58,82,0.5)', color: 'var(--text-primary)', fontSize: 13 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
}

function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
      background: active ? 'var(--blue)' : 'var(--surface)',
      color: active ? '#fff' : 'var(--text-secondary)',
      border: active ? '1px solid var(--blue)' : '1px solid var(--border)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{label}</button>
  )
}

function parseAssignment(raw) {
  if (!raw) return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return raw
}

function computeSalary(logs, crewName) {
  let regularTotal = 0
  let detailingTotal = 0

  logs.forEach(log => {
    const crewMembers = log.crew
      ? log.crew.split(', ').map(c => c.trim().toLowerCase())
      : []
    const normalizedName = crewName.trim().toLowerCase()

    if (!crewMembers.includes(normalizedName)) return

    const services = log.service ? log.service.split(', ') : []
    if (services.length === 0) return

    const assignment = parseAssignment(log.crew_assignment)
    const isSingleCrew = crewMembers.length === 1
    const mode = isSingleCrew ? 'single' : (assignment?.mode || '5050')

    const getServiceType = (s) =>
      DETAILING_SERVICES.some(d => s.toLowerCase().includes(d.toLowerCase()))

    if (mode === 'single') {
      // Single crew gets full service value
      services.forEach(s => {
        const portion = log.total / services.length
        if (getServiceType(s)) detailingTotal += portion
        else regularTotal += portion
      })
      return
    }

    if (mode === '5050') {
      // Each crew member gets an equal share of the total
      const share = log.total / crewMembers.length
      const detailingCount = services.filter(s => getServiceType(s)).length
      const regularCount = services.length - detailingCount

      if (services.length > 0) {
        detailingTotal += share * (detailingCount / services.length)
        regularTotal += share * (regularCount / services.length)
      } else {
        regularTotal += share
      }
      return
    }

    if (mode === 'manual') {
      const splits = assignment?.splits || {}
      // Try to find the crew member's split percentage (case-insensitive)
      const splitKey = Object.keys(splits).find(k => k.trim().toLowerCase() === normalizedName)
      const pct = splitKey ? (parseFloat(splits[splitKey]) || 0) / 100 : 0
      const share = log.total * pct

      const detailingCount = services.filter(s => getServiceType(s)).length

      if (services.length > 0) {
        detailingTotal += share * (detailingCount / services.length)
        regularTotal += share * (1 - detailingCount / services.length)
      } else {
        regularTotal += share
      }
      return
    }

    if (mode === 'assign') {
      const assignments = assignment?.assignments || {}
      services.forEach(s => {
        // Case-insensitive matching
        const assignedKey = Object.keys(assignments).find(k => k === s)
        const assignedTo = assignedKey
          ? (assignments[assignedKey] || '').trim().toLowerCase()
          : ''

        if (assignedTo === normalizedName) {
          const portion = log.total / services.length
          if (getServiceType(s)) detailingTotal += portion
          else regularTotal += portion
        }
      })
      return
    }
  })

  const regularCut = regularTotal * 0.30
  const detailingCut = detailingTotal * 0.40

  return {
    regularTotal: Math.round(regularTotal),
    detailingTotal: Math.round(detailingTotal),
    regularCut: Math.round(regularCut),
    detailingCut: Math.round(detailingCut),
    grossSalary: Math.round(regularCut + detailingCut),
  }
}

export default function SalaryPage() {
  const router = useRouter()
  const [tab, setTab] = useState('summary')
  const [crew, setCrew] = useState([])
  const [logs, setLogs] = useState([])
  const [loans, setLoans] = useState([])
  const [newCrewName, setNewCrewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [selectedCrew, setSelectedCrew] = useState(null)
  const [filterDate, setFilterDate] = useState('')

  const [loanCrewId, setLoanCrewId] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [loanNote, setLoanNote] = useState('')
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0])
  const [loanLoading, setLoanLoading] = useState(false)
  const [loanSuccess, setLoanSuccess] = useState(false)

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(new Date().setDate(diff))
    return monday.toISOString().split('T')[0]
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else { fetchCrew(); fetchLogs(); fetchLoans() }
    })
  }, [])

  async function fetchCrew() {
    const res = await fetch('/api/crew')
    setCrew(await res.json())
  }

  async function fetchLogs() {
    const res = await fetch('/api/logbook')
    setLogs(await res.json())
  }

  async function fetchLoans() {
    const res = await fetch('/api/loans')
    setLoans(await res.json())
  }

  async function addCrew() {
    if (!newCrewName.trim()) return
    setAdding(true)
    await fetch('/api/crew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCrewName.trim() }),
    })
    setNewCrewName('')
    setAdding(false)
    fetchCrew()
  }

  async function toggleActive(member) {
    await fetch('/api/crew', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, active: !member.active }),
    })
    fetchCrew()
  }

  async function deleteCrew(id) {
    if (!confirm('Remove this crew member?')) return
    await fetch('/api/crew', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchCrew()
  }

  async function addLoan(e) {
    e.preventDefault()
    if (!loanCrewId || !loanAmount) return
    setLoanLoading(true)
    const selectedMember = crew.find(c => c.id === parseInt(loanCrewId))
    await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crew_id: parseInt(loanCrewId),
        crew_name: selectedMember?.name,
        amount: parseFloat(loanAmount),
        note: loanNote,
        loaned_at: loanDate,
      }),
    })
    setLoanCrewId(''); setLoanAmount(''); setLoanNote('')
    setLoanDate(new Date().toISOString().split('T')[0])
    setLoanLoading(false); setLoanSuccess(true)
    fetchLoans()
    setTimeout(() => setLoanSuccess(false), 3000)
  }

  async function deleteLoan(id) {
    if (!confirm('Delete this loan record?')) return
    await fetch('/api/loans', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchLoans()
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  function getWeekLogs() {
    return logs.filter(l => {
      const d = new Date(l.logged_at).toLocaleDateString('en-CA')
      return d >= weekStart && d <= weekEndStr
    })
  }

  function getDayLogs(dateStr) {
    return logs.filter(l =>
      new Date(l.logged_at).toLocaleDateString('en-CA') === dateStr
    )
  }

  function getWeekDates() {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  function getWeekLoans(crewName) {
    return loans.filter(l =>
      l.crew_name?.toLowerCase().trim() === crewName.toLowerCase().trim() &&
      l.loaned_at >= weekStart &&
      l.loaned_at <= weekEndStr
    )
  }

  function getPreviousUnpaidLoans(crewName) {
    return loans.filter(l =>
      l.crew_name?.toLowerCase().trim() === crewName.toLowerCase().trim() &&
      l.loaned_at < weekStart
    )
  }

  const weekLogs = getWeekLogs()
  const activeCrew = crew.filter(c => c.active)

  const weekSummary = activeCrew.map(c => {
    const salary = computeSalary(weekLogs, c.name)
    const weekLoanTotal = getWeekLoans(c.name).reduce((s, l) => s + l.amount, 0)
    const prevLoanTotal = getPreviousUnpaidLoans(c.name).reduce((s, l) => s + l.amount, 0)
    const totalLoan = weekLoanTotal + prevLoanTotal
    const netSalary = Math.max(0, salary.grossSalary - totalLoan)
    const unpaidBalance = Math.max(0, totalLoan - salary.grossSalary)
    return {
      ...c,
      ...salary,
      weekLoanTotal: Math.round(weekLoanTotal),
      prevLoanTotal: Math.round(prevLoanTotal),
      totalLoan: Math.round(totalLoan),
      netSalary: Math.round(netSalary),
      unpaidBalance: Math.round(unpaidBalance),
    }
  })

  const selectedCrewWeekDetail = selectedCrew
    ? getWeekDates().map(date => {
        const dayLogs = getDayLogs(date)
        const crewDayLogs = dayLogs.filter(l => {
          const members = l.crew?.split(', ').map(c => c.trim().toLowerCase()) || []
          return members.includes(selectedCrew.name.toLowerCase().trim())
        })
        return {
          date,
          logs: crewDayLogs,
          ...computeSalary(crewDayLogs, selectedCrew.name),
        }
      }).filter(d => d.logs.length > 0)
    : []

  const daySummary = filterDate
    ? activeCrew.map(c => ({
        ...c,
        ...computeSalary(getDayLogs(filterDate), c.name),
        vehicleCount: getDayLogs(filterDate).filter(l => {
          const members = l.crew?.split(', ').map(m => m.trim().toLowerCase()) || []
          return members.includes(c.name.toLowerCase().trim())
        }).length,
      }))
    : []

  const loansByCrew = crew.map(c => ({
    ...c,
    loans: loans.filter(l =>
      l.crew_name?.toLowerCase().trim() === c.name.toLowerCase().trim()
    ),
    totalLoaned: loans
      .filter(l => l.crew_name?.toLowerCase().trim() === c.name.toLowerCase().trim())
      .reduce((s, l) => s + l.amount, 0),
  })).filter(c => c.loans.length > 0)

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>Salary Computation</div>
          <div style={S.sub}>Auto-computed from logbook — loans auto-deducted from weekly pay</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TabBtn active={tab === 'summary'} onClick={() => setTab('summary')} label="Weekly Summary" />
          <TabBtn active={tab === 'daily'} onClick={() => setTab('daily')} label="Daily Breakdown" />
          <TabBtn active={tab === 'loans'} onClick={() => setTab('loans')} label="Loans / Credits" />
          <TabBtn active={tab === 'crew'} onClick={() => setTab('crew')} label="Manage Crew" />
        </div>

        {/* WEEKLY SUMMARY */}
        {tab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={S.label}>Week Starting (Monday)</label>
                <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} style={{ ...S.input, width: 200 }} />
              </div>
              <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                {new Date(weekStart + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} — {weekEnd.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Week totals */}
            <div style={{ ...S.card, padding: '16px 20px', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total Vehicles</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{weekLogs.length}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Week Revenue</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>₱{weekLogs.reduce((s, l) => s + l.total, 0).toLocaleString()}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Gross Crew Pay</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>₱{weekSummary.reduce((s, c) => s + c.grossSalary, 0).toLocaleString()}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total Loans</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>₱{weekSummary.reduce((s, c) => s + c.totalLoan, 0).toLocaleString()}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Net Crew Pay</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue-glow)' }}>₱{weekSummary.reduce((s, c) => s + c.netSalary, 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Crew cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {weekSummary.map(c => (
                <div key={c.id}
                  style={{ ...S.card, cursor: 'pointer', transition: 'border 0.15s', border: selectedCrew?.id === c.id ? '1px solid var(--blue)' : '1px solid var(--border)' }}
                  onClick={() => setSelectedCrew(selectedCrew?.id === c.id ? null : c)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--navy-mid)', padding: '3px 8px', borderRadius: 6 }}>
                      Click for details
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>Regular services (30%)</span>
                      <span>₱{c.regularCut.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>Detailing services (40%)</span>
                      <span>₱{c.detailingCut.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#fbbf24', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
                      <span>Gross Pay</span>
                      <span>₱{c.grossSalary.toLocaleString()}</span>
                    </div>
                    {c.weekLoanTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#f87171' }}>
                        <span>This week loans</span>
                        <span>- ₱{c.weekLoanTotal.toLocaleString()}</span>
                      </div>
                    )}
                    {c.prevLoanTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#f87171' }}>
                        <span>Carried over loans</span>
                        <span>- ₱{c.prevLoanTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: c.netSalary > 0 ? 'var(--blue-glow)' : '#f87171', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
                      <span>Net Pay</span>
                      <span>₱{c.netSalary.toLocaleString()}</span>
                    </div>
                    {c.unpaidBalance > 0 && (
                      <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#f87171', marginTop: 4 }}>
                        <span>Unpaid balance (carry over)</span>
                        <span>₱{c.unpaidBalance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-crew weekly detail */}
            {selectedCrew && selectedCrewWeekDetail.length > 0 && (
              <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {selectedCrew.name} — Daily Breakdown
                  </span>
                  <button onClick={() => setSelectedCrew(null)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Close</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Vehicles</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Regular</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Detailing</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Regular Cut (30%)</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Detailing Cut (40%)</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Day Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCrewWeekDetail.map(d => (
                      <tr key={d.date}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...S.td, color: 'var(--text-secondary)' }}>
                          {new Date(d.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={S.td}>{d.logs.length}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{d.regularTotal.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{d.detailingTotal.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: 'var(--blue-glow)' }}>₱{d.regularCut.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'right', color: '#a855f7' }}>₱{d.detailingCut.toLocaleString()}</td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>₱{d.grossSalary.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--navy-mid)' }}>
                      <td style={{ ...S.td, fontWeight: 700, color: 'var(--text-primary)' }}>TOTAL</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{selectedCrewWeekDetail.reduce((s, d) => s + d.logs.length, 0)}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700 }}>₱{selectedCrewWeekDetail.reduce((s, d) => s + d.regularTotal, 0).toLocaleString()}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700 }}>₱{selectedCrewWeekDetail.reduce((s, d) => s + d.detailingTotal, 0).toLocaleString()}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: 'var(--blue-glow)' }}>₱{selectedCrewWeekDetail.reduce((s, d) => s + d.regularCut, 0).toLocaleString()}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#a855f7' }}>₱{selectedCrewWeekDetail.reduce((s, d) => s + d.detailingCut, 0).toLocaleString()}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>₱{selectedCrewWeekDetail.reduce((s, d) => s + d.grossSalary, 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DAILY BREAKDOWN */}
        {tab === 'daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={S.label}>Select Date</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...S.input, width: 200 }} />
            </div>

            {filterDate && (
              <>
                <div style={{ ...S.card, padding: '14px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Vehicles Served</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{getDayLogs(filterDate).length}</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Day Revenue</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>₱{getDayLogs(filterDate).reduce((s, l) => s + l.total, 0).toLocaleString()}</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total Crew Pay</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>₱{daySummary.reduce((s, c) => s + c.grossSalary, 0).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={S.th}>Crew</th>
                        <th style={{ ...S.th, textAlign: 'center' }}>Vehicles</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Regular Total</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Detailing Total</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Regular Cut (30%)</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Detailing Cut (40%)</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Day Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySummary.map(c => (
                        <tr key={c.id}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ ...S.td, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                                {c.name[0].toUpperCase()}
                              </div>
                              {c.name}
                            </div>
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>{c.vehicleCount}</td>
                          <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{c.regularTotal.toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{c.detailingTotal.toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: 'right', color: 'var(--blue-glow)' }}>₱{c.regularCut.toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: 'right', color: '#a855f7' }}>₱{c.detailingCut.toLocaleString()}</td>
                          <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>₱{c.grossSalary.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {activeCrew.map(c => {
                  const crewDayLogs = getDayLogs(filterDate).filter(l => {
                    const members = l.crew?.split(', ').map(m => m.trim().toLowerCase()) || []
                    return members.includes(c.name.toLowerCase().trim())
                  })
                  if (crewDayLogs.length === 0) return null
                  return (
                    <div key={c.id} style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--navy-mid)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name} — Vehicle Log</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={S.th}>Time</th>
                            <th style={S.th}>Vehicle</th>
                            <th style={S.th}>Services</th>
                            <th style={S.th}>Split</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Crew Cut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crewDayLogs.map(l => {
                            const assignment = parseAssignment(l.crew_assignment)
                            const crewMembers = l.crew?.split(', ').map(m => m.trim()) || []
                            const mode = crewMembers.length <= 1 ? 'single' : (assignment?.mode || '5050')
                            const salary = computeSalary([l], c.name)
                            const crewCut = salary.grossSalary

                            return (
                              <tr key={l.id}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ ...S.td, color: 'var(--text-muted)' }}>
                                  {new Date(l.logged_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ ...S.td, fontWeight: 600 }}>{l.vehicle_name}</td>
                                <td style={{ ...S.td, color: 'var(--text-secondary)', maxWidth: 220 }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {l.service.split(', ').map((s, i) => (
                                      <span key={i} style={{
                                        background: DETAILING_SERVICES.some(d => s.toLowerCase().includes(d.toLowerCase())) ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${DETAILING_SERVICES.some(d => s.toLowerCase().includes(d.toLowerCase())) ? 'rgba(168,85,247,0.3)' : 'var(--border)'}`,
                                        borderRadius: 4, padding: '1px 6px', fontSize: 11, whiteSpace: 'nowrap',
                                        color: DETAILING_SERVICES.some(d => s.toLowerCase().includes(d.toLowerCase())) ? '#a855f7' : 'var(--text-secondary)',
                                      }}>
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td style={S.td}>
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                                    background: mode === 'single' ? 'rgba(34,197,94,0.1)' : mode === '5050' ? 'rgba(46,141,232,0.1)' : mode === 'manual' ? 'rgba(251,191,36,0.1)' : 'rgba(168,85,247,0.1)',
                                    color: mode === 'single' ? '#4ade80' : mode === '5050' ? 'var(--blue-glow)' : mode === 'manual' ? '#fbbf24' : '#a855f7',
                                  }}>
                                    {mode === 'single' ? 'solo' : mode === '5050' ? 'even' : mode === 'manual' ? 'manual' : 'assigned'}
                                  </span>
                                </td>
                                <td style={{ ...S.td, textAlign: 'right', color: 'var(--text-secondary)' }}>₱{l.total.toLocaleString()}</td>
                                <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>₱{crewCut.toLocaleString()}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </>
            )}

            {!filterDate && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
                Select a date to view daily salary breakdown
              </div>
            )}
          </div>
        )}

        {/* LOANS */}
        {tab === 'loans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ ...S.card, maxWidth: 560 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                Record Loan / Credit
              </div>

              {loanSuccess && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', marginBottom: 16 }}>
                  Loan recorded successfully!
                </div>
              )}

              <form onSubmit={addLoan} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Crew Member</label>
                    <select style={S.select} value={loanCrewId} onChange={e => setLoanCrewId(e.target.value)} required>
                      <option value="">Select crew</option>
                      {crew.filter(c => c.active).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Amount (₱)</label>
                    <input style={S.input} type="number" min="1" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="e.g. 200" required />
                  </div>
                </div>
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Date</label>
                    <input style={S.input} type="date" value={loanDate} onChange={e => setLoanDate(e.target.value)} required />
                  </div>
                  <div>
                    <label style={S.label}>Note (optional)</label>
                    <input style={S.input} type="text" value={loanNote} onChange={e => setLoanNote(e.target.value)} placeholder="e.g. food allowance" />
                  </div>
                </div>
                <button type="submit" disabled={loanLoading} style={{
                  background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '13px',
                  fontSize: 14, fontWeight: 700, cursor: loanLoading ? 'not-allowed' : 'pointer',
                  opacity: loanLoading ? 0.5 : 1, fontFamily: "'Barlow', sans-serif",
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {loanLoading ? 'Saving...' : 'Record Loan'}
                </button>
              </form>
            </div>

            {loansByCrew.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>No loans recorded yet.</div>
            ) : loansByCrew.map(c => (
              <div key={c.id} style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy-mid)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{c.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total Loaned</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>₱{c.totalLoaned.toLocaleString()}</div>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Amount</th>
                      <th style={S.th}>Note</th>
                      <th style={{ ...S.th, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.loans.map(l => (
                      <tr key={l.id}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...S.td, color: 'var(--text-muted)' }}>
                          {new Date(l.loaned_at + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#f87171' }}>₱{l.amount.toLocaleString()}</td>
                        <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{l.note || '—'}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <button onClick={() => deleteLoan(l.id)} style={{
                            padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                            background: 'rgba(248,113,113,0.1)', color: '#f87171',
                            border: '1px solid rgba(248,113,113,0.3)',
                          }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* MANAGE CREW */}
        {tab === 'crew' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <div style={S.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Add New Crew Member
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  type="text"
                  value={newCrewName}
                  onChange={e => setNewCrewName(e.target.value)}
                  placeholder="Enter crew name"
                  onKeyDown={e => e.key === 'Enter' && addCrew()}
                />
                <button onClick={addCrew} disabled={adding || !newCrewName.trim()} style={{
                  background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: adding || !newCrewName.trim() ? 0.5 : 1,
                  fontFamily: "'Barlow', sans-serif", whiteSpace: 'nowrap',
                }}>
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>

            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Crew Members ({crew.length})
                </span>
              </div>
              {crew.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No crew members yet.</div>
              ) : crew.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(30,58,82,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: c.active ? 'linear-gradient(135deg, var(--blue), var(--blue-glow))' : 'var(--navy-mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                      color: c.active ? '#fff' : 'var(--text-muted)',
                      border: c.active ? 'none' : '1px solid var(--border)',
                    }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: c.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: c.active ? '#4ade80' : 'var(--text-muted)', marginTop: 2 }}>
                        {c.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleActive(c)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                      background: c.active ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)',
                      color: c.active ? '#fbbf24' : '#4ade80',
                      border: c.active ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(34,197,94,0.3)',
                    }}>
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteCrew(c.id)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                      background: 'rgba(248,113,113,0.1)', color: '#f87171',
                      border: '1px solid rgba(248,113,113,0.3)',
                    }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}