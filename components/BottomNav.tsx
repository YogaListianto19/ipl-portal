'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, TrendingDown, Wallet, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface BottomNavProps {
  role: Role
}

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',  icon: Home },
  { href: '/tagihan-ipl',     label: 'T-IPL',      icon: FileText },
  { href: '/pengeluaran-ipl', label: 'P-IPL',      icon: TrendingDown },
  { href: '/tagihan-kas',     label: 'T-Kas',      icon: Wallet },
  { href: '/pengeluaran-kas', label: 'P-Kas',      icon: Receipt },
]

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border/60 shadow-lg shadow-black/5">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors touch-manipulation"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200',
                isActive ? 'bg-linear-to-br from-rose-600 to-pink-500 shadow-sm shadow-primary/30' : ''
              )}>
                <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-white' : 'text-muted-foreground')} />
              </div>
              <span className={cn(
                'text-[9px] font-medium leading-none transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      <div className="h-safe-area-inset-bottom bg-card/95" />
    </nav>
  )
}
