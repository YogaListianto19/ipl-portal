'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Phone, Lock, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login gagal'); return }
      const from = params.get('from') || '/dashboard'
      router.replace(from)
      router.refresh()
    })
  }

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center overflow-hidden px-5 py-12">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-rose-950 via-rose-800 to-pink-700" />

      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-rose-300/10 rounded-full blur-2xl pointer-events-none" />

      {/* Glass card */}
      <div className="relative w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          {/* Hibiscus SVG icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
              {/* Petals */}
              <ellipse cx="40" cy="16" rx="8" ry="14" fill="rgba(255,255,255,0.85)" transform="rotate(0 40 40)" />
              <ellipse cx="40" cy="16" rx="8" ry="14" fill="rgba(255,255,255,0.85)" transform="rotate(72 40 40)" />
              <ellipse cx="40" cy="16" rx="8" ry="14" fill="rgba(255,255,255,0.85)" transform="rotate(144 40 40)" />
              <ellipse cx="40" cy="16" rx="8" ry="14" fill="rgba(255,255,255,0.85)" transform="rotate(216 40 40)" />
              <ellipse cx="40" cy="16" rx="8" ry="14" fill="rgba(255,255,255,0.85)" transform="rotate(288 40 40)" />
              {/* Center */}
              <circle cx="40" cy="40" r="10" fill="#BE123C" />
              <circle cx="40" cy="40" r="5" fill="white" opacity="0.9" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Portal IPL Rossela</h1>
          <p className="text-sm text-white/60 mt-1">G-Land Katapang Residence</p>
        </div>

        {/* Card */}
        <div className="bg-white/12 backdrop-blur-xl border border-white/25 rounded-3xl p-6 shadow-2xl shadow-black/30">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Masuk ke Akun</h2>
            <p className="text-sm text-white/55 mt-0.5">Gunakan nomor HP yang terdaftar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile */}
            <div className="space-y-1.5">
              <label htmlFor="mobile" className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Nomor HP
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="08xxxxxxxxxx"
                  value={mobile}
                  onChange={e => {
                    // Strip spasi & tanda hubung langsung saat ketik
                    const val = e.target.value.replace(/[\s\-]/g, '')
                    setMobile(val)
                  }}
                  required
                  autoComplete="tel"
                  disabled={isPending}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/15 border border-white/25 text-white placeholder:text-white/40 text-sm font-medium outline-none focus:border-white/60 focus:bg-white/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isPending}
                  className="w-full h-12 pl-10 pr-11 rounded-xl bg-white/15 border border-white/25 text-white placeholder:text-white/40 text-sm font-medium outline-none focus:border-white/60 focus:bg-white/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white/10 border border-rose-300/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-300 shrink-0" />
                <p className="text-sm text-rose-100">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !mobile || !password}
              className="w-full h-12 rounded-xl bg-white text-rose-700 text-sm font-bold shadow-lg shadow-black/20 hover:bg-rose-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/15">
            <p className="text-xs text-center text-white/45">
              Lupa password?{' '}
              <span className="text-white/75 font-medium">Hubungi pengurus RT/RW</span>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-center text-white/35">
          Data diperbarui secara berkala oleh pengurus
        </p>
      </div>
    </div>
  )
}
