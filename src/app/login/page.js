'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Barlow', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', border: '1px solid rgba(46,141,232,0.08)',
        top: -100, left: -100, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%', border: '1px solid rgba(46,141,232,0.06)',
        bottom: -50, right: -50, pointerEvents: 'none'
      }} />

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/alagad-logo.png"
            alt="Alagad Carwash"
            style={{
              width: 220,
              height: 100,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 12px',
            }}
          />
          <div style={{
            width: 40, height: 2,
            background: 'linear-gradient(90deg, var(--blue), var(--blue-glow))',
            margin: '0 auto', borderRadius: 2
          }} />
          <div style={{
            fontSize: 12, color: 'var(--text-muted)',
            marginTop: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Inventory Management System
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: 'var(--text-secondary)', marginBottom: 8,
              letterSpacing: '0.08em', textTransform: 'uppercase'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@alagadcarwash.com"
              style={{
                width: '100%',
                background: 'var(--navy-mid)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: "'Barlow', sans-serif",
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: 'var(--text-secondary)', marginBottom: 8,
              letterSpacing: '0.08em', textTransform: 'uppercase'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                background: 'var(--navy-mid)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: "'Barlow', sans-serif",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,50,50,0.1)',
              border: '1px solid rgba(220,50,50,0.3)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#f87171'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '13px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Barlow', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}