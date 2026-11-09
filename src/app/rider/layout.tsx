'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bike,
  CreditCard,
  FileText,
  Home,
  LogOut,
  PhoneCall,
  User,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { logoutAction } from '@/features/bookings/actions';

const riderNavItems = [
  { name: 'Home', href: '/rider', icon: Home },
  { name: 'My Rental', href: '/rider/my-rental', icon: Bike },
  { name: 'Payments', href: '/rider/payments', icon: CreditCard },
  { name: 'Issues', href: '/rider/maintenance', icon: Wrench },
  { name: 'Profile', href: '/rider/profile', icon: User },
];

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Mobile-Friendly Top Bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow">
            RO
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-none">RideOps</div>
            <div className="text-[10px] text-slate-500 font-medium">Rider Portal • Kochi</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 text-[10px]">
            Rider Portal
          </Badge>
          <form action={logoutAction}>
          <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto max-w-md p-4 md:max-w-3xl">{children}</div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-1 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {riderNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/rider'
                ? pathname === '/rider'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-3 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-0.5', isActive ? 'text-blue-600' : 'text-slate-500')} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
