import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { PengeluaranClient } from './PengeluaranClient'
import type { Expense } from '@/lib/types'

export default async function PengeluaranPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const supabase = createServerClient()
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('bill_date', { ascending: false })

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
      <PengeluaranClient expenses={(expenses ?? []) as Expense[]} />
      <Footer />
      <BottomNav role={payload.role} />
    </div>
  )
}
