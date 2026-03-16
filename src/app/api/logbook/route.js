import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { data, error } = await supabase
    .from('logbook')
    .select('*')
    .order('logged_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const body = await request.json()
  const { error } = await supabase.from('logbook').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.plate_no) {
    const visitDate = new Date(body.logged_at).toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('plate_no', body.plate_no)
      .single()

    if (existing) {
      await supabase.from('customers').update({
        vehicle_name: body.vehicle_name,
        vehicle_size: body.vehicle_size,
        last_visit: visitDate,
        total_visits: existing.total_visits + 1,
        total_spent: existing.total_spent + body.total,
      }).eq('plate_no', body.plate_no)
    } else {
      await supabase.from('customers').insert({
        plate_no: body.plate_no,
        vehicle_name: body.vehicle_name,
        vehicle_size: body.vehicle_size,
        first_visit: visitDate,
        last_visit: visitDate,
        total_visits: 1,
        total_spent: body.total,
      })
    }
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const body = await request.json()

  // Mark as paid
  if (body.markPaid) {
    const { error } = await supabase
      .from('logbook')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Regular stock adjust (from dashboard)
  const { id, qty, action, prev_qty } = body
  const { error: updateError } = await supabase
    .from('logbook')
    .update({ qty, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { id } = await request.json()
  const { error } = await supabase.from('logbook').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}