'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, AlertTriangle, Wallet, RefreshCw,
  ChevronRight, Search, CheckCircle2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatRupiah, syncTimeAgo, roleLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface ResidentWithSummary {
  id: string
  name: string
  blok: string
  mobile: string
  role: Role
  is_active: boolean
  summary: { total: number; paid: number; unpaid: number; totalDue: number }
}

interface Props {
  residents: ResidentWithSummary[]
  totalDue: number
  withDebt: number
  lastSync: { sync_at: string; file_name: string | null; status: string } | null
}

type FilterType = 'all' | 'debt' | 'clear'

export function AdminDashboardClient({ residents, totalDue, withDebt, lastSync }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = useMemo(() => {
    let list = residents
    if (filter === 'debt') list = list.filter(r => r.summary.unpaid > 0)
    if (filter === 'clear') list = list.filter(r => r.summary.unpaid === 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.blok.toLowerCase().includes(q)
      )
    }
    return list
  }, [residents, filter, search])

  return (
    <main className="max-w-2xl mx-auto px-4 py-5 pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Blok Rossela — {residents.length} unit</p>
        </div>
        <Link
          href="/admin/sync"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Upload Data
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Total Warga</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{residents.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">unit terdaftar</p>
          </CardContent>
        </Card>

        <Card className={cn('border-border/50 shadow-sm', withDebt > 0 && 'border-red-200 bg-red-50/40')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Ada Tunggakan</span>
              <AlertTriangle className={cn('w-4 h-4', withDebt > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
            <p className={cn('text-2xl font-bold', withDebt > 0 ? 'text-red-600' : 'text-foreground')}>
              {withDebt}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">warga</p>
          </CardContent>
        </Card>

        <Card className={cn('col-span-2 border-border/50 shadow-sm', totalDue > 0 && 'border-red-200 bg-red-50/30')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Tunggakan Blok</p>
              <p className={cn('text-2xl font-bold mt-0.5', totalDue > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {totalDue > 0 ? formatRupiah(totalDue) : 'Semua Lunas ✓'}
              </p>
            </div>
            <Wallet className={cn('w-8 h-8', totalDue > 0 ? 'text-red-300' : 'text-emerald-300')} />
          </CardContent>
        </Card>
      </div>

      {/* Last Sync */}
      {lastSync && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border/40 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>
            Sync terakhir: <span className="font-medium text-foreground">{syncTimeAgo(lastSync.sync_at)}</span>
            {lastSync.file_name && (
              <span className="ml-1">· {lastSync.file_name}</span>
            )}
          </span>
        </div>
      )}

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="flex gap-1.5">
          {([
            ['all', 'Semua', residents.length],
            ['debt', 'Ada Tunggakan', withDebt],
            ['clear', 'Lunas Semua', residents.length - withDebt],
          ] as [FilterType, string, number][]).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                filter === val
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {label}
              <span className={cn(
                'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]',
                filter === val ? 'bg-white/20' : 'bg-border'
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Residents Table */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada warga ditemukan</p>
          </div>
        ) : (
          filtered.map(r => (
            <Link
              key={r.id}
              href={`/admin/residents/${r.id}`}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors group"
            >
              {/* Status indicator */}
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                r.summary.unpaid > 0
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              )}>
                {r.summary.unpaid > 0
                  ? r.summary.unpaid
                  : <CheckCircle2 className="w-4 h-4" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  {r.role !== 'resident' && (
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">
                      {roleLabel(r.role)}
                    </Badge>
                  )}
                  {!r.is_active && (
                    <Badge variant="destructive" className="text-[9px] h-3.5 px-1 shrink-0">
                      Nonaktif
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{r.blok}</p>
              </div>

              <div className="text-right shrink-0">
                {r.summary.unpaid > 0 ? (
                  <>
                    <p className="text-sm font-bold text-red-600">{formatRupiah(r.summary.totalDue)}</p>
                    <p className="text-xs text-muted-foreground">{r.summary.unpaid} bln belum</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-emerald-600">Lunas</p>
                    <p className="text-xs text-muted-foreground">{r.summary.total} tagihan</p>
                  </>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
