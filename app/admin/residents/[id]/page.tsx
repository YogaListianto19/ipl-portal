import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Home, ShieldCheck, FileText, Receipt } from 'lucide-react'
import { verifyToken, isAdmin, roleLabel } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatDateShort, monthIndo, monthOrder } from '@/lib/format'
import type { Invoice, KasInvoice } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  const { id } = await params
  const supabase = createServerClient()

  const { data: resident } = await supabase.from('residents').select('*').eq('id', id).single()
  if (!resident) notFound()

  // Query by blok — resident_id not pushed from Odoo
  const [{ data: iplRaw }, { data: kasRaw }] = await Promise.all([
    supabase.from('invoices')
      .select('*')
      .eq('blok', resident.blok)
      .order('year_period', { ascending: false })
      .order('month_period', { ascending: false }),
    supabase.from('kas_invoices')
      .select('*')
      .eq('blok', resident.blok)
      .order('year_period', { ascending: false })
      .order('month_period', { ascending: false }),
  ])

  const iplInvoices = (iplRaw ?? []) as Invoice[]
  const kasInvoices = (kasRaw ?? []) as KasInvoice[]

  // IPL stats
  const iplPaid   = iplInvoices.filter(i => i.status === 'Paid')
  const iplUnpaid = iplInvoices.filter(i => i.status !== 'Paid')
  const iplDue    = iplUnpaid.reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0)

  // Kas stats
  const kasPaid   = kasInvoices.filter(i => i.status === 'Paid')
  const kasUnpaid = kasInvoices.filter(i => i.status !== 'Paid')
  const kasDue    = kasUnpaid.reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0)

  // Group IPL by year
  const iplByYear = new Map<string, Invoice[]>()
  for (const inv of iplInvoices) {
    const arr = iplByYear.get(inv.year_period) ?? []
    arr.push(inv)
    iplByYear.set(inv.year_period, arr)
  }
  const iplYearGroups = Array.from(iplByYear.entries())
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, invs]) => ({
      year,
      invoices: invs.sort((a, b) => monthOrder(b.month_period) - monthOrder(a.month_period)),
    }))

  // Group Kas by year
  const kasByYear = new Map<string, KasInvoice[]>()
  for (const inv of kasInvoices) {
    const arr = kasByYear.get(inv.year_period) ?? []
    arr.push(inv)
    kasByYear.set(inv.year_period, arr)
  }
  const kasYearGroups = Array.from(kasByYear.entries())
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, invs]) => ({
      year,
      invoices: invs.sort((a, b) => monthOrder(b.month_period) - monthOrder(a.month_period)),
    }))

  return (
    <main className="max-w-xl mx-auto px-4 py-6 pb-24 lg:pb-8 space-y-5">
      {/* Back */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      {/* Resident Info Card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">
                {resident.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground">{resident.name}</h1>
                {resident.role !== 'resident' && (
                  <Badge className="text-[10px] h-4">
                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                    {roleLabel(resident.role)}
                  </Badge>
                )}
                {!resident.is_active && (
                  <Badge variant="destructive" className="text-[10px] h-4">Nonaktif</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" />{resident.blok}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{resident.mobile}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* IPL + Kas summary side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* IPL */}
            <div className={cn('p-3 rounded-xl border', iplDue > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-muted/30 border-border/40')}>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <p className="text-xs font-bold text-foreground">Tagihan IPL</p>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { label: 'Total', value: iplInvoices.length, color: '' },
                  { label: 'Lunas', value: iplPaid.length, color: 'text-emerald-600' },
                  { label: 'Belum', value: iplUnpaid.length, color: iplUnpaid.length > 0 ? 'text-red-600' : '' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={cn('text-lg font-bold', color || 'text-foreground')}>{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {iplDue > 0 && (
                <p className="text-xs text-red-600 font-semibold mt-2 text-center">{formatRupiah(iplDue)}</p>
              )}
            </div>

            {/* Kas */}
            <div className={cn('p-3 rounded-xl border', kasDue > 0 ? 'bg-violet-50/60 border-violet-200' : 'bg-muted/30 border-border/40')}>
              <div className="flex items-center gap-1.5 mb-2">
                <Receipt className="w-3.5 h-3.5 text-violet-500" />
                <p className="text-xs font-bold text-foreground">Tagihan Kas</p>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { label: 'Total', value: kasInvoices.length, color: '' },
                  { label: 'Lunas', value: kasPaid.length, color: 'text-emerald-600' },
                  { label: 'Belum', value: kasUnpaid.length, color: kasUnpaid.length > 0 ? 'text-violet-600' : '' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={cn('text-lg font-bold', color || 'text-foreground')}>{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {kasDue > 0 && (
                <p className="text-xs text-violet-600 font-semibold mt-2 text-center">{formatRupiah(kasDue)}</p>
              )}
            </div>
          </div>

          {/* Total tunggakan */}
          {(iplDue + kasDue) > 0 && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
              <span className="text-sm text-red-700 font-medium">Total Tunggakan</span>
              <span className="text-sm font-bold text-red-600">{formatRupiah(iplDue + kasDue)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IPL Invoice History */}
      <InvoiceSection
        title="Riwayat Tagihan IPL"
        icon={<FileText className="w-4 h-4 text-rose-500" />}
        yearGroups={iplYearGroups}
        emptyText="Belum ada tagihan IPL"
        accentUnpaid="border-red-200/70 bg-red-50/50"
        iconUnpaid={<XCircle className="w-3.5 h-3.5 text-red-500" />}
        iconPaid={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
        bgPaid="bg-emerald-100"
        bgUnpaid="bg-red-100"
      />

      {/* Kas Invoice History */}
      <InvoiceSection
        title="Riwayat Tagihan Kas"
        icon={<Receipt className="w-4 h-4 text-violet-500" />}
        yearGroups={kasYearGroups}
        emptyText="Belum ada tagihan kas"
        accentUnpaid="border-violet-200/70 bg-violet-50/50"
        iconUnpaid={<XCircle className="w-3.5 h-3.5 text-violet-500" />}
        iconPaid={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
        bgPaid="bg-emerald-100"
        bgUnpaid="bg-violet-100"
      />
    </main>
  )
}

function InvoiceSection({
  title, icon, yearGroups, emptyText,
  accentUnpaid, iconPaid, iconUnpaid, bgPaid, bgUnpaid,
}: {
  title: string
  icon: React.ReactNode
  yearGroups: { year: string; invoices: (Invoice | KasInvoice)[] }[]
  emptyText: string
  accentUnpaid: string
  iconPaid: React.ReactNode
  iconUnpaid: React.ReactNode
  bgPaid: string
  bgUnpaid: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {yearGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-xl">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {yearGroups.map(({ year, invoices }) => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted-foreground">{year}</span>
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {invoices.filter(i => i.status === 'Paid').length}/{invoices.length}
                </span>
              </div>
              <div className="space-y-2">
                {invoices.map(inv => {
                  const isPaid = inv.status === 'Paid'
                  return (
                    <div key={inv.id} className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border',
                      isPaid ? 'border-border/40 bg-card' : accentUnpaid
                    )}>
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', isPaid ? bgPaid : bgUnpaid)}>
                        {isPaid ? iconPaid : iconUnpaid}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {monthIndo(inv.month_period)} {inv.year_period}
                        </p>
                        <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatRupiah(inv.amount_total)}</p>
                        {!isPaid && inv.amount_due > 0 && (
                          <p className="text-xs text-red-500">sisa {formatRupiah(inv.amount_due)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
