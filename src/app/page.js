'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [products, setProducts] = useState([])
  const [log, setLog] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    const [pRes, lRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/log'),
    ])
    setProducts(await pRes.json())
    setLog(await lRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function adjust(product, delta) {
    const newQty = Math.max(0, product.qty + delta)
    if (newQty === product.qty) return
    const action = delta > 0 ? 'Restocked' : 'Sold'

    setProducts(prev =>
      prev.map(p => p.id === product.id ? { ...p, qty: newQty } : p)
    )

    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: product.id,
        qty: newQty,
        action,
        prev_qty: product.qty,
      }),
    })

    fetchAll()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = products.reduce((s, p) => s + (p.price ? p.price * p.qty : 0), 0)
  const lowStock = products.filter(p => p.qty <= 2).length

  function StatusBadge({ qty }) {
    if (qty === 0) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Out</span>
    if (qty <= 2) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Low</span>
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">OK</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Alagad Carwash</h1>
        <p className="text-sm text-gray-500">Chemical Inventory</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Products</p>
            <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Inventory Value</p>
            <p className="text-lg font-semibold text-gray-900">₱{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Low / Out of Stock</p>
            <p className="text-2xl font-semibold text-red-500">{lowStock}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Stock List</h2>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 w-44"
            />
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-10 text-sm">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-center px-5 py-3 font-medium">Qty</th>
                  <th className="text-right px-5 py-3 font-medium">Value</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {p.price ? `₱${p.price.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => adjust(p, -1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base leading-none"
                        >−</button>
                        <span className="w-7 text-center font-semibold text-gray-800">{p.qty}</span>
                        <button
                          onClick={() => adjust(p, +1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base leading-none"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {p.price ? `₱${(p.price * p.qty).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge qty={p.qty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {log.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-4">No activity yet.</p>
            ) : (
              log.map(l => (
                <div key={l.id} className="flex justify-between items-center px-5 py-3">
                  <div>
                    <span className={`text-xs font-medium mr-2 px-2 py-0.5 rounded-full ${l.action === 'Sold' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {l.action}
                    </span>
                    <span className="text-sm text-gray-700">{l.products?.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{l.prev_qty} → {l.new_qty}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(l.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}