'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function Dashboard() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchProducts()
    })
  }, [])

  async function fetchProducts() {
    const res = await fetch('/api/products')
    setProducts(await res.json())
    setLoading(false)
  }

  async function adjust(product, delta) {
    const newQty = Math.max(0, product.qty + delta)
    if (newQty === product.qty) return
    const action = delta > 0 ? 'Restocked' : 'Sold'
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, qty: newQty } : p))
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, qty: newQty, action, prev_qty: product.qty }),
    })
    fetchProducts()
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Chemical stock overview</p>
        </div>

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
                        <button onClick={() => adjust(p, -1)} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center">−</button>
                        <span className="w-7 text-center font-semibold text-gray-800">{p.qty}</span>
                        <button onClick={() => adjust(p, +1)} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center">+</button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {p.price ? `₱${(p.price * p.qty).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center"><StatusBadge qty={p.qty} /></td>
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