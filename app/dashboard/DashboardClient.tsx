'use client'

import { useMemo } from 'react'
import { CheckCircle2, XCircle, Wallet, CalendarDays, TrendingUp, PartyPopper, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatDateShort, monthIndo, monthOrder } from '@/lib/format'
import type { Invoice, Resident } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  resident: Resident
  invoices: Invoice[]
}

export function DashboardClient({ resident, invoices }: Props) {
  const summary = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'Paid')
    const unpaid = invoices.filter(i => i.status === 'Not Paid')
    const totalDue = unpaid.reduce((sum, i) => sum + Number(i.amount_due || i.amount_total), 0)
    const totalPaid = paid.reduce((sum, i) => sum + Number(i.amount_total), 0)
    return { paid, unpaid, totalDue, totalPaid, total: invoices.length }
  }, [invoices])

  const byYear = useMemo(() => {
    const map = new Map<string, Invoice[]>()
    for (const inv of invoices) {
      const arr = map.get(inv.year_period) ?? []
      arr.push(inv)
      map.set(inv.year_period, arr)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, invs]) => ({
        year,
        invoices: invs.sort((a, b) => monthOrder(b.month_period) - monthOrder(a.month_period)),
      }))
  }, [invoices])

  const firstName = resident.name.split(' ')[0]
  const allClear = summary.unpaid.length === 0 && summary.total > 0
  const paidPct = summary.total > 0 ? Math.round((summary.paid.length / summary.total) * 100) : 0

  return (
    <main className="max-w-xl mx-auto px-4 py-5 pb-24 sm:pb-8 space-y-5">
      {/* Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-900 via-rose-700 to-pink-600 p-5 shadow-md shadow-primary/20">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-20 h-20 bg-pink-400/15 rounded-full blur-2xl pointer-events-none" />
        <p className="text-white/65 text-sm font-medium relative">Halo,</p>
        <h1 className="text-xl font-bold text-white relative leading-tight">{firstName}</h1>
        <p className="text-white/55 text-sm mt-1 relative">
          Unit <span className="text-white font-semibold">{resident.blok}</span>
        </p>
      </div>

      {/* Payment Status Banner */}
      {summary.total > 0 && (
        allClear ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200/70">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <PartyPopper className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">Semua tagihan lunas</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Total dibayar: <span className="font-bold">{formatRupiah(summary.totalPaid)}</span>
              </p>
            </div>
          </div>
        ) : summary.totalDue > 0 ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200/70">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <TriangleAlert className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">Ada {summary.unpaid.length} tagihan belum lunas</p>
              <p className="text-xs text-red-600 mt-0.5">
                Tunggakan: <span className="font-bold">{formatRupiah(summary.totalDue)}</span>
              </p>
            </div>
          </div>
        ) : null
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Tagihan */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-700 to-slate-500 p-4 shadow-md shadow-slate-300/40">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-lg" />
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-bold text-white tabular-nums">{summary.total}</p>
          <p className="text-xs text-white/60 mt-0.5 font-medium">Total Tagihan</p>
        </div>

        {/* Sudah Lunas */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 to-teal-500 p-4 shadow-md shadow-emerald-300/40">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/15 rounded-full blur-lg" />
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-bold text-white tabular-nums">{summary.paid.length}</p>
          <p className="text-xs text-white/60 mt-0.5 font-medium">Sudah Lunas</p>
        </div>

        {/* Belum Bayar */}
        <div className={cn(
          'relative overflow-hidden rounded-2xl p-4 shadow-md',
          summary.unpaid.length > 0
            ? 'bg-linear-to-br from-rose-600 to-pink-500 shadow-rose-300/40'
            : 'bg-linear-to-br from-slate-200 to-slate-100 shadow-slate-200/40'
        )}>
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/15 rounded-full blur-lg" />
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center mb-3',
            summary.unpaid.length > 0 ? 'bg-white/20' : 'bg-slate-300/50'
          )}>
            <XCircle className={cn('w-4 h-4', summary.unpaid.length > 0 ? 'text-white' : 'text-slate-500')} />
          </div>
          <p className={cn('text-3xl font-bold tabular-nums', summary.unpaid.length > 0 ? 'text-white' : 'text-slate-600')}>
            {summary.unpaid.length}
          </p>
          <p className={cn('text-xs mt-0.5 font-medium', summary.unpaid.length > 0 ? 'text-white/60' : 'text-slate-400')}>
            Belum Bayar
          </p>
        </div>

        {/* Tunggakan */}
        <div className={cn(
          'relative overflow-hidden rounded-2xl p-4 shadow-md',
          summary.totalDue > 0
            ? 'bg-linear-to-br from-amber-500 to-orange-400 shadow-amber-300/40'
            : 'bg-linear-to-br from-emerald-600 to-teal-500 shadow-emerald-300/40'
        )}>
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/15 rounded-full blur-lg" />
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          {summary.totalDue > 0 ? (
            <>
              <p className="text-sm font-bold text-white leading-tight tabular-nums">
                {formatRupiah(summary.totalDue)}
              </p>
              <p className="text-xs text-white/60 mt-0.5 font-medium">Tunggakan</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-white leading-tight">Lunas</p>
              <p className="text-xs text-white/60 mt-0.5 font-medium">Semua terbayar</p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {summary.total > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Progress Pembayaran</span>
            <span className="text-xs font-bold text-foreground">{paidPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                paidPct === 100 ? 'bg-emerald-500' : paidPct >= 70 ? 'bg-primary' : 'bg-amber-500'
              )}
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">{summary.paid.length} lunas</span>
            <span className="text-[10px] text-muted-foreground">{summary.total} total</span>
          </div>
        </div>
      )}

      {/* Total paid info */}
      {summary.totalPaid > 0 && !allClear && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">
            Total sudah dibayar: <span className="font-bold">{formatRupiah(summary.totalPaid)}</span>
          </p>
        </div>
      )}

      {/* Invoice list */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Riwayat Tagihan</h2>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada data tagihan</p>
            <p className="text-xs mt-1 opacity-70">Data muncul setelah admin melakukan sinkronisasi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {byYear.map(({ year, invoices: yearInvoices }) => (
              <div key={year}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-muted-foreground">{year}</span>
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {yearInvoices.filter(i => i.status === 'Paid').length}/{yearInvoices.length} lunas
                  </span>
                </div>
                <div className="space-y-2">
                  {yearInvoices.map(inv => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function InvoiceRow({ invoice: inv }: { invoice: Invoice }) {
  const isPaid = inv.status === 'Paid'

  return (
    <div className={cn(
      'flex items-center gap-3 p-3.5 rounded-xl border transition-colors',
      isPaid
        ? 'bg-card border-border/40 hover:border-border/70'
        : 'bg-red-50/70 border-red-200/70 hover:border-red-300'
    )}>
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        isPaid ? 'bg-emerald-100' : 'bg-red-100'
      )}>
        {isPaid
          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          : <XCircle className="w-4 h-4 text-red-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {monthIndo(inv.month_period)} {inv.year_period}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {inv.invoice_number}
          {inv.invoice_date && (
            <span className="ml-1.5">· {formatDateShort(inv.invoice_date)}</span>
          )}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">
          {formatRupiah(inv.amount_total)}
        </p>
        <Badge
          variant={isPaid ? 'default' : 'destructive'}
          className={cn(
            'text-[10px] h-4 px-1.5 mt-0.5',
            isPaid && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
          )}
        >
          {isPaid ? 'Lunas' : 'Belum'}
        </Badge>
      </div>
    </div>
  )
}
