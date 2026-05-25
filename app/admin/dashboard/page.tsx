import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  const supabase = createServerClient()

  const [{ data: residents }, { data: invoiceSummary }, { data: lastSync }] = await Promise.all([
    supabase.from('residents').select('*').order('blok'),
    supabase.from('invoices').select('resident_id, status, amount_due, amount_total'),
    supabase.from('sync_logs').select('sync_at, file_name, status').order('sync_at', { ascending: false }).limit(1),
  ])

  // Build summary per resident
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

  const residentsWithSummary = (residents ?? []).map(r => ({
    ...r,
    summary: summaryMap.get(r.id) ?? { total: 0, paid: 0, unpaid: 0, totalDue: 0 },
  }))

  const totalBlokDue = residentsWithSummary.reduce((s, r) => s + r.summary.totalDue, 0)
  const withDebt = residentsWithSummary.filter(r => r.summary.unpaid > 0).length

  return (
    <AdminDashboardClient
      residents={residentsWithSummary}
      totalDue={totalBlokDue}
      withDebt={withDebt}
      lastSync={lastSync?.[0] ?? null}
    />
  )
}
