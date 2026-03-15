'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

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
    if (quantity > product.qty) {
      setError(`Only ${product.qty} units available`)
      return
    }

    setLoading(true)
    setError('')

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total,
      }),
    })

    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: product.id,
        qty: product.qty - quantity,
        action: 'Sold',
        prev_qty: product.qty,
      }),
    })

    setSuccess(true)
    setCustomerName('')
    setSelectedProduct('')
    setQuantity(1)
    setLoading(false)
    fetchProducts()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">New Sale</h1>
          <p className="text-sm text-gray-500">Record a chemical purchase</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Sale recorded successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required
                placeholder="Enter customer name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

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
                    {p.name} — ₱{p.price?.toLocaleString()} ({p.qty} left)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
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

            {product && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Unit Price</span>
                  <span>₱{product.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Quantity</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || !product}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Sale'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}