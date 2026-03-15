'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/sales', label: 'New Sale', icon: '＋' },
  { href: '/usage', label: 'Use Chemical', icon: '⚗' },
  { href: '/history', label: 'History', icon: '☰' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 220,
      background: 'var(--navy-mid)',
      borderRight: '1px solid var(--border)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Barlow', sans-serif",
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <img
          src="/alagad-logo-ver-2.jpg"
          alt="Alagad Carwash"
          style={{
            width: 160,
            height: 70,
            objectFit: 'contain',
          }}
        />
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          Inventory System
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {links.map(link => {
          const active = pathname === link.href
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--blue-glow)' : 'var(--text-secondary)',
              background: active ? 'rgba(46,141,232,0.12)' : 'transparent',
              border: active ? '1px solid rgba(46,141,232,0.2)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 10,
          fontSize: 14,
          color: '#f87171',
          background: 'transparent',
          border: '1px solid transparent',
          cursor: 'pointer',
          fontFamily: "'Barlow', sans-serif",
          transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: 16 }}>⏻</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}