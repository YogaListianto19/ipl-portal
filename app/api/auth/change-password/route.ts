import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: resident } = await supabase
    .from('residents')
    .select('pw_hash')
    .eq('id', payload.sub)
    .single()

  if (!resident) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, resident.pw_hash)
  if (!valid) return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 })

  const newHash = await bcrypt.hash(newPassword, 12)
  await supabase
    .from('residents')
    .update({ pw_hash: newHash, pw_locked: true })
    .eq('id', payload.sub)

  return NextResponse.json({ success: true })
}
