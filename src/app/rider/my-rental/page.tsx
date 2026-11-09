import Link from 'next/link'
import { Bike, CalendarDays, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { checkDatabaseConnection } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getAvailableRentalOptions, getRiderRentals } from '@/services/bookings'
import { RentalRequestForm } from '@/features/bookings/components/rental-request-form'

const currency = (value: number) => `₹${value.toLocaleString('en-IN')}`

export default async function MyRentalPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/my-rental')
  if (session.role !== 'RIDER') redirect('/admin')
  const database = await checkDatabaseConnection()
  if (!database.connected) return <Card><CardHeader><CardTitle>Rentals are temporarily unavailable</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">The rental database is offline. Your booking requests and rental records have not been changed. Please try again later.</p></CardContent></Card>

  const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <Card><CardHeader><CardTitle>Rider profile needed</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">Your account is not linked to a rider profile yet. Contact operations to complete setup.</p></CardContent></Card>

  const [rentals, options] = await Promise.all([getRiderRentals(profile.id), getAvailableRentalOptions()])
  return <div className="space-y-6">
    <div>
      <Link href="/rider" className="text-sm text-slate-500 hover:text-slate-900">← Rider home</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">My rental</h1>
      <p className="mt-1 text-sm text-slate-500">Booking requests, active rentals, and your agreed rental prices.</p>
    </div>

    {rentals.length > 0 && <section className="space-y-3" aria-label="Your bookings">
      {rentals.map((rental) => <Card key={rental.bookingId}>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div><CardTitle>{rental.vehicleName}</CardTitle><p className="mt-1 text-xs text-slate-500">{rental.registrationNumber} · {rental.bookingNumber}</p></div>
          <Badge variant={rental.status === 'ACTIVE' ? 'success' : rental.status === 'CANCELLED' ? 'destructive' : 'warning'}>{rental.status.replaceAll('_', ' ')}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm md:grid-cols-3">
            <p><span className="text-xs text-slate-500">Package</span><br /><strong>{rental.packageName} · {rental.durationDays} days</strong></p>
            <p><span className="text-xs text-slate-500">Dates</span><br /><strong>{rental.startDate} – {rental.endDate}</strong></p>
            <p><span className="text-xs text-slate-500">Rate</span><br /><strong>{currency(rental.dailyRate)} / day</strong></p>
            <p><span className="text-xs text-slate-500">Rental total</span><br /><strong>{currency(rental.totalRentalPrice)}</strong></p>
            <p><span className="text-xs text-slate-500">Remaining rent</span><br /><strong>{currency(rental.remainingBalance)}</strong></p>
            <p><span className="text-xs text-slate-500">Refundable deposit</span><br /><strong>{currency(rental.depositAmount)}</strong></p>
          </div>
          {rental.assignmentId && <p className="flex items-center gap-2 text-sm text-slate-600"><Bike className="h-4 w-4" /> Handover odometer: {rental.startingOdometer?.toLocaleString('en-IN') ?? '—'} km</p>}
          {rental.status === 'PENDING' && <p className="text-sm text-amber-800">Operations is reviewing your request. No payment is recorded until the team confirms it.</p>}
          {rental.status === 'CONFIRMED' && <p className="flex items-center gap-2 text-sm text-emerald-800"><ShieldCheck className="h-4 w-4" /> Confirmed. The operations team will arrange payment and vehicle handover.</p>}
        </CardContent>
      </Card>)}
    </section>}

    <section className="space-y-3">
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-orange-600" /><h2 className="text-lg font-bold text-slate-900">Request a rental</h2></div>
      {profile.verificationStatus !== 'VERIFIED' || profile.accountStatus !== 'ACTIVE'
        ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your profile must be active and KYC verified before you can request a rental. Current status: {profile.verificationStatus.replaceAll('_', ' ')}.</p>
        : <RentalRequestForm options={options} />}
    </section>
    {rentals.length === 0 && <p className="text-sm text-slate-500">No rental requests yet.</p>}
  </div>
}
