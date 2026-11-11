import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Bike, ArrowRight, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderRentals } from '@/services/bookings'

const activeStatuses = ['PENDING', 'CONFIRMED', 'ACTIVE', 'EXTENSION_PENDING', 'OVERDUE']
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
const remainingDays = (endDate: string) => Math.max(0, Math.ceil((Date.parse(`${endDate}T00:00:00Z`) - new Date().setUTCHours(0, 0, 0, 0)) / 86400000))

function accountStatus(profile: { accountStatus: string; verificationStatus: string }) {
  const status = profile.accountStatus.toUpperCase()
  if (['DORMANT', 'INACTIVE', 'SUSPENDED'].includes(status)) return { label: 'Dormant / Inactive', variant: 'destructive' as const }
  if (status !== 'ACTIVE' || profile.verificationStatus !== 'VERIFIED') return { label: 'Pending Approval', variant: 'warning' as const }
  return { label: 'Active', variant: 'success' as const }
}

export default async function RiderDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <><Card><CardContent className="p-5"><h1 className="font-semibold">Rider rentals are temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">The rental database could not be reached. Please try again later.</p></CardContent></Card><RiderFooter /></>

  const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <><Card><CardContent className="p-5 text-sm text-slate-600">Your rider profile is not linked to this account yet. Please contact operations.</CardContent></Card><RiderFooter /></>

  const rentals = await getRiderRentals(profile.id)
  const current = rentals.find((rental) => ['ACTIVE', 'EXTENSION_PENDING', 'OVERDUE'].includes(rental.status))
  const pending = !current && rentals.find((rental) => activeStatuses.includes(rental.status))
  const status = accountStatus(profile)

  return <div className="space-y-6">
    <section className="space-y-2"><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rider home</p><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Welcome, {profile.fullName}</h1><p className="mt-1 text-sm text-slate-500">{profile.city}, {profile.state}</p></div><Badge variant={status.variant}>{status.label}</Badge></div></section>
    <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Current rental</h2>{current ? <Card className="overflow-hidden border-slate-800 bg-slate-900 text-white"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-orange-300">Your assigned vehicle</p><CardTitle className="mt-2 text-xl text-white">{current.vehicleName} ({current.manufacturingYear})</CardTitle><p className="mt-1 text-sm text-slate-300">Registration: {current.registrationNumber}</p></div><Badge variant="success">{current.status.replaceAll('_', ' ')}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3 rounded-xl bg-white/10 p-4 text-sm md:grid-cols-3"><p><span className="text-xs text-slate-300">Package</span><br /><strong>{current.packageName} · {current.durationDays} days</strong></p><p><span className="text-xs text-slate-300">Daily rate</span><br /><strong>{rupees(current.dailyRate)} / day</strong></p><p><span className="text-xs text-slate-300">Rental start</span><br /><strong>{dateLabel(current.startDate)}</strong></p><p><span className="text-xs text-slate-300">Expected return</span><br /><strong>{dateLabel(current.endDate)}</strong></p><p><span className="text-xs text-slate-300">Remaining days</span><br /><strong>{remainingDays(current.endDate)}</strong></p></div><Link href="/rider/vehicles" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-200 hover:text-white">View Vehicle Details <ArrowRight className="h-4 w-4" /></Link></CardContent></Card> : pending ? <Card><CardContent className="flex items-start gap-3 p-5"><Bike className="mt-0.5 h-5 w-5 text-orange-600" /><div><h3 className="font-semibold text-slate-900">Rental request in progress</h3><p className="mt-1 text-sm text-slate-600">Your {pending.packageName} request is {pending.status.toLowerCase().replaceAll('_', ' ')}. Vehicle details will appear after assignment.</p></div></CardContent></Card> : <Card><CardContent className="flex items-start gap-3 p-5"><Bike className="mt-0.5 h-5 w-5 text-slate-400" /><div><h3 className="font-semibold text-slate-900">You don’t have an active rental.</h3><p className="mt-1 text-sm text-slate-600">{status.label === 'Active' ? 'Contact ReRider support to find an available rental package.' : 'Your account must be approved and active before you can rent a vehicle.'}</p></div></CardContent></Card>}</section>
    {status.label === 'Pending Approval' && <Card><CardContent className="flex items-start gap-3 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" /><p className="text-sm text-slate-700">Your account is waiting for administrator verification. Rental features will be available after approval.</p></CardContent></Card>}
    {status.label === 'Dormant / Inactive' && <Card><CardContent className="p-4 text-sm text-slate-700">Your account is currently dormant or inactive. Rental actions are unavailable. Contact ReRider support for assistance.</CardContent></Card>}
    <RiderFooter />
  </div>
}

function RiderFooter() {
  return <footer className="border-t border-slate-200 pt-5 text-sm text-slate-500"><p className="font-semibold text-slate-700">Need help?</p><Link href="/rider/support" className="mt-1 inline-flex text-orange-700 hover:text-orange-900">Emergency assistance and contact support →</Link><p className="mt-3 text-xs">ReRider Rentals · Kochi</p></footer>
}
