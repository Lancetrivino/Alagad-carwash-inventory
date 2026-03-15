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
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { width: '100%', background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: "'Barlow', sans-serif" },
}

export default function SalesPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchProducts()
    })
  }, [])

  async function fetchProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.filter(p => p.qty > 0))
  }

  const product = products.find(p => p.id === parseInt(selectedProduct))
  const total = product ? product.price * quantity : 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!product) return
    if (quantity > product.qty) { setError(`Only ${product.qty} units available`); return }
    setLoading(true); setError('')
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName, product_id: product.id, product_name: product.name, quantity, unit_price: product.price, total }),
    })
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, qty: product.qty - quantity, action: 'Sold', prev_qty: product.qty }),
    })
    setSuccess(true); setCustomerName(''); setSelectedProduct(''); setQuantity(1); setLoading(false)
    fetchProducts()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div>
          <div style={S.heading}>New Sale</div>
          <div style={S.sub}>Record a chemical purchase</div>
        </div>

        <div style={{ ...S.card, maxWidth: 500 }}>
          {success && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', marginBottom: 20 }}>
              Sale recorded successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={S.label}>Customer Name</label>
              <input style={S.input} type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="Enter customer name" />
            </div>

            <div>
              <label style={S.label}>Chemical</label>
              <select style={{ ...S.input, appearance: 'none' }} value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setQuantity(1) }} required>
                <option value="">Select a chemical</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — ₱{p.price?.toLocaleString()} ({p.qty} left)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={S.label}>Quantity</label>
              <input style={S.input} type="number" min="1" max={product?.qty || 1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} required />
              {product && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{product.qty} units available</div>}
            </div>

            {product && (
              <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <span>Unit Price</span><span>₱{product.price?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <span>Quantity</span><span>{quantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--blue-glow)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <span>Total</span><span>₱{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}

            <button type="submit" disabled={loading || !product} style={{
              background: 'linear-gradient(135deg, var(--blue), var(--blue-glow))',
              color: '#fff', border: 'none', borderRadius: 10, padding: '13px',
              fontSize: 14, fontWeight: 700, cursor: loading || !product ? 'not-allowed' : 'pointer',
              opacity: loading || !product ? 0.5 : 1,
              fontFamily: "'Barlow', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {loading ? 'Recording...' : 'Record Sale'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}