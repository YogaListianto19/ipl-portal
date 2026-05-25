import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { PengeluaranKasClient } from './PengeluaranKasClient'
import type { KasExpense } from '@/lib/types'

export default async function PengeluaranKasPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const supabase = createServerClient()

  const { data: kasExpenses } = await supabase
    .from('kas_expenses')
    .select('*')
    .order('bill_date', { ascending: false })

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar name={payload.name} blok={payload.blok} role={payload.role} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
        <PengeluaranKasClient kasExpenses={(kasExpenses ?? []) as KasExpense[]} />
        <Footer />
        <BottomNav role={payload.role} />
      </div>
    </div>
  )
}
