import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

const DEFAULT_PASSWORD = 'rossela2026'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient()

  const { data: residents, error } = await supabase
    .from('residents')
    .select('*')
    .order('blok', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data warga' }, { status: 500 })
  }

  // Ambil summary invoice per resident
  const { data: invoiceSummary } = await supabase
    .from('invoices')
    .select('resident_id, status, amount_due, amount_total')

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

  const result = residents.map(r => ({
    ...r,
    summary: summaryMap.get(r.id) ?? { total: 0, paid: 0, unpaid: 0, totalDue: 0 },
  }))

  return NextResponse.json({ residents: result })
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    name: string
    blok: string
    mobile: string
    role: string
    password?: string
    is_active: boolean
  }

  if (!body.name?.trim() || !body.blok?.trim() || !body.mobile?.trim()) {
    return NextResponse.json({ error: 'Nama, unit, dan nomor WA wajib diisi' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Check duplicate blok
  const { data: existing } = await supabase
    .from('residents')
    .select('id')
    .eq('blok', body.blok.trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: `Unit ${body.blok} sudah terdaftar` }, { status: 409 })
  }

  const plain = body.password?.trim() || DEFAULT_PASSWORD
  const pw_hash = await bcrypt.hash(plain, 12)

  const { data, error } = await supabase
    .from('residents')
    .insert({
      name:      body.name.trim(),
      blok:      body.blok.trim(),
      mobile:    body.mobile.trim(),
      role:      body.role || 'resident',
      is_active: body.is_active ?? true,
      pw_hash,
      pw_locked: false,
    })
    .select('id, name, blok, mobile, role, is_active, pw_locked')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ resident: data }, { status: 201 })
}
