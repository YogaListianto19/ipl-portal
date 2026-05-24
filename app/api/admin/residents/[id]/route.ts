import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()

  const { data: resident, error: resErr } = await supabase
    .from('residents')
    .select('*')
    .eq('id', id)
    .single()

  if (resErr || !resident) {
    return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 })
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('resident_id', id)
    .order('year_period', { ascending: false })
    .order('month_period', { ascending: false })

  return NextResponse.json({ resident, invoices: invoices ?? [] })
}
