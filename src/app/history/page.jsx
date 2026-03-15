'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function HistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else fetchTransactions()
    })
  }, [])

  async function fetchTransactions() {
    const res = await fetch('/api/transactions')
    setTransactions(await res.json())
    setLoading(false)
  }

  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500">All recorded sales</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Sales</p>
            <p className="text-2xl font-semibold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-lg font-semibold text-green-600">₱{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">All Transactions</h2>
          </div>
          {loading ? (
            <p className="text-center text-gray-400 py-10 text-sm">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium">Chemical</th>
                  <th className="text-center px-5 py-3 font-medium">Qty</th>
                  <th className="text-right px-5 py-3 font-medium">Unit Price</th>
                  <th className="text-right px-5 py-3 font-medium">Total</th>
                  <th className="text-right px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{t.customer_name}</td>
                    <td className="px-5 py-3 text-gray-600">{t.product_name}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{t.quantity}</td>
                    <td className="px-5 py-3 text-right text-gray-500">₱{t.unit_price?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">₱{t.total?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-gray-400">
                      {new Date(t.created_at).toLocaleString('en-PH', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
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