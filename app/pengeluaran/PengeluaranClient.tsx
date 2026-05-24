'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, Clock, AlertCircle, TrendingDown, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDateShort } from '@/lib/format'
import type { Expense } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props { expenses: Expense[] }

type FilterType = 'all' | 'paid' | 'not_paid'

const STATUS_CONFIG = {
  paid:       { label: 'Lunas',   icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
  in_payment: { label: 'Proses',  icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-100',   badge: 'bg-amber-100 text-amber-700' },
  partial:    { label: 'Sebagian',icon: AlertCircle,  color: 'text-amber-500',   bg: 'bg-amber-100',   badge: 'bg-amber-100 text-amber-700' },
  not_paid:   { label: 'Belum',   icon: AlertCircle,  color: 'text-red-500',     bg: 'bg-red-100',     badge: 'bg-red-100 text-red-700' },
}

export function PengeluaranClient({ expenses }: Props) {
  const [filter, setFilter] = useState<FilterType>('all')

  const summary = useMemo(() => {
    const paid = expenses.filter(e => e.payment_status === 'paid')
    const pending = expenses.filter(e => e.payment_status !== 'paid')
    return {
      totalAmount: expenses.reduce((s, e) => s + Number(e.amount_total), 0),
      paidAmount:  paid.reduce((s, e) => s + Number(e.amount_total), 0),
      pendingAmount: pending.reduce((s, e) => s + Number(e.amount_due || e.amount_total), 0),
      paidCount: paid.length,
    }
  }, [expenses])

  const filtered = useMemo(() => {
    if (filter === 'paid') return expenses.filter(e => e.payment_status === 'paid')
    if (filter === 'not_paid') return expenses.filter(e => e.payment_status !== 'paid')
    return expenses
  }, [expenses, filter])

  return (
    <main className="max-w-xl mx-auto px-4 py-5 pb-24 sm:pb-8 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-900 via-rose-700 to-pink-600 p-5 shadow-md shadow-primary/20">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <h1 className="text-xl font-bold text-white relative">Laporan Pengeluaran</h1>
        <p className="text-sm text-white/55 mt-1 relative">Transparansi keuangan Blok Rossela</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="col-span-2 border-border/50 shadow-sm bg-linear-to-br from-primary/5 to-background">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {formatRupiah(summary.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{expenses.length} transaksi</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Sudah Dibayar</p>
            <p className="text-lg font-bold text-emerald-700">{formatRupiah(summary.paidAmount)}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{summary.paidCount} tagihan</p>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-border/50 shadow-sm',
          summary.pendingAmount > 0 && 'border-amber-200/70 bg-amber-50/50'
        )}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Belum Dibayar</p>
            <p className={cn('text-lg font-bold', summary.pendingAmount > 0 ? 'text-amber-700' : 'text-foreground')}>
              {formatRupiah(summary.pendingAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {expenses.length - summary.paidCount} tagihan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex gap-1.5">
          {([
            ['all', 'Semua'],
            ['paid', 'Lunas'],
            ['not_paid', 'Belum Bayar'],
          ] as [FilterType, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                filter === val
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada data pengeluaran</p>
          </div>
        ) : (
          filtered.map(exp => <ExpenseRow key={exp.id} expense={exp} />)
        )}
      </div>
    </main>
  )
}

function ExpenseRow({ expense: exp }: { expense: Expense }) {
  const cfg = STATUS_CONFIG[exp.payment_status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.not_paid
  const Icon = cfg.icon

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-card hover:border-border/80 transition-colors">
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
        <Icon className={cn('w-4 h-4', cfg.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {exp.description || exp.vendor_name || exp.bill_number}
        </p>
        {exp.description && exp.vendor_name && (
          <p className="text-xs text-muted-foreground truncate">{exp.vendor_name}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{exp.bill_number}</span>
          {exp.bill_date && (
            <span className="text-xs text-muted-foreground">· {formatDateShort(exp.bill_date)}</span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{formatRupiah(exp.amount_total)}</p>
        {exp.amount_due > 0 && exp.payment_status !== 'paid' && (
          <p className="text-xs text-muted-foreground">
            sisa {formatRupiah(exp.amount_due)}
          </p>
        )}
        <span className={cn('inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5', cfg.badge)}>
          {cfg.label}
        </span>
      </div>
    </div>
  )
}
