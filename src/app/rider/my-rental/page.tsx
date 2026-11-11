import Link from 'next/link'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { ArrowRight, Bike, CalendarDays, CircleHelp, CreditCard, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderRentals } from '@/services/bookings'
import { getRiderExtensionRequests } from '@/services/rider-portal'
import { ExtensionRequestForm } from '@/features/rider/components/rider-forms'

const currency = (value: number) => `₹${value.toLocaleString('en-IN')}`
const daysRemaining = (endDate: string) => Math.max(0, Math.ceil((Date.parse(endDate) - Date.now()) / 86400000))
const openStatuses = ['PENDING', 'CONFIRMED', 'ACTIVE', 'EXTENSION_PENDING', 'OVERDUE']

export default async function MyRentalPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/my-rental')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardHeader><CardTitle>Rentals are temporarily unavailable</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">The rental database is offline. Your booking requests and rental records have not been changed. Please try again later.</p></CardContent></Card>
  const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <Card><CardHeader><CardTitle>Rider profile needed</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">Your account is not linked to a rider profile yet. Contact operations to complete setup.</p></CardContent></Card>
  const [rentals, extensions] = await Promise.all([getRiderRentals(profile.id), getRiderExtensionRequests(profile.id)])
  const current = rentals.find((rental) => openStatuses.includes(rental.status))
  const eligibleToBrowse = !current && profile.verificationStatus === 'VERIFIED' && profile.accountStatus === 'ACTIVE'
  return <div className="space-y-6">
    <div><Link href="/rider" className="text-sm text-slate-500 hover:text-slate-900">← Rider home</Link><h1 className="mt-2 text-2xl font-bold text-slate-900">My rental</h1><p className="mt-1 text-sm text-slate-500">Your requests, assigned vehicle, payment status and rental history.</p></div>
    {current && (
      <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900 text-white shadow-xl shadow-blue-900/20 border border-blue-400/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {current.status === 'ACTIVE' || current.status === 'OVERDUE' ? 'Current rental' : 'Request in progress'}
              </div>
              <CardTitle className="mt-2 text-2xl font-extrabold text-white tracking-tight">
                {current.vehicleName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2.5 py-0.5 bg-black/30 rounded text-xs font-mono font-bold tracking-wider text-yellow-300 border border-white/10">
                  {current.assignmentId ? current.registrationNumber : 'Registration pending'}
                </span>
                <span className="text-xs text-blue-200">Booking #{current.bookingNumber}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-amber-300 block">Remaining</span>
              <span className="text-lg font-extrabold text-amber-300">
                {daysRemaining(current.endDate)} Days
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/25 backdrop-blur-md p-3 text-xs md:grid-cols-4 border border-white/10">
            <div>
              <span className="text-blue-200 text-[11px]">Package</span>
              <p className="font-bold text-white mt-0.5">{current.packageName}</p>
              <p className="text-[10px] text-blue-300">{currency(current.dailyRate)} / day</p>
            </div>
            <div>
              <span className="text-blue-200 text-[11px]">Expected return</span>
              <p className="font-bold text-white mt-0.5">
                {new Date(`${current.endDate}T00:00:00Z`).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}
              </p>
            </div>
            <div>
              <span className="text-blue-200 text-[11px]">Rental total</span>
              <p className="font-bold text-white mt-0.5">{currency(current.totalRentalPrice)}</p>
              <p className="text-[10px] text-slate-300">Bal: {currency(current.remainingBalance)}</p>
            </div>
            <div>
              <span className="text-blue-200 text-[11px]">Deposit held</span>
              <p className="font-bold text-emerald-400 mt-0.5">{currency(current.depositAmount)}</p>
              <p className="text-[10px] text-emerald-300">Refundable</p>
            </div>
          </div>
          {current.status === 'ACTIVE' || current.status === 'OVERDUE' ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/rider/returns">
                <Button size="sm" className="bg-white text-blue-900 hover:bg-blue-50 font-bold shadow-md">
                  Request return<ArrowRight className="ml-2 h-4 w-4 text-blue-900" />
                </Button>
              </Link>
              <Link href="/rider/support">
                <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Report an issue
                </Button>
              </Link>
              <Link href="/rider/vehicles">
                <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Vehicle details
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-blue-200">
              Operations is reviewing your request. The rental starts only after handover is recorded.
            </p>
          )}
        </CardContent>
      </Card>
    )}
    {current?.status === 'ACTIVE' && <section className="space-y-3"><ExtensionRequestForm bookingId={current.bookingId} />{extensions.filter(({ extension }) => extension.bookingId === current.bookingId).map(({ extension }) => <Card key={extension.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-slate-800">Extension · {extension.additionalDays} days</p><p className="mt-1 text-xs text-slate-500">₹{Number(extension.dailyRateApplied).toLocaleString('en-IN')} / day · ₹{Number(extension.additionalRentalAmount).toLocaleString('en-IN')} · requested return {extension.newEndDate}</p></div><Badge variant={extension.status === 'PAID' ? 'success' : extension.status === 'DECLINED' ? 'destructive' : 'warning'}>{extension.status.replaceAll('_', ' ')}</Badge></CardContent></Card>)}</section>}    {eligibleToBrowse ? <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-start gap-3"><Bike className="mt-0.5 h-5 w-5 text-orange-600" /><div><h2 className="font-semibold text-slate-900">Ready to rent?</h2><p className="mt-1 text-sm text-slate-600">Your profile is verified. Browse compliant vehicles and request an available package.</p></div></div><Link href="/rider/vehicles"><Button>Browse vehicles<ArrowRight className="ml-2 h-4 w-4" /></Button></Link></CardContent></Card> : !current && <Card><CardContent className="flex items-start gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" /><div><h2 className="font-semibold text-slate-900">Verification required</h2><p className="mt-1 text-sm text-slate-600">Complete rider verification before making a rental request.</p><Link href="/rider/profile" className="mt-2 inline-flex text-sm font-semibold text-orange-700">View profile →</Link></div></CardContent></Card>}
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Booking and rental history</h2><Link href="/rider/payments" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700"><CreditCard className="h-4 w-4" />Payments</Link></div>{rentals.length ? rentals.map((rental) => <Card key={rental.bookingId}><CardHeader className="flex-row items-start justify-between gap-3"><div><CardTitle>{rental.vehicleName}</CardTitle><p className="mt-1 text-xs text-slate-500">{rental.assignmentId ? rental.registrationNumber : 'Vehicle registration pending assignment'} · {rental.bookingNumber}</p></div><Badge variant={rental.status === 'ACTIVE' || rental.status === 'COMPLETED' ? 'success' : rental.status === 'CANCELLED' ? 'destructive' : 'warning'}>{rental.status.replaceAll('_', ' ')}</Badge></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm md:grid-cols-3"><p><span className="text-xs text-slate-500">Package</span><br /><strong>{rental.packageName} · {rental.durationDays} days</strong></p><p><span className="text-xs text-slate-500">Booked dates</span><br /><strong>{rental.startDate} – {rental.endDate}</strong></p><p><span className="text-xs text-slate-500">Agreed rate</span><br /><strong>{currency(rental.dailyRate)} / day</strong></p><p><span className="text-xs text-slate-500">Rental total</span><br /><strong>{currency(rental.totalRentalPrice)}</strong></p><p><span className="text-xs text-slate-500">Remaining rent</span><br /><strong>{currency(rental.remainingBalance)}</strong></p><p><span className="text-xs text-slate-500">Deposit balance</span><br /><strong>{currency(rental.depositAmount)}</strong></p></div>{rental.assignmentId && <p className="flex items-center gap-2 text-sm text-slate-600"><Bike className="h-4 w-4" />Handover odometer: {rental.startingOdometer?.toLocaleString('en-IN') ?? '—'} km</p>}{rental.status === 'PENDING' && <p className="text-sm text-amber-800">Operations is reviewing your request. The booking token is recorded only when operations confirms receipt.</p>}{rental.status === 'CONFIRMED' && <p className="flex items-center gap-2 text-sm text-emerald-800"><ShieldCheck className="h-4 w-4" />Confirmed. Payment and vehicle handover are arranged through operations.</p>}</CardContent></Card>) : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No rental requests yet. <Link href="/rider/vehicles" className="font-semibold text-orange-700">Browse available vehicles</Link></p>}</section>
    <div className="grid gap-3 sm:grid-cols-2"><Link href="/rider/documents"><Card className="h-full hover:border-orange-300"><CardContent className="flex items-center gap-3 p-4"><CalendarDays className="h-5 w-5 text-orange-600" /><span className="text-sm font-medium">Documents and receipts</span></CardContent></Card></Link><Link href="/rider/support"><Card className="h-full hover:border-orange-300"><CardContent className="flex items-center gap-3 p-4"><CircleHelp className="h-5 w-5 text-slate-500" /><span className="text-sm font-medium">Get support</span></CardContent></Card></Link></div>
  </div>
}

