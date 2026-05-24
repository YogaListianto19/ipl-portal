import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { SyncClient } from './SyncClient'
import type { SyncLog } from '@/lib/types'

export default async function SyncPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  const supabase = createServerClient()
  const { data: logs } = await supabase
    .from('sync_logs')
    .select('*')
    .order('sync_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
      <SyncClient logs={(logs ?? []) as SyncLog[]} />
    </div>
  )
}
