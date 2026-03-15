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
        padding: '24px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>🚗</div>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14, fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}>Alagad</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Inventory
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(link => {
          const active = pathname === link.href
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 14, fontWeight: active ? 600 : 400,
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
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 10,
          fontSize: 14, color: '#f87171',
          background: 'transparent', border: '1px solid transparent',
          cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
          transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: 16 }}>⏻</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}