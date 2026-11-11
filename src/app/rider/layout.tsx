'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bike, Home, LogOut, PhoneCall, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { logoutAction } from '@/features/bookings/actions'

const riderNavItems = [
  { name: 'Home', href: '/rider', icon: Home },
  { name: 'Vehicle Details', href: '/rider/vehicles', icon: Bike },
  { name: 'Support', href: '/rider/support', icon: PhoneCall },
]

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/80">
      {/* Mobile-Friendly Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20">
            RR
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 leading-none tracking-tight">ReRider</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">Rider Portal • Kochi</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold gap-1">
            <ShieldCheck className="h-3 w-3 text-blue-600" />
            Verified
          </Badge>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Desktop / Tablet Sub-Navigation */}
      <nav className="border-b border-slate-200 bg-white px-4">
        <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto py-2">
          {riderNavItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/rider' ? pathname === '/rider' : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-blue-600' : 'text-slate-500')} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto max-w-md p-4 md:max-w-3xl">{children}</div>
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur shadow-lg md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {riderNavItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/rider' ? pathname === '/rider' : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-0.5 text-xs font-semibold transition-colors',
                  active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-0.5', active ? 'text-blue-600' : 'text-slate-400')} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
