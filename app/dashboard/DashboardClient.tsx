'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Wallet, FileText, TrendingDown, Receipt,
  ChevronRight, TriangleAlert, PartyPopper
} from 'lucide-react'
import { formatRupiah } from '@/lib/format'
import type { Invoice, KasInvoice } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  blok: string
  invoices: Invoice[]
  kasInvoices: KasInvoice[]
}

export function DashboardClient({ name, blok, invoices, kasInvoices }: Props) {
  const ipl = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'Paid')
    const unpaid = invoices.filter(i => i.status === 'Not Paid')
    return {
      total: invoices.length,
      paid: paid.length,
      unpaid: unpaid.length,
      totalDue: unpaid.reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0),
      totalPaid: paid.reduce((s, i) => s + Number(i.amount_total), 0),
    }
  }, [invoices])

  const kas = useMemo(() => {
    const paid = kasInvoices.filter(i => i.status === 'Paid')
    const unpaid = kasInvoices.filter(i => i.status === 'Not Paid')
    return {
      total: kasInvoices.length,
      paid: paid.length,
      unpaid: unpaid.length,
      totalDue: unpaid.reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0),
    }
  }, [kasInvoices])

  const firstName = name.split(' ')[0]
  const iplOk = ipl.unpaid === 0 && ipl.total > 0
  const kasOk = kas.unpaid === 0 && kas.total > 0
  const allOk = iplOk && kasOk

  return (
    <main className="max-w-xl mx-auto px-4 py-5 pb-24 lg:pb-8 space-y-5">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-900 via-rose-700 to-pink-600 p-5 shadow-md shadow-primary/20">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-24 h-24 bg-pink-400/15 rounded-full blur-2xl pointer-events-none" />
        <p className="text-white/65 text-sm font-medium relative">Halo,</p>
        <h1 className="text-2xl font-bold text-white relative leading-tight">{firstName}</h1>
        <p className="text-white/55 text-sm mt-1 relative">
          Unit <span className="text-white font-semibold">{blok}</span> · Portal Rossela
        </p>
        {allOk && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
            <PartyPopper className="w-3.5 h-3.5 text-white" />
            <span className="text-xs text-white font-medium">Semua tagihan lunas!</span>
          </div>
        )}
      </div>

      {/* Alert tunggakan */}
      {(ipl.totalDue > 0 || kas.totalDue > 0) && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200/70">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <TriangleAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Ada tagihan yang belum lunas</p>
            <div className="mt-1 space-y-0.5">
              {ipl.totalDue > 0 && (
                <p className="text-xs text-red-600">IPL: <span className="font-bold">{formatRupiah(ipl.totalDue)}</span> ({ipl.unpaid} tagihan)</p>
              )}
              {kas.totalDue > 0 && (
                <p className="text-xs text-red-600">Kas: <span className="font-bold">{formatRupiah(kas.totalDue)}</span> ({kas.unpaid} tagihan)</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IPL Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Tagihan IPL</h2>
          <Link href="/tagihan-ipl" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer">
            Lihat semua <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-slate-700 to-slate-500 p-3 shadow-sm shadow-slate-300/30">
            <p className="text-2xl font-bold text-white tabular-nums">{ipl.total}</p>
            <p className="text-[10px] text-white/60 font-medium mt-0.5">Total</p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-emerald-600 to-teal-500 p-3 shadow-sm shadow-emerald-300/30">
            <p className="text-2xl font-bold text-white tabular-nums">{ipl.paid}</p>
            <p className="text-[10px] text-white/60 font-medium mt-0.5">Lunas</p>
          </div>
          <div className={cn(
            'relative overflow-hidden rounded-xl p-3 shadow-sm',
            ipl.unpaid > 0 ? 'bg-linear-to-br from-rose-600 to-pink-500 shadow-rose-300/30' : 'bg-linear-to-br from-slate-200 to-slate-100'
          )}>
            <p className={cn('text-2xl font-bold tabular-nums', ipl.unpaid > 0 ? 'text-white' : 'text-slate-500')}>{ipl.unpaid}</p>
            <p className={cn('text-[10px] font-medium mt-0.5', ipl.unpaid > 0 ? 'text-white/60' : 'text-slate-400')}>Belum</p>
          </div>
        </div>

        {ipl.totalDue > 0 ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">Tunggakan IPL: <span className="font-bold">{formatRupiah(ipl.totalDue)}</span></p>
          </div>
        ) : ipl.total > 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">IPL lunas semua · dibayar {formatRupiah(ipl.totalPaid)}</p>
          </div>
        ) : null}

        {/* Quick links IPL */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Link href="/tagihan-ipl" className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-rose-50/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-200 transition-colors">
              <FileText className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Tagihan IPL</p>
              <p className="text-[10px] text-muted-foreground">Riwayat lengkap</p>
            </div>
          </Link>
          <Link href="/pengeluaran-ipl" className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-rose-50/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-200 transition-colors">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Pengeluaran IPL</p>
              <p className="text-[10px] text-muted-foreground">Biaya operasional</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Kas Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Uang Kas</h2>
          <Link href="/tagihan-kas" className="flex items-center gap-1 text-xs text-violet-600 font-medium hover:underline cursor-pointer">
            Lihat semua <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {kas.total === 0 ? (
          <div className="text-center py-6 text-muted-foreground bg-card rounded-2xl border border-border/40">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Belum ada data tagihan kas</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-violet-700 to-purple-500 p-3 shadow-sm shadow-violet-300/30">
                <p className="text-2xl font-bold text-white tabular-nums">{kas.total}</p>
                <p className="text-[10px] text-white/60 font-medium mt-0.5">Total</p>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-emerald-600 to-teal-500 p-3 shadow-sm shadow-emerald-300/30">
                <p className="text-2xl font-bold text-white tabular-nums">{kas.paid}</p>
                <p className="text-[10px] text-white/60 font-medium mt-0.5">Lunas</p>
              </div>
              <div className={cn(
                'relative overflow-hidden rounded-xl p-3 shadow-sm',
                kas.unpaid > 0 ? 'bg-linear-to-br from-amber-500 to-orange-400 shadow-amber-300/30' : 'bg-linear-to-br from-slate-200 to-slate-100'
              )}>
                <p className={cn('text-2xl font-bold tabular-nums', kas.unpaid > 0 ? 'text-white' : 'text-slate-500')}>{kas.unpaid}</p>
                <p className={cn('text-[10px] font-medium mt-0.5', kas.unpaid > 0 ? 'text-white/60' : 'text-slate-400')}>Belum</p>
              </div>
            </div>

            {kas.totalDue > 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">Tunggakan Kas: <span className="font-bold">{formatRupiah(kas.totalDue)}</span></p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">Kas lunas semua</p>
              </div>
            )}
          </>
        )}

        {/* Quick links Kas */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Link href="/tagihan-kas" className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-violet-300 hover:bg-violet-50/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
              <Wallet className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Tagihan Kas</p>
              <p className="text-[10px] text-muted-foreground">Iuran kas warga</p>
            </div>
          </Link>
          <Link href="/pengeluaran-kas" className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-violet-300 hover:bg-violet-50/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
              <Receipt className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Pengeluaran Kas</p>
              <p className="text-[10px] text-muted-foreground">Laporan belanja</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  )
}
