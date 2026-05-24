import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Home, ShieldCheck } from 'lucide-react'
import { verifyToken, isAdmin, roleLabel } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatDateShort, monthIndo, monthOrder } from '@/lib/format'
import type { Invoice } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  const { id } = await params
  const supabase = createServerClient()

  const [{ data: resident }, { data: invoices }] = await Promise.all([
    supabase.from('residents').select('*').eq('id', id).single(),
    supabase.from('invoices').select('*').eq('resident_id', id)
      .order('year_period', { ascending: false })
      .order('month_period', { ascending: false }),
  ])

  if (!resident) notFound()

  const allInvoices = (invoices ?? []) as Invoice[]
  const paid = allInvoices.filter(i => i.status === 'Paid')
  const unpaid = allInvoices.filter(i => i.status === 'Not Paid')
  const totalDue = unpaid.reduce((s, i) => s + Number(i.amount_due || i.amount_total), 0)

  // Group by year
  const byYear = new Map<string, Invoice[]>()
  for (const inv of allInvoices) {
    const arr = byYear.get(inv.year_period) ?? []
    arr.push(inv)
    byYear.set(inv.year_period, arr)
  }
  const yearGroups = Array.from(byYear.entries())
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, invs]) => ({
      year,
      invoices: invs.sort((a, b) => monthOrder(b.month_period) - monthOrder(a.month_period)),
    }))

  return (
    <div className="min-h-screen bg-background">
      <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
      <main className="max-w-xl mx-auto px-4 py-6 space-y-5">
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
                  <span className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" />
                    {resident.blok}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {resident.mobile}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Tagihan', value: allInvoices.length, suffix: 'bln', color: '' },
                { label: 'Lunas', value: paid.length, suffix: 'bln', color: 'text-emerald-600' },
                { label: 'Belum', value: unpaid.length, suffix: 'bln', color: unpaid.length > 0 ? 'text-red-600' : '' },
              ].map(({ label, value, suffix, color }) => (
                <div key={label} className="text-center">
                  <p className={cn('text-xl font-bold', color || 'text-foreground')}>{value}</p>
                  <p className="text-xs text-muted-foreground">{suffix}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {totalDue > 0 && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                <span className="text-sm text-red-700 font-medium">Total Tunggakan</span>
                <span className="text-sm font-bold text-red-600">{formatRupiah(totalDue)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice History */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Riwayat Tagihan</h2>
          {yearGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada tagihan</p>
          ) : (
            <div className="space-y-4">
              {yearGroups.map(({ year, invoices: yearInvs }) => (
                <div key={year}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground">{year}</span>
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {yearInvs.filter(i => i.status === 'Paid').length}/{yearInvs.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {yearInvs.map(inv => {
                      const isPaid = inv.status === 'Paid'
                      return (
                        <div key={inv.id} className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border',
                          isPaid ? 'border-border/40 bg-card' : 'border-red-200/70 bg-red-50/50'
                        )}>
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', isPaid ? 'bg-emerald-100' : 'bg-red-100')}>
                            {isPaid
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              : <XCircle className="w-3.5 h-3.5 text-red-500" />
                            }
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
      </main>
    </div>
  )
}
