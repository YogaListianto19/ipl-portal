import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export default async function AdminUsersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  const supabase = createServerClient()
  const { data: residents } = await supabase
    .from('residents')
    .select('id, name, blok, mobile, role, is_active, pw_locked')
    .order('blok')

  return <UsersClient residents={residents ?? []} />
}
