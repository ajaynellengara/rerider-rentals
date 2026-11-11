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
import { DirectSheetBookingForm } from '@/features/bookings/components/direct-sheet-booking-form'

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
  if (!health.connected) {
    return (
      <div className="space-y-6">
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rider Portal</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome to ReRider Rentals</h1>
              <p className="mt-1 text-sm text-slate-500">Kochi Hub (Ernakulam Central) • Direct Operations Booking</p>
            </div>
            <Badge variant="success">Online Operations</Badge>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Available Scooter & Packages</h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Instant Booking
            </span>
          </div>
          <DirectSheetBookingForm />
        </section>
        <RiderFooter />
      </div>
    );
  }

  const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <><Card><CardContent className="p-5 text-sm text-slate-600">Your rider profile is not linked to this account yet. Please contact operations.</CardContent></Card><RiderFooter /></>

  const rentals = await getRiderRentals(profile.id)
  const current = rentals.find((rental) => ['ACTIVE', 'EXTENSION_PENDING', 'OVERDUE'].includes(rental.status))
  const pending = !current && rentals.find((rental) => activeStatuses.includes(rental.status))
  const status = accountStatus(profile)

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rider home</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile.fullName}</h1>
            <p className="mt-1 text-sm text-slate-500">{profile.city}, {profile.state}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Current rental</h2>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Live Status
          </span>
        </div>
        {current ? (
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900 text-white shadow-xl shadow-blue-900/20 border border-blue-400/30">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {current.status.replaceAll('_', ' ')}
                  </div>
                  <CardTitle className="mt-2 text-2xl font-extrabold text-white tracking-tight">
                    {current.vehicleName} ({current.manufacturingYear})
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-0.5 bg-black/30 rounded text-xs font-mono font-bold tracking-wider text-yellow-300 border border-white/10">
                      {current.registrationNumber}
                    </span>
                    <span className="text-xs text-blue-200">Assigned Bike</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-amber-300 block">Remaining</span>
                  <span className="text-lg font-extrabold text-amber-300">
                    {remainingDays(current.endDate)} Days
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/25 backdrop-blur-md p-3 text-xs md:grid-cols-4 border border-white/10">
                <div>
                  <span className="text-blue-200 text-[11px]">Package</span>
                  <p className="font-bold text-white mt-0.5">{current.packageName}</p>
                  <p className="text-[10px] text-blue-300">{rupees(current.dailyRate)} / day</p>
                </div>
                <div>
                  <span className="text-blue-200 text-[11px]">Rental start</span>
                  <p className="font-bold text-white mt-0.5">{dateLabel(current.startDate)}</p>
                </div>
                <div>
                  <span className="text-blue-200 text-[11px]">Expected return</span>
                  <p className="font-bold text-white mt-0.5">{dateLabel(current.endDate)}</p>
                </div>
                <div>
                  <span className="text-blue-200 text-[11px]">Meter & limit</span>
                  <p className="font-bold text-white mt-0.5">Odometer Logged</p>
                  <p className="text-[10px] text-emerald-300">100 km / day limit</p>
                </div>
              </div>
              <Link
                href="/rider/vehicles"
                className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                <span>View Details</span>
                <ArrowRight className="h-4 w-4 text-blue-900" />
              </Link>
            </CardContent>
          </Card>
        ) : pending ? (
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Bike className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Rental request in progress</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Your {pending.packageName} request is {pending.status.toLowerCase().replaceAll('_', ' ')}. Vehicle details will appear after assignment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Bike className="mt-0.5 h-5 w-5 text-slate-400" />
              <div>
                <h3 className="font-semibold text-slate-900">You don&apos;t have an active rental.</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {status.label === 'Active'
                    ? 'Contact ReRider support to find an available rental package.'
                    : 'Your account must be approved and active before you can rent a vehicle.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {status.label === 'Pending Approval' && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
            <p className="text-sm text-slate-700">
              Your account is waiting for administrator verification. Rental features will be available after approval.
            </p>
          </CardContent>
        </Card>
      )}

      {status.label === 'Dormant / Inactive' && (
        <Card>
          <CardContent className="p-4 text-sm text-slate-700">
            Your account is currently dormant or inactive. Rental actions are unavailable. Contact ReRider support for assistance.
          </CardContent>
        </Card>
      )}

      <RiderFooter />
    </div>
  )
}

function RiderFooter() {
  return (
    <footer className="border-t border-slate-200 pt-5 text-sm text-slate-500">
      <p className="font-semibold text-slate-700">Need help?</p>
      <Link href="/rider/support" className="mt-1 inline-flex text-orange-700 hover:text-orange-900">
        Emergency assistance and contact support →
      </Link>
      <p className="mt-3 text-xs">ReRider Rentals · Kochi</p>
    </footer>
  )
}
