'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/logbook', label: 'Logbook', icon: '📋' },
  { href: '/salary', label: 'Salary', icon: '💰' },
  { href: '/customers', label: 'Customers', icon: '🚗' },
  { href: '/sales', label: 'Sales', icon: '＋' },
  { href: '/usage', label: 'Usage', icon: '⚗' },
  { href: '/history', label: 'History', icon: '☰' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLowStockCount(data.filter(p => p.qty <= 2).length)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // MOBILE — bottom tab bar
  if (isMobile) {
    const mainLinks = [
      { href: '/dashboard', label: 'Home', icon: '⊞' },
      { href: '/logbook', label: 'Logbook', icon: '📋' },
      { href: '/salary', label: 'Salary', icon: '💰' },
      { href: '/customers', label: 'Customers', icon: '🚗' },
      { href: '/history', label: 'More', icon: '☰' },
    ]
    return (
      <>
        {/* Mobile top header */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--navy-mid)', borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: "'Barlow', sans-serif",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/alagad-logo.png" alt="Alagad" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--blue)', background: '#fff', padding: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Alagad Carwash
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Inventory System
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(248,113,113,0.1)', color: '#f87171',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8,
            padding: '6px 12px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
          }}>
            Sign out
          </button>
        </div>

        {/* Bottom tab bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--navy-mid)', borderTop: '1px solid var(--border)',
          display: 'flex', fontFamily: "'Barlow', sans-serif",
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {mainLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link key={link.href} href={link.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 4px 8px', textDecoration: 'none', gap: 3,
                borderTop: active ? '2px solid var(--blue-glow)' : '2px solid transparent',
                background: active ? 'rgba(46,141,232,0.08)' : 'transparent',
              }}>
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? 'var(--blue-glow)' : 'var(--text-muted)' }}>
                  {link.label}
                </span>
                {link.href === '/dashboard' && lowStockCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, background: '#f87171', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>
                    {lowStockCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </>
    )
  }

  // DESKTOP — sidebar
  return (
    <aside style={{
      width: 220, background: 'var(--navy-mid)', borderRight: '1px solid var(--border)',
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Barlow', sans-serif", flexShrink: 0,
    }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <img src="/alagad-logo.png" alt="Alagad Carwash" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--blue)', boxShadow: '0 0 24px rgba(46,141,232,0.3)', background: '#ffffff', padding: 4 }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
          Inventory System
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(link => {
          const active = pathname === link.href
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--blue-glow)' : 'var(--text-secondary)',
              background: active ? 'rgba(46,141,232,0.12)' : 'transparent',
              border: active ? '1px solid rgba(46,141,232,0.2)' : '1px solid transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{link.icon}</span>
                {link.label}
              </div>
              {link.href === '/dashboard' && lowStockCount > 0 && (
                <span style={{ background: '#f87171', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>
                  {lowStockCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#f87171',
          background: 'transparent', border: '1px solid transparent',
          cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: 16 }}>⏻</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}