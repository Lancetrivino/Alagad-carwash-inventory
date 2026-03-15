import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('stock_log')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
