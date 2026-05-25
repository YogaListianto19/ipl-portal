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

  type InvSummary = { total: number; paid: number; unpaid: number; totalDue: number }
  const emptySummary = (): InvSummary => ({ total: 0, paid: 0, unpaid: 0, totalDue: 0 })

  const [
    { data: residents },
    { data: iplRows },
    { data: kasRows },
    { data: lastSync },
  ] = await Promise.all([
    supabase.from('residents').select('*').order('blok'),
    supabase.from('invoices').select('resident_id, blok, status, amount_due, amount_total'),
    supabase.from('kas_invoices').select('blok, status, amount_due, amount_total'),
    supabase.from('sync_logs').select('sync_at, file_name, status').order('sync_at', { ascending: false }).limit(1),
  ])

  // IPL summary — by resident_id (fall back to blok)
  const iplById = new Map<string, InvSummary>()
  for (const inv of iplRows ?? []) {
    const key = inv.resident_id ?? inv.blok
    if (!key) continue
    const curr = iplById.get(key) ?? emptySummary()
    curr.total++
    if (inv.status === 'Paid') curr.paid++
    else { curr.unpaid++; curr.totalDue += Number(inv.amount_due || inv.amount_total) }
    iplById.set(key, curr)
  }

  // Kas summary — by blok
  const kasByBlok = new Map<string, InvSummary>()
  for (const inv of kasRows ?? []) {
    if (!inv.blok) continue
    const curr = kasByBlok.get(inv.blok) ?? emptySummary()
    curr.total++
    if (inv.status === 'Paid') curr.paid++
    else { curr.unpaid++; curr.totalDue += Number(inv.amount_due || inv.amount_total) }
    kasByBlok.set(inv.blok, curr)
  }

  const residentsWithSummary = (residents ?? []).map(r => ({
    ...r,
    ipl: iplById.get(r.id) ?? iplById.get(r.blok) ?? emptySummary(),
    kas: kasByBlok.get(r.blok) ?? emptySummary(),
  }))

  const totalIplDue = residentsWithSummary.reduce((s, r) => s + r.ipl.totalDue, 0)
  const totalKasDue = residentsWithSummary.reduce((s, r) => s + r.kas.totalDue, 0)
  const withDebt = residentsWithSummary.filter(r => r.ipl.unpaid > 0 || r.kas.unpaid > 0).length

  return (
    <AdminDashboardClient
      residents={residentsWithSummary}
      totalIplDue={totalIplDue}
      totalKasDue={totalKasDue}
      withDebt={withDebt}
      lastSync={lastSync?.[0] ?? null}
    />
  )
}
