import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient()

  const { data: residents, error } = await supabase
    .from('residents')
    .select('*')
    .order('blok', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data warga' }, { status: 500 })
  }

  // Ambil summary invoice per resident
  const { data: invoiceSummary } = await supabase
    .from('invoices')
    .select('resident_id, status, amount_due, amount_total')

  const summaryMap = new Map<string, { total: number; paid: number; unpaid: number; totalDue: number }>()
  for (const inv of invoiceSummary ?? []) {
    if (!inv.resident_id) continue
    const curr = summaryMap.get(inv.resident_id) ?? { total: 0, paid: 0, unpaid: 0, totalDue: 0 }
    curr.total++
    if (inv.status === 'Paid') curr.paid++
    else {
      curr.unpaid++
      curr.totalDue += Number(inv.amount_due || inv.amount_total)
    }
    summaryMap.set(inv.resident_id, curr)
  }

  const result = residents.map(r => ({
    ...r,
    summary: summaryMap.get(r.id) ?? { total: 0, paid: 0, unpaid: 0, totalDue: 0 },
  }))

  return NextResponse.json({ residents: result })
}
