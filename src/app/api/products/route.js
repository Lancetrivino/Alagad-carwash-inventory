import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request) {
  const { id, qty, action, prev_qty } = await request.json()

  const { error: updateError } = await supabase
    .from('products')
    .update({ qty, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('stock_log').insert({
    product_id: id,
    action,
    prev_qty,
    new_qty: qty,
  })

  return NextResponse.json({ success: true })
}