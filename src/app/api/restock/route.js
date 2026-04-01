import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { data, error } = await supabase
    .from('restock_log')
    .select('*')
    .order('restocked_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const body = await request.json()
  const { product_id, product_name, quantity, cost, restocked_at } = body

  // Insert restock record
  const { error: insertError } = await supabase.from('restock_log').insert({
    product_id, product_name, quantity, cost, restocked_at,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Auto-add to current stock
  const { data: product } = await supabase
    .from('products')
    .select('qty')
    .eq('id', product_id)
    .single()

  if (product) {
    await supabase.from('products').update({
      qty: product.qty + quantity,
      updated_at: new Date().toISOString(),
    }).eq('id', product_id)

    await supabase.from('stock_log').insert({
      product_id,
      action: 'Restocked',
      prev_qty: product.qty,
      new_qty: product.qty + quantity,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { id } = await request.json()
  const { error } = await supabase.from('restock_log').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}