'use client'

import { useState, useTransition } from 'react'
import {
  User, Home, Phone, Shield, Calendar,
  CheckCircle2, XCircle, TrendingUp,
  KeyRound, Eye, EyeOff, ChevronDown,
} from 'lucide-react'
import { formatRupiah, formatDate, roleLabel, monthIndo } from '@/lib/format'
import type { Resident, Invoice } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProfilClientProps {
  resident: Resident
  invoices: Invoice[]
}

function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    if (next !== confirm) { setResult({ ok: false, msg: 'Password baru tidak cocok' }); return }
    startTransition(async () => {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: 'Password berhasil diubah' })
        setCurrent(''); setNext(''); setConfirm('')
        setTimeout(() => { setOpen(false); setResult(null) }, 2000)
      } else {
        setResult({ ok: false, msg: data.error ?? 'Gagal mengubah password' })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setResult(null) }}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-rose-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Ganti Password</p>
            <p className="text-xs text-slate-400 mt-0.5">Ubah password login Anda</p>
          </div>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-slate-400 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>

      {open && (
        <div className="border-t border-rose-100 bg-rose-50/30 px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {(['Password Saat Ini', 'Password Baru', 'Konfirmasi Password Baru'] as const).map((lbl, i) => (
              <div key={lbl} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">{lbl}</label>
                <div className="relative">
                  <input
                    type={(i === 0 ? showCurrent : i === 1 ? showNext : false) ? 'text' : 'password'}
                    value={i === 0 ? current : i === 1 ? next : confirm}
                    onChange={e => i === 0 ? setCurrent(e.target.value) : i === 1 ? setNext(e.target.value) : setConfirm(e.target.value)}
                    placeholder={i === 1 ? 'Min. 6 karakter' : '••••••••'}
                    required
                    minLength={i === 1 ? 6 : undefined}
                    disabled={isPending}
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-rose-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-rose-400 transition-all disabled:opacity-50"
                  />
                  {i < 2 && (
                    <button type="button"
                      onClick={() => i === 0 ? setShowCurrent(v => !v) : setShowNext(v => !v)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                      {(i === 0 ? showCurrent : showNext) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {result && (
              <div className={cn(
                'flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium',
                result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              )}>
                {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                {result.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !current || !next || !confirm}
              className="w-full h-11 rounded-xl bg-rose-700 text-white text-sm font-semibold hover:bg-rose-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export function ProfilClient({ resident, invoices }: ProfilClientProps) {
  const paid   = invoices.filter(i => i.status === 'Paid')
  const unpaid = invoices.filter(i => i.status === 'Not Paid')
  const totalDue  = unpaid.reduce((s, i) => s + i.amount_due,   0)
  const totalPaid = paid.reduce((s, i)   => s + i.amount_total, 0)

  const initials = resident.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <main className="max-w-xl mx-auto px-4 py-5 pb-24 sm:pb-8 space-y-4">

      {/* ── Hero Card ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg shadow-rose-900/25"
        style={{ background: 'linear-gradient(135deg, #4A0020 0%, #881337 45%, #BE123C 100%)' }}>

        {/* Decorative rings */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-20 border-white/5 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full border-16 border-white/5 pointer-events-none" />
        <div className="absolute top-6 right-16 w-4 h-4 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-12 right-8 w-2 h-2 rounded-full bg-white/15 pointer-events-none" />

        {/* Profile info */}
        <div className="relative px-6 pt-6 pb-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/20"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>

            {/* Name & blok */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-lg font-bold text-white leading-tight truncate">{resident.name}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Home className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span className="text-sm text-rose-200">{resident.blok}</span>
              </div>
            </div>

            {/* Role badge */}
            <div className="shrink-0 mt-1 px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/25"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              {roleLabel(resident.role)}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/12 mt-5 mb-4" />

          {/* Stats row */}
          <div className="flex">
            {[
              { label: 'Tagihan Lunas', value: paid.length, sub: formatRupiah(totalPaid) },
              { label: 'Belum Bayar',   value: unpaid.length, sub: totalDue > 0 ? formatRupiah(totalDue) : 'Semua lunas' },
              { label: 'Total',         value: invoices.length, sub: 'tagihan' },
            ].map(({ label, value, sub }, i) => (
              <div key={label} className={cn('flex-1 text-center', i > 0 && 'border-l border-white/12')}>
                <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
                <p className="text-[11px] text-rose-300 font-medium mt-0.5">{label}</p>
                <p className="text-[10px] text-rose-400/70 mt-0.5 truncate px-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Informasi Akun ── */}
      <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-rose-50/60 border-b border-rose-100">
          <h2 className="text-sm font-bold text-rose-900">Informasi Akun</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {([
            { icon: User,     label: 'Nama Lengkap',        value: resident.name },
            { icon: Home,     label: 'Blok / Unit',         value: resident.blok },
            { icon: Phone,    label: 'Nomor HP (Username)', value: resident.mobile },
            { icon: Shield,   label: 'Hak Akses',           value: roleLabel(resident.role) },
            { icon: Calendar, label: 'Terdaftar Sejak',     value: formatDate(resident.created_at) },
          ] as const).map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3.5 px-5 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium leading-none mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ganti Password ── */}
      <ChangePasswordForm />

      {/* ── Riwayat Tagihan ── */}
      {invoices.length > 0 && (
        <div className="rounded-2xl border border-rose-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-800">Riwayat Tagihan Terakhir</h2>
          </div>
          <div>
            {invoices.slice(0, 6).map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  {inv.status === 'Paid'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  }
                  <span className="text-sm text-slate-700">{monthIndo(inv.month_period)} {inv.year_period}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-800">{formatRupiah(inv.amount_total)}</p>
                  {inv.status !== 'Paid' && inv.amount_due > 0 && (
                    <p className="text-[10px] text-rose-500">Sisa {formatRupiah(inv.amount_due)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {invoices.length > 6 && (
            <p className="text-xs text-center text-slate-400 mt-3">
              +{invoices.length - 6} tagihan lainnya di tab{' '}
              <span className="text-rose-600 font-semibold">Tagihan</span>
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-center text-slate-400 pb-2">
        Untuk mengubah data profil, hubungi pengurus RT/RW
      </p>
    </main>
  )
}
