import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { TagihanKasClient } from './TagihanKasClient'
import type { KasInvoice } from '@/lib/types'

export default async function TagihanKasPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const supabase = createServerClient()

  const { data: kasInvoices } = await supabase
    .from('kas_invoices')
    .select('*')
    .eq('blok', payload.blok)
    .order('year_period', { ascending: false })
    .order('month_period', { ascending: false })

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar name={payload.name} blok={payload.blok} role={payload.role} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
        <TagihanKasClient kasInvoices={(kasInvoices ?? []) as KasInvoice[]} blok={payload.blok} />
        <Footer />
        <BottomNav role={payload.role} />
      </div>
    </div>
  )
}
