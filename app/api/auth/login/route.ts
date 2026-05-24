import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { signToken, COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { mobile, password } = await req.json()

    if (!mobile || !password) {
      return NextResponse.json({ error: 'Nomor HP dan password wajib diisi' }, { status: 400 })
    }

    // Normalisasi: hapus spasi & tanda hubung, ganti +62 → 0
    const normalizedMobile = mobile
      .trim()
      .replace(/[\s\-]/g, '')
      .replace(/^\+62/, '0')

    const supabase = createServerClient()

    // Cari dengan nomor yang sudah tersimpan di DB (bisa format apapun)
    // Strategi: load semua resident lalu bandingkan setelah normalisasi
    const { data: residents } = await supabase
      .from('residents')
      .select('id, name, blok, mobile, pw_hash, role, is_active')

    const resident = (residents ?? []).find(r => {
      const stored = r.mobile?.trim().replace(/[\s\-]/g, '').replace(/^\+62/, '0') ?? ''
      return stored === normalizedMobile
    })

    if (!resident) {
      return NextResponse.json({ error: 'Nomor HP atau password salah' }, { status: 401 })
    }

    if (!resident.is_active) {
      return NextResponse.json({ error: 'Akun Anda belum aktif. Hubungi pengurus.' }, { status: 403 })
    }

    const passwordMatch = await bcrypt.compare(password, resident.pw_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Nomor HP atau password salah' }, { status: 401 })
    }

    const token = signToken({
      sub: resident.id,
      name: resident.name,
      blok: resident.blok,
      role: resident.role,
    })

    const res = NextResponse.json({ success: true, role: resident.role })
    res.cookies.set(COOKIE.name, token, COOKIE.options)
    return res
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
