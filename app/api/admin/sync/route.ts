import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken, isAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { parseIPLExcel } from '@/lib/excel-parser'

// POST /api/admin/sync — parse Excel, return preview
export async function POST(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const parsed = parseIPLExcel(buffer)

    // Fetch current blok→id map untuk preview matching
    const supabase = createServerClient()
    const { data: existingResidents } = await supabase
      .from('residents')
      .select('id, blok, name, mobile, role')

    const blokMap = new Map((existingResidents ?? []).map(r => [r.blok, r]))

    // Hitung berapa yg akan match invoice
    let matched = 0, unmatched = 0
    for (const inv of parsed.invoices) {
      if (blokMap.has(inv.blok)) matched++
      else unmatched++
    }

    return NextResponse.json({
      preview: {
        fileName: file.name,
        sheetsFound: parsed.sheetsFound,
        residents: {
          count: parsed.residents.length,
          sample: parsed.residents.slice(0, 5),
        },
        invoices: {
          count: parsed.invoices.length,
          matched,
          unmatched,
          sample: parsed.invoices.slice(0, 5),
        },
        expenses: {
          count: parsed.expenses.length,
          sample: parsed.expenses.slice(0, 5),
        },
        errors: parsed.errors,
      },
      // Encode data untuk confirm step (tanpa re-upload)
      data: {
        residents: parsed.residents,
        invoices: parsed.invoices,
        expenses: parsed.expenses,
        fileName: file.name,
      },
    })
  } catch (err) {
    console.error('Sync parse error:', err)
    return NextResponse.json({ error: 'Gagal memproses file Excel' }, { status: 500 })
  }
}

// PUT /api/admin/sync — konfirmasi dan upsert ke DB
export async function PUT(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload || !isAdmin(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { residents, invoices, expenses, fileName } = await req.json()
    const supabase = createServerClient()

    let residentsNew = 0, residentsUpdated = 0
    let invoicesNew = 0, invoicesUpdated = 0
    let expensesNew = 0, expensesUpdated = 0

    // ── 1. Upsert Residents ──────────────────────────────────────
    if (residents?.length > 0) {
      const { data: existing } = await supabase
        .from('residents')
        .select('blok, pw_hash')

      const existingMap = new Map((existing ?? []).map(r => [r.blok, r.pw_hash]))

      const toUpsert = await Promise.all(
        residents.map(async (r: { name: string; mobile: string; blok: string; web_password: string; web_active: boolean; web_role: string }) => {
          let pw_hash: string
          if (existingMap.has(r.blok) && !r.web_password) {
            // Pertahankan hash lama jika password tidak berubah
            pw_hash = existingMap.get(r.blok)!
          } else {
            pw_hash = await bcrypt.hash(r.web_password || 'rossela2026', 12)
          }

          const isNew = !existingMap.has(r.blok)
          if (isNew) residentsNew++
          else residentsUpdated++

          return {
            name: r.name,
            mobile: r.mobile,
            blok: r.blok,
            pw_hash,
            role: r.web_role || 'resident',
            is_active: r.web_active !== false,
          }
        })
      )

      await supabase
        .from('residents')
        .upsert(toUpsert, { onConflict: 'blok', ignoreDuplicates: false })
    }

    // ── 2. Build blok → resident_id map (after upsert residents) ─
    const { data: allResidents } = await supabase
      .from('residents')
      .select('id, blok')
    const blokToId = new Map((allResidents ?? []).map(r => [r.blok, r.id]))

    // ── 3. Upsert Invoices ───────────────────────────────────────
    if (invoices?.length > 0) {
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('invoice_number')
      const existingSet = new Set((existingInv ?? []).map(i => i.invoice_number))

      const toUpsert = invoices.map((inv: { invoice_number: string; invoice_date: string | null; month_period: string; year_period: string; resident_name: string; blok: string; amount_total: number; amount_due: number; status: string }) => {
        if (existingSet.has(inv.invoice_number)) invoicesUpdated++
        else invoicesNew++

        return {
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          month_period: inv.month_period,
          year_period: inv.year_period,
          resident_name: inv.resident_name,
          blok: inv.blok,
          amount_total: inv.amount_total,
          amount_due: inv.amount_due,
          status: inv.status,
          resident_id: blokToId.get(inv.blok) ?? null,
        }
      })

      await supabase
        .from('invoices')
        .upsert(toUpsert, { onConflict: 'invoice_number', ignoreDuplicates: false })
    }

    // ── 4. Upsert Expenses ───────────────────────────────────────
    if (expenses?.length > 0) {
      const { data: existingExp } = await supabase
        .from('expenses')
        .select('bill_number')
      const existingSet = new Set((existingExp ?? []).map(e => e.bill_number))

      const toUpsert = expenses.map((exp: { bill_number: string; bill_date: string | null; due_date: string | null; vendor_name: string; description: string; amount_total: number; amount_due: number; payment_status: string }) => {
        if (existingSet.has(exp.bill_number)) expensesUpdated++
        else expensesNew++

        return {
          bill_number: exp.bill_number,
          bill_date: exp.bill_date,
          due_date: exp.due_date,
          vendor_name: exp.vendor_name,
          description: exp.description,
          amount_total: exp.amount_total,
          amount_due: exp.amount_due,
          payment_status: exp.payment_status,
        }
      })

      await supabase
        .from('expenses')
        .upsert(toUpsert, { onConflict: 'bill_number', ignoreDuplicates: false })
    }

    // ── 5. Save sync log ─────────────────────────────────────────
    await supabase.from('sync_logs').insert({
      synced_by: payload.name,
      file_name: fileName,
      residents_new: residentsNew,
      residents_updated: residentsUpdated,
      invoices_new: invoicesNew,
      invoices_updated: invoicesUpdated,
      expenses_new: expensesNew,
      expenses_updated: expensesUpdated,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      result: {
        residents: { new: residentsNew, updated: residentsUpdated },
        invoices: { new: invoicesNew, updated: invoicesUpdated },
        expenses: { new: expensesNew, updated: expensesUpdated },
      },
    })
  } catch (err) {
    console.error('Sync confirm error:', err)
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 })
  }
}
