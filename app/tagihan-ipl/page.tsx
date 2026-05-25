import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { TagihanIplClient } from './TagihanIplClient'
import type { Invoice } from '@/lib/types'

export default async function TagihanIplPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const supabase = createServerClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('blok', payload.blok)
    .order('year_period', { ascending: false })
    .order('month_period', { ascending: false })

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar name={payload.name} blok={payload.blok} role={payload.role} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
        <TagihanIplClient invoices={(invoices ?? []) as Invoice[]} blok={payload.blok} />
        <Footer />
        <BottomNav role={payload.role} />
      </div>
    </div>
  )
}
