'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bike,
  Home,
  LogOut,
  PhoneCall,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { logoutAction } from '@/features/bookings/actions';

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = [
    { name: 'Home', href: '/rider', icon: Home },
    { name: 'Vehicle Details', href: '/rider/vehicles', icon: Bike },
    { name: 'Support', href: '/rider/support', icon: PhoneCall },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Mobile-Friendly Top Bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow">
            RO
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-none">Rerider</div>
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

      <nav className="border-b border-slate-200 bg-white px-4">
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/rider' ? pathname === '/rider' : pathname?.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium', active ? 'bg-orange-50 text-orange-800' : 'text-slate-600 hover:bg-slate-50')}><Icon className="h-4 w-4" />{item.name}</Link>;
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto max-w-md p-4 md:max-w-3xl">{children}</div>
      </main>
    </div>
  );
}



