import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { ProfilClient } from './ProfilClient'
import type { Resident, Invoice } from '@/lib/types'

export default async function ProfilPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const supabase = createServerClient()

  const [{ data: resident }, { data: invoices }] = await Promise.all([
    supabase.from('residents').select('*').eq('id', payload.sub).single(),
    supabase
      .from('invoices')
      .select('*')
      .eq('resident_id', payload.sub)
      .order('year_period', { ascending: false })
      .order('month_period', { ascending: false }),
  ])

  if (!resident) redirect('/login')

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
      <ProfilClient resident={resident as Resident} invoices={(invoices ?? []) as Invoice[]} />
      <Footer />
      <BottomNav role={payload.role} />
    </div>
  )
}
