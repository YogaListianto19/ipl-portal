'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Search, Shield, KeyRound, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, ChevronDown, Loader2, UserPlus, X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface Resident {
  id: string
  name: string
  blok: string
  mobile: string | null
  role: Role
  is_active: boolean
  pw_locked: boolean
}

interface Props { residents: Resident[] }

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'resident',  label: 'Warga',     color: 'bg-slate-100 text-slate-700' },
  { value: 'treasurer', label: 'Bendahara', color: 'bg-blue-100 text-blue-700' },
  { value: 'chairman',  label: 'Ketua',     color: 'bg-purple-100 text-purple-700' },
  { value: 'admin',     label: 'Admin',     color: 'bg-rose-100 text-rose-700' },
]

type FilterType = 'all' | 'admin' | 'active' | 'inactive'

async function callApi(id: string, action: string, value?: string) {
  const res = await fetch(`/api/admin/residents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, value }),
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'Gagal')
}

const EMPTY_FORM = { name: '', blok: '', mobile: '', role: 'resident' as Role, password: '', is_active: true }

export function UsersClient({ residents: initial }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [residents, setResidents] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    let list = residents
    if (filter === 'admin')    list = list.filter(r => r.role !== 'resident')
    if (filter === 'active')   list = list.filter(r => r.is_active)
    if (filter === 'inactive') list = list.filter(r => !r.is_active)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.blok.toLowerCase().includes(q) ||
        (r.mobile ?? '').includes(q)
      )
    }
    return list
  }, [residents, filter, search])

  const adminCount = residents.filter(r => r.role !== 'resident').length
  const inactiveCount = residents.filter(r => !r.is_active).length

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setAdding(true)
    try {
      const res = await fetch('/api/admin/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menambah user')
      setResidents(prev => [...prev, json.resident].sort((a, b) => a.blok.localeCompare(b.blok)))
      setForm(EMPTY_FORM)
      setShowAdd(false)
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function handleAction(id: string, action: string, value?: string) {
    setLoadingId(id)
    try {
      await callApi(id, action, value)
      // Optimistic update
      setResidents(prev => prev.map(r => {
        if (r.id !== id) return r
        if (action === 'toggle_active') return { ...r, is_active: !r.is_active }
        if (action === 'change_role')   return { ...r, role: (value as Role) }
        if (action === 'reset_password') return { ...r, pw_locked: false }
        return r
      }))
    } catch (e) {
      alert((e as Error).message)
      startTransition(() => router.refresh())
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <main className="max-w-xl mx-auto lg:max-w-4xl px-4 py-5 pb-24 lg:pb-8 space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 via-slate-700 to-slate-600 p-5 shadow-md">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">Kelola User</h1>
            <p className="text-sm text-white/55 mt-0.5">
              {residents.length} warga · {adminCount} pengurus · {inactiveCount} nonaktif
            </p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setFormError('') }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Tambah User Baru</h2>
              </div>
              <button
                onClick={() => { setShowAdd(false); setFormError('') }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nama Lengkap *</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Contoh: Budi Santoso"
                    className="h-9 rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Unit / Blok *</label>
                  <Input
                    value={form.blok}
                    onChange={e => setForm(f => ({ ...f, blok: e.target.value }))}
                    placeholder="Rossela 10"
                    className="h-9 rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nomor WA *</label>
                  <Input
                    value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                    className="h-9 rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                    className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Password <span className="font-normal text-muted-foreground">(default: rossela2026)</span>
                  </label>
                  <Input
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Kosongkan = default"
                    type="password"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors',
                      form.is_active
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {form.is_active
                      ? <><ToggleRight className="w-4 h-4" /> Aktif di portal</>
                      : <><ToggleLeft className="w-4 h-4" /> Nonaktif</>
                    }
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    {form.is_active ? 'Warga bisa login langsung' : 'Warga belum bisa login'}
                  </p>
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  {formError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setFormError('') }}
                  className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {adding ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, unit, atau nomor WA..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            ['all',      'Semua',     residents.length],
            ['admin',    'Pengurus',  adminCount],
            ['active',   'Aktif',     residents.length - inactiveCount],
            ['inactive', 'Nonaktif',  inactiveCount],
          ] as [FilterType, string, number][]).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                filter === val
                  ? 'bg-slate-800 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {label}
              <span className={cn(
                'inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px]',
                filter === val ? 'bg-white/20' : 'bg-border'
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Role</span>
        <span className="flex items-center gap-1"><ToggleRight className="w-3.5 h-3.5" /> Aktif/Nonaktif</span>
        <span className="flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Reset password</span>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada warga ditemukan</p>
          </div>
        ) : (
          filtered.map(r => (
            <UserRow
              key={r.id}
              resident={r}
              isLoading={loadingId === r.id}
              onAction={handleAction}
            />
          ))
        )}
      </div>
    </main>
  )
}

function UserRow({
  resident: r,
  isLoading,
  onAction,
}: {
  resident: { id: string; name: string; blok: string; mobile: string | null; role: Role; is_active: boolean; pw_locked: boolean }
  isLoading: boolean
  onAction: (id: string, action: string, value?: string) => Promise<void>
}) {
  const [roleOpen, setRoleOpen] = useState(false)
  const roleCfg = ROLES.find(x => x.value === r.role) ?? ROLES[0]

  return (
    <div className={cn(
      'p-4 rounded-xl border transition-colors',
      r.is_active ? 'border-border/50 bg-card' : 'border-border/30 bg-muted/30'
    )}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
          r.is_active ? 'bg-slate-100 text-slate-600' : 'bg-muted text-muted-foreground'
        )}>
          {r.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={cn('text-sm font-semibold', !r.is_active && 'text-muted-foreground')}>
              {r.name}
            </p>
            {!r.is_active && (
              <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-muted-foreground">Nonaktif</Badge>
            )}
            {r.pw_locked && (
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                PW user
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{r.blok} · {r.mobile ?? '-'}</p>
        </div>

        {/* Loading spinner */}
        {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">

        {/* Role selector */}
        <div className="relative">
          <button
            onClick={() => setRoleOpen(v => !v)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
              roleCfg.color,
              'hover:opacity-80 disabled:opacity-50'
            )}
          >
            <Shield className="w-3 h-3" />
            {roleCfg.label}
            <ChevronDown className={cn('w-3 h-3 transition-transform', roleOpen && 'rotate-180')} />
          </button>
          {roleOpen && (
            <div className="absolute left-0 top-full mt-1 bg-card border border-border/60 rounded-xl shadow-lg z-10 min-w-32 overflow-hidden">
              {ROLES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRoleOpen(false)
                    if (opt.value !== r.role) onAction(r.id, 'change_role', opt.value)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50 cursor-pointer transition-colors',
                    opt.value === r.role && 'bg-muted/30 font-bold'
                  )}
                >
                  {opt.value === r.role && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                  {opt.value !== r.role && <span className="w-3" />}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggle active */}
        <button
          onClick={() => onAction(r.id, 'toggle_active')}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50',
            r.is_active
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {r.is_active
            ? <><ToggleRight className="w-3.5 h-3.5" /> Aktif</>
            : <><ToggleLeft className="w-3.5 h-3.5" /> Nonaktif</>
          }
        </button>

        {/* Reset password */}
        <button
          onClick={() => {
            if (confirm(`Reset password ${r.name} ke default "rossela2026"?`)) {
              onAction(r.id, 'reset_password')
            }
          }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer transition-colors disabled:opacity-50"
        >
          <KeyRound className="w-3 h-3" />
          Reset PW
        </button>

        {/* Active status indicator */}
        <div className="ml-auto">
          {r.is_active
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <XCircle className="w-4 h-4 text-muted-foreground/50" />
          }
        </div>
      </div>
    </div>
  )
}
