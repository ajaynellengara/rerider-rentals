'use client'

import { useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bike, CalendarDays, Check, ChevronDown,
  CircleDollarSign, ClipboardCheck, Clock3, CreditCard, Gauge, LayoutDashboard,
  MapPin, Menu, MoreHorizontal, Search, ShieldCheck, Users, Wrench,
} from 'lucide-react'

type View = 'overview' | 'fleet' | 'bookings' | 'handover' | 'riders' | 'payments' | 'my-rental' | 'rider-payments'
type Role = 'admin' | 'rider'

const adminNav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fleet', label: 'Fleet', icon: Bike },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'handover', label: 'Handover & returns', icon: ClipboardCheck },
  { id: 'riders', label: 'Riders & verification', icon: Users },
  { id: 'payments', label: 'Payments', icon: CircleDollarSign },
]
const riderNav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'my-rental', label: 'My rental', icon: Bike },
  { id: 'rider-payments', label: 'Payments', icon: CreditCard },
]
const vehicles = [
  { name: 'Honda Dio', plate: 'KL-00-DEMO-01', km: '8,420 km', status: 'Available', color: 'emerald' },
  { name: 'TVS Jupiter', plate: 'KL-00-DEMO-02', km: '12,180 km', status: 'On rental', color: 'blue' },
  { name: 'Honda Activa', plate: 'KL-00-DEMO-03', km: '6,905 km', status: 'Inspection', color: 'amber' },
]
const bookings = [
  { name: 'Arun K.', package: '14 days', date: 'Today, 10:30 AM', state: 'Awaiting review', color: 'amber' },
  { name: 'Meera S.', package: '26 days', date: 'Tomorrow, 9:00 AM', state: 'Confirmed', color: 'blue' },
  { name: 'Rahul P.', package: '14 days', date: 'Nov 14, 11:00 AM', state: 'Ready for handover', color: 'emerald' },
]

function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const styles: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[color] ?? styles.slate}`}>{children}</span>
}

function Stat({ label, value, note, icon: Icon, up = true }: { label: string; value: string; note: string; icon: typeof Bike; up?: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between"><p className="text-sm text-slate-500">{label}</p><span className="rounded-xl bg-orange-50 p-2 text-orange-700"><Icon className="h-4 w-4" /></span></div>
    <div className="mt-4 flex items-end justify-between"><p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p><span className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-700' : 'text-amber-700'}`}>{up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{note}</span></div>
  </div>
}

function Overview({ role }: { role: Role }) {
  const isRider = role === 'rider'
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">{isRider ? 'Monday, November 10' : 'Monday, November 10, 2026'}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{isRider ? 'Welcome back, Arun' : 'Good morning, Ajay'}</h1><p className="mt-1 text-sm text-slate-500">{isRider ? 'Here’s what’s happening with your rental.' : 'Here’s your fleet snapshot for today.'}</p></div><button className="flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-slate-900 shadow-sm"><CalendarDays className="h-4 w-4" /> {isRider ? 'Rental details' : 'Today'} <ChevronDown className="h-4 w-4" /></button></div>
    {isRider ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Stat label="Rental status" value="Active" note="Until Nov 24" icon={Bike} /><Stat label="Days remaining" value="14 days" note="On schedule" icon={Clock3} /><Stat label="Next payment" value="₹6,300" note="Due Nov 24" icon={CreditCard} up={false} /></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Fleet vehicles" value="08" note="2 added this month" icon={Bike} /><Stat label="Active rentals" value="05" note="Across 3 packages" icon={Activity} /><Stat label="Pending requests" value="03" note="Needs review" icon={CalendarDays} up={false} /><Stat label="Collected this month" value="₹42,500" note="12.8% vs last month" icon={CircleDollarSign} /></div>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{isRider ? 'Your current rental' : 'Today’s activity'}</h2><p className="mt-1 text-xs text-slate-500">{isRider ? 'Rental details and next steps' : 'A quick look at operations'}</p></div><button className="text-xs font-semibold text-orange-700">View all</button></div>{isRider ? <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-white p-3 text-orange-700 shadow-sm"><Bike className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">Honda Dio</p><p className="text-xs text-slate-500">KL-00-DEMO-02 · Monthly package</p></div></div><Badge color="emerald">Active rental</Badge></div> : <div className="mt-4 divide-y divide-slate-100">{bookings.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{item.name.split(' ').map((part) => part[0]).join('')}</span><div><p className="text-sm font-semibold text-slate-800">{item.name}<span className="ml-2 font-normal text-slate-400">· {item.package}</span></p><p className="mt-0.5 text-xs text-slate-500">{item.date}</p></div></div><Badge color={item.color}>{item.state}</Badge></div>)}</div>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{isRider ? 'Rental progress' : 'Fleet availability'}</h2><p className="mt-1 text-xs text-slate-500">{isRider ? 'Your booking journey' : 'Vehicle status right now'}</p></div><MoreHorizontal className="h-5 w-5 text-slate-400" /></div>{isRider ? <div className="mt-5 space-y-4">{[['Booking confirmed', true], ['Payment recorded', true], ['Vehicle handover', true], ['Rental return', false]].map(([label, done]) => <div key={String(label)} className="flex items-center gap-3"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 text-slate-400'}`}>{done ? <Check className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><span className={`text-sm ${done ? 'font-medium text-slate-800' : 'text-slate-400'}`}>{String(label)}</span></div>)}</div> : <div className="mt-5 space-y-4">{[['Available', 3, 'bg-emerald-500'], ['On rental', 4, 'bg-blue-500'], ['Inspection', 1, 'bg-amber-400']].map(([label, count, color]) => <div key={String(label)}><div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-600">{String(label)}</span><span className="font-semibold text-slate-800">{String(count)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${String(color)}`} style={{ width: `${Number(count) * 12.5}%` }} /></div></div>)}<div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><Wrench className="h-4 w-4 shrink-0" /> 1 vehicle is waiting for inspection</div></div>}</section>
    </div>
  </>
}

function DataTable({ view }: { view: View }) {
  const rows = (view === 'fleet' ? vehicles : bookings) as Array<{ name: string; color: string; plate?: string; km?: string; status?: string; package?: string; date?: string; state?: string }>
  const title = view === 'fleet' ? 'Fleet' : view === 'bookings' ? 'Bookings' : view === 'handover' ? 'Handover & returns' : view === 'riders' ? 'Riders & verification' : view === 'payments' || view === 'rider-payments' ? 'Payments' : 'My rental'
  return <div><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Operations</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">Sample preview data · changes are disabled</p></div><button className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-slate-900">{view === 'fleet' ? 'Add vehicle' : view === 'bookings' ? 'New booking' : view === 'riders' ? 'Review queue' : 'View details'}</button></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-3"><Stat label={view === 'fleet' ? 'Total vehicles' : 'In progress'} value={view === 'fleet' ? '08' : '03'} note="Live preview" icon={view === 'fleet' ? Bike : Activity} /><Stat label="Needs attention" value="02" note="Review items" icon={ClipboardCheck} up={false} /><Stat label="Completed this month" value="12" note="Updated today" icon={Check} /></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className="h-9 w-64 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none" placeholder={`Search ${title.toLowerCase()}...`} /></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600">All statuses <ChevronDown className="ml-2 inline h-3.5 w-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{(view === 'fleet' ? ['Vehicle', 'Registration', 'Odometer', 'Status', ''] : view === 'riders' ? ['Rider', 'Requested', 'Documents', 'Status', ''] : ['Customer', 'Package / item', 'Schedule', 'Status', '']).map((head) => <th key={head} className="px-5 py-3 font-semibold">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item, index) => <tr key={item.name} className="hover:bg-slate-50/80"><td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.name}</div><div className="mt-0.5 text-xs text-slate-500">{view === 'fleet' ? 'Scooter · Petrol' : `RR-2026-${String(index + 21).padStart(4, '0')}`}</div></td><td className="px-5 py-4 text-slate-600">{item.plate ?? item.package}</td><td className="px-5 py-4 text-slate-600">{item.km ?? item.date}</td><td className="px-5 py-4"><Badge color={item.color}>{item.status ?? item.state}</Badge></td><td className="px-5 py-4 text-right"><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Details</button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>Showing 3 sample records</span><span>Page 1 of 1</span></div></div></div>
}

export default function PreviewConsole() {
  const [role, setRole] = useState<Role>('admin')
  const [view, setView] = useState<View>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const nav = role === 'admin' ? adminNav : riderNav
  const activeView = role === 'rider' && !riderNav.some((item) => item.id === view) ? 'overview' : view
  const selectRole = (next: Role) => { setRole(next); setView('overview'); setMobileNav(false) }
  return <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
    <div className="flex min-h-screen">
      <aside className={`${mobileNav ? 'fixed inset-y-0 left-0 z-30 flex' : 'hidden'} w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:relative lg:flex`}><div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-slate-900">R</div><div><p className="font-bold tracking-tight">rerider</p><p className="text-[10px] text-slate-500">KOCHI · KERALA</p></div></div><div className="px-4 pt-5"><p className="px-2 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Workspace</p><nav className="mt-2 space-y-1">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setView(id); setMobileNav(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeView === id ? 'bg-orange-50 text-orange-800' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}{id === 'bookings' && role === 'admin' && <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold">3</span>}</button>)}</nav></div><div className="mt-auto p-4"><div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><MapPin className="h-3.5 w-3.5 text-orange-600" />Kochi hub</div><p className="mt-1 text-[11px] text-slate-500">Fleet operations · IST</p></div></div></aside>
      <div className="min-w-0 flex-1"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu className="h-5 w-5" /></button><span className="text-sm font-semibold text-slate-800">{activeView === 'overview' ? 'Overview' : nav.find((item) => item.id === activeView)?.label}</span><span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 sm:inline-flex">Preview · read only</span></div><div className="flex items-center gap-2"><span className="hidden text-xs text-slate-500 sm:inline">View as</span><button onClick={() => selectRole('admin')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Admin</button><button onClick={() => selectRole('rider')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${role === 'rider' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Rider</button><span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">{role === 'admin' ? 'A' : 'R'}</span></div></header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><p className="text-xs leading-relaxed text-amber-900"><strong>Safe frontend preview.</strong> All records are fictional sample data. This page is read-only and does not sign you into the real admin or rider accounts.</p></div>{activeView === 'overview' ? <Overview role={role} /> : <DataTable view={activeView} />}</main>
        <footer className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-6 text-[11px] text-slate-400 sm:px-6 lg:px-8"><span>ReRider Rentals · Frontend preview</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Sample data only</span></footer>
      </div>
    </div>
  </div>
}




