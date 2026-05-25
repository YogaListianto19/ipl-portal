import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, isAdmin } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !isAdmin(payload.role)) redirect('/dashboard')

  return (
    <div className="min-h-dvh bg-background flex">
      <Sidebar name={payload.name} blok={payload.blok} role={payload.role} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-dvh">
        <Navbar name={payload.name} blok={payload.blok} role={payload.role} />
        <div className="flex-1 pb-16 lg:pb-0">
          {children}
        </div>
        <BottomNav role={payload.role} />
      </div>
    </div>
  )
}
