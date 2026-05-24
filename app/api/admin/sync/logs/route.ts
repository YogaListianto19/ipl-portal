import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .order('sync_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil log sync' }, { status: 500 })
  }

  return NextResponse.json({ logs: data })
}
