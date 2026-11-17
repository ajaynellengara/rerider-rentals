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
