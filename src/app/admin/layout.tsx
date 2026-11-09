'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bike,
  Calendar,
  ClipboardList,
  CreditCard,
  FileCheck,
  FileText,
  Home,
  LogOut,
  Receipt,
  Settings,
  ShieldAlert,
  Tag,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { logoutAction } from '@/features/bookings/actions';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Fleet / Vehicles', href: '/admin/vehicles', icon: Bike },
  { name: 'Vehicle Pricing', href: '/admin/pricing', icon: Tag },
  { name: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { name: 'Vehicle Assignments', href: '/admin/assignments', icon: FileCheck },
  { name: 'Verified Riders', href: '/admin/riders', icon: Users },
  { name: 'Financial Ledger', href: '/admin/payments', icon: CreditCard },
  { name: 'Expenses', href: '/admin/expenses', icon: Receipt },
  { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
  { name: 'Accidents & Safety', href: '/admin/accidents', icon: ShieldAlert },
  { name: 'Compliance & Docs', href: '/admin/documents', icon: FileText },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Dark Navy Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-[#0F172A] text-slate-200">
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fc8019] text-[#282c3f] font-black text-lg shadow-md">
              RR
            </div>
            <div>
              <div className="font-bold tracking-tight text-white">ReRider Rentals</div>
              <div className="text-[10px] text-slate-400 font-medium">Kochi Fleet Ops</div>
            </div>
          </div>
          <Badge variant="outline" className="border-blue-500/40 bg-blue-950/60 text-blue-300 text-[10px]">
            Admin
          </Badge>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>Location</span>
            <span className="text-slate-200 font-medium">Kochi, Kerala</span>
          </div>
          <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              Fleet Operations Management
            </h1>
            <Badge variant="success" className="gap-1 text-xs font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Fleet Control
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">Operations Manager</div>
              <div className="text-xs text-slate-500">Kochi Hub</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm border border-blue-200">
              AD
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
