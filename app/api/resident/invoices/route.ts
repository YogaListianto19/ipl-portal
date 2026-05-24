import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('resident_id', payload.sub)
    .order('year_period', { ascending: false })
    .order('month_period', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data tagihan' }, { status: 500 })
  }

  return NextResponse.json({ invoices: data })
}
