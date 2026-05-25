import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Home, ShieldCheck, FileText, Receipt, CheckCircle2, XCircle } from 'lucide-react'
import { verifyToken, isAdmin, roleLabel } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, monthIndo, monthOrder } from '@/lib/format'
import type { Invoice, KasInvoice } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  const { id } = await params
  const supabase = createServerClient()

  const { data: resident } = await supabase.from('residents').select('*').eq('id', id).single()
  if (!resident) notFound()

  const [{ data: iplRaw }, { data: kasRaw }] = await Promise.all([
    supabase.from('invoices')
      .select('*').eq('blok', resident.blok)
      .order('year_period', { ascending: false })
      .order('month_period', { ascending: false }),
    supabase.from('kas_invoices')
      .select('*').eq('blok', resident.blok)
      .order('year_period', { ascending: false })
      .order('month_period', { ascending: false }),
  ])

  const iplInvoices = (iplRaw ?? []) as Invoice[]
  const kasInvoices = (kasRaw ?? []) as KasInvoice[]

  const iplPaid   = iplInvoices.filter(i => i.status === 'Paid').length
  const iplUnpaid = iplInvoices.filter(i => i.status !== 'Paid').length
  const iplDue    = iplInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0)
  const kasPaid   = kasInvoices.filter(i => i.status === 'Paid').length
  const kasUnpaid = kasInvoices.filter(i => i.status !== 'Paid').length
  const kasDue    = kasInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0)

  function groupByYear<T extends { year_period: string; month_period: string }>(items: T[]) {
    const map = new Map<string, T[]>()
    for (const inv of items) {
      const arr = map.get(inv.year_period) ?? []
      arr.push(inv)
      map.set(inv.year_period, arr)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, invs]) => ({
        year,
        invoices: [...invs].sort((a, b) => monthOrder(b.month_period) - monthOrder(a.month_period)),
      }))
  }

  const iplGroups = groupByYear(iplInvoices)
  const kasGroups = groupByYear(kasInvoices)

  const initials = resident.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')

  return (
    <main className="max-w-xl mx-auto lg:max-w-5xl px-4 py-5 pb-24 lg:pb-8 space-y-5">

      {/* Back */}
      <Link href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      {/* ── Resident Header Card ─────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">

        {/* Top band */}
        <div className="bg-linear-to-r from-rose-600 to-pink-500 px-5 pt-5 pb-8" />

        {/* Avatar + info */}
        <div className="px-5 pb-4 -mt-6">
          <div className="flex items-end gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 border-2 border-white">
              <span className="text-lg font-bold text-rose-600">{initials}</span>
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground leading-tight">{resident.name}</h1>
                {resident.role !== 'resident' && (
                  <Badge className="text-[10px] h-4 shrink-0">
                    <ShieldCheck className="w-3 h-3 mr-0.5" />{roleLabel(resident.role)}
                  </Badge>
                )}
                {!resident.is_active && (
                  <Badge variant="destructive" className="text-[10px] h-4 shrink-0">Nonaktif</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Home className="w-3 h-3" />{resident.blok}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{resident.mobile}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* IPL + Kas summary — 2 col */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryBox
              title="Tagihan IPL" icon={<FileText className="w-3.5 h-3.5 text-rose-500" />}
              total={iplInvoices.length} paid={iplPaid} unpaid={iplUnpaid} due={iplDue}
              color="rose"
            />
            <SummaryBox
              title="Tagihan Kas" icon={<Receipt className="w-3.5 h-3.5 text-violet-500" />}
              total={kasInvoices.length} paid={kasPaid} unpaid={kasUnpaid} due={kasDue}
              color="violet"
            />
          </div>

          {(iplDue + kasDue) > 0 && (
            <div className="mt-3 px-4 py-2.5 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
              <span className="text-sm text-red-700 font-medium">Total Tunggakan</span>
              <span className="text-sm font-bold text-red-600">{formatRupiah(iplDue + kasDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2-Column History ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* IPL History */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-rose-50/60 border-b border-rose-100/70">
            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
            <h2 className="text-sm font-bold text-foreground">Riwayat Tagihan IPL</h2>
            <span className="ml-auto text-xs text-muted-foreground">{iplInvoices.length} tagihan</span>
          </div>
          <div className="p-3 space-y-4 max-h-150 overflow-y-auto">
            {iplGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada tagihan IPL</p>
            ) : iplGroups.map(({ year, invoices }) => (
              <YearGroup
                key={year} year={year} invoices={invoices}
                paidColor="bg-emerald-100" unpaidColor="bg-red-100"
                iconPaid={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                iconUnpaid={<XCircle className="w-3.5 h-3.5 text-red-500" />}
                rowUnpaid="border-red-200/70 bg-red-50/40"
                amountUnpaidColor="text-red-500"
              />
            ))}
          </div>
        </div>

        {/* Kas History */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-violet-50/60 border-b border-violet-100/70">
            <Receipt className="w-4 h-4 text-violet-500 shrink-0" />
            <h2 className="text-sm font-bold text-foreground">Riwayat Tagihan Kas</h2>
            <span className="ml-auto text-xs text-muted-foreground">{kasInvoices.length} tagihan</span>
          </div>
          <div className="p-3 space-y-4 max-h-150 overflow-y-auto">
            {kasGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada tagihan kas</p>
            ) : kasGroups.map(({ year, invoices }) => (
              <YearGroup
                key={year} year={year} invoices={invoices}
                paidColor="bg-emerald-100" unpaidColor="bg-violet-100"
                iconPaid={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                iconUnpaid={<XCircle className="w-3.5 h-3.5 text-violet-500" />}
                rowUnpaid="border-violet-200/70 bg-violet-50/40"
                amountUnpaidColor="text-violet-600"
              />
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function SummaryBox({
  title, icon, total, paid, unpaid, due, color,
}: {
  title: string; icon: React.ReactNode
  total: number; paid: number; unpaid: number; due: number
  color: 'rose' | 'violet'
}) {
  const hasDebt = due > 0
  return (
    <div className={cn(
      'p-3 rounded-xl border',
      hasDebt
        ? color === 'rose' ? 'bg-rose-50/70 border-rose-200' : 'bg-violet-50/70 border-violet-200'
        : 'bg-muted/30 border-border/40'
    )}>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon}
        <p className="text-xs font-bold text-foreground">{title}</p>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-xl font-bold text-foreground">{total}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div>
          <p className="text-xl font-bold text-emerald-600">{paid}</p>
          <p className="text-[10px] text-muted-foreground">Lunas</p>
        </div>
        <div>
          <p className={cn('text-xl font-bold', unpaid > 0
            ? color === 'rose' ? 'text-red-600' : 'text-violet-600'
            : 'text-foreground'
          )}>{unpaid}</p>
          <p className="text-[10px] text-muted-foreground">Belum</p>
        </div>
      </div>
      {due > 0 && (
        <p className={cn(
          'text-xs font-semibold mt-2 text-center',
          color === 'rose' ? 'text-red-600' : 'text-violet-600'
        )}>{formatRupiah(due)}</p>
      )}
    </div>
  )
}

function YearGroup({
  year, invoices, paidColor, unpaidColor,
  iconPaid, iconUnpaid, rowUnpaid, amountUnpaidColor,
}: {
  year: string
  invoices: (Invoice | KasInvoice)[]
  paidColor: string; unpaidColor: string
  iconPaid: React.ReactNode; iconUnpaid: React.ReactNode
  rowUnpaid: string; amountUnpaidColor: string
}) {
  const paidCount = invoices.filter(i => i.status === 'Paid').length
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-muted-foreground">{year}</span>
        <Separator className="flex-1" />
        <span className="text-[11px] text-muted-foreground">{paidCount}/{invoices.length}</span>
      </div>
      <div className="space-y-1.5">
        {invoices.map(inv => {
          const isPaid = inv.status === 'Paid'
          return (
            <div key={inv.id} className={cn(
              'flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors',
              isPaid ? 'border-border/40 bg-background' : rowUnpaid
            )}>
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', isPaid ? paidColor : unpaidColor)}>
                {isPaid ? iconPaid : iconUnpaid}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {monthIndo(inv.month_period)} {inv.year_period}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{inv.invoice_number}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-foreground">{formatRupiah(inv.amount_total)}</p>
                {!isPaid && inv.amount_due > 0 && (
                  <p className={cn('text-[10px]', amountUnpaidColor)}>sisa {formatRupiah(inv.amount_due)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
