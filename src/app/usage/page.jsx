'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function UsagePage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [usageLog, setUsageLog] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [usedAt, setUsedAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else { fetchProducts(); fetchUsage() }
    })
  }, [])

  async function fetchProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.filter(p => p.qty > 0))
  }

  async function fetchUsage() {
    const res = await fetch('/api/usage')
    setUsageLog(await res.json())
  }

  const product = products.find(p => p.id === parseInt(selectedProduct))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!product) return
    if (quantity > product.qty) {
      setError(`Only ${product.qty} units available`)
      return
    }

    setLoading(true)
    setError('')

    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        product_name: product.name,
        quantity,
        used_at: usedAt,
      }),
    })

    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: product.id,
        qty: product.qty - quantity,
        action: 'Used',
        prev_qty: product.qty,
      }),
    })

    setSuccess(true)
    setSelectedProduct('')
    setQuantity(1)
    setUsedAt(new Date().toISOString().split('T')[0])
    setLoading(false)
    fetchProducts()
    fetchUsage()
    setTimeout(() => setSuccess(false), 3000)
  }

  // Filter logic
  const now = new Date()
  const filtered = usageLog.filter(u => {
    const date = new Date(u.used_at)
    if (filter === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      return date >= weekAgo
    }
    if (filter === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }
    return true
  })

  // Group by product for summary
  const summary = filtered.reduce((acc, u) => {
    acc[u.product_name] = (acc[u.product_name] || 0) + u.quantity
    return acc
  }, {})

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chemical Usage</h1>
          <p className="text-sm text-gray-500">Log chemicals used for car wash services</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Log Usage</h2>

            {success && (
              <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                Usage logged successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chemical</label>
                <select
                  value={selectedProduct}
                  onChange={e => { setSelectedProduct(e.target.value); setQuantity(1) }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="">Select a chemical</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.qty} left)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Used</label>
                <input
                  type="number"
                  min="1"
                  max={product?.qty || 1}
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
                {product && (
                  <p className="text-xs text-gray-400 mt-1">{product.qty} units available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Used</label>
                <input
                  type="date"
                  value={usedAt}
                  onChange={e => setUsedAt(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading || !product}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging...' : 'Log Usage'}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700">Usage Summary</h2>
              <div className="flex gap-1">
                {['all', 'month', 'week'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'All time' : f === 'month' ? 'This month' : 'This week'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {Object.keys(summary).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No usage recorded yet.</p>
              ) : (
                Object.entries(summary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{name}</span>
                      <span className="text-sm font-semibold text-gray-900">{qty} units</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Usage Log Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Usage Log</h2>
            <div className="flex gap-1">
              {['all', 'month', 'week'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All time' : f === 'month' ? 'This month' : 'This week'}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No usage records found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Chemical</th>
                  <th className="text-center px-5 py-3 font-medium">Qty Used</th>
                  <th className="text-right px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{u.product_name}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{u.quantity}</td>
                    <td className="px-5 py-3 text-right text-gray-400">
                      {new Date(u.used_at).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}