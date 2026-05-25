import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

const DEFAULT_PASSWORD = 'rossela2026'
const VALID_ROLES = ['resident', 'admin', 'treasurer', 'chairman']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createServerClient()

  const { data: resident, error: resErr } = await supabase
    .from('residents')
    .select('*')
    .eq('id', id)
    .single()

  if (resErr || !resident) {
    return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 })
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('resident_id', id)
    .order('year_period', { ascending: false })
    .order('month_period', { ascending: false })

  return NextResponse.json({ resident, invoices: invoices ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json() as { action: string; value?: string }
  const supabase = createServerClient()

  let update: Record<string, unknown>

  if (body.action === 'toggle_active') {
    const { data } = await supabase.from('residents').select('is_active').eq('id', id).single()
    update = { is_active: !data?.is_active }
  } else if (body.action === 'change_role') {
    if (!body.value || !VALID_ROLES.includes(body.value)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    update = { role: body.value }
  } else if (body.action === 'reset_password') {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    update = { pw_hash: hash, pw_locked: false }
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const { error } = await supabase.from('residents').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
