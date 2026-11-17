import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowRight, CalendarClock, ClipboardCheck, MapPin, PhoneCall } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderRentals } from '@/services/bookings'
import { getRiderExtensionRequests, getRiderReturnRequests } from '@/services/rider-portal'
import { ReturnRequestForm } from '@/features/rider/components/rider-forms'
import { getRiderPortalData } from '@/lib/google-sheets'

const dateTime = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      }).format(value)
    : 'Not confirmed'

export default async function RiderReturnsPage() {
  const session = await getSession()
  if (!session) redirect('/api/dev/login?role=rider&next=/rider/returns')
  if (session.role !== 'RIDER') redirect('/api/dev/login?role=rider&next=/rider/returns')

  // 1. Check Google Sheets for active rental
  try {
    const portalData = await getRiderPortalData(session.email)
    if (portalData?.activeRental && portalData?.vehicle) {
      const rental = portalData.activeRental
      const vehicle = portalData.vehicle
      return (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rental lifecycle</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Returns</h1>
            <p className="mt-1 text-sm text-slate-500">
              Schedule your scooter return and inspection at Kochi Hub.
            </p>
          </div>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-blue-950">Active Scooter Rental</CardTitle>
                  <p className="mt-1 text-xs text-blue-800">
                    {rental.rentalId} · {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber})
                  </p>
                </div>
                <Badge variant="success">Active Rental</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 text-blue-700" />
                  <div>
                    <span className="text-xs text-slate-500">Expected return date</span>
                    <p className="font-semibold text-slate-900">{rental.endDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-blue-700" />
                  <div>
                    <span className="text-xs text-slate-500">Return hub</span>
                    <p className="font-semibold text-slate-900">Kochi Hub · Ernakulam Central</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-2">
                <p className="font-semibold text-slate-900 text-xs">Return procedure checklist:</p>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                  <li>Return the vehicle with a full fuel tank to avoid refueling deductions.</li>
                  <li>Operations field staff will conduct a joint handover inspection and record final odometer.</li>
                  <li>Upon inspection approval, your ₹4,000 security deposit is refunded to your payment method.</li>
                </ul>
              </div>

              <a
                href={`https://wa.me/919847012345?text=${encodeURIComponent(
                  `Hi ReRider Operations, I am ${session.name || 'a rider'} (${rental.rentalId}). I would like to schedule my scooter return for ${vehicle.registrationNumber}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Contact Operations to Schedule Return</span>
              </a>
            </CardContent>
          </Card>
        </div>
      )
    }
  } catch (err) {
    console.warn('[RiderReturnsPage] Google Sheets check error:', err)
  }

  // 2. Database Fallback
  let profile = null
  let rentals: Awaited<ReturnType<typeof getRiderRentals>> = []
  let requests: Awaited<ReturnType<typeof getRiderReturnRequests>> = []
  let extensions: Awaited<ReturnType<typeof getRiderExtensionRequests>> = []

  try {
    const health = await checkDatabaseConnection()
    if (health.connected) {
      const [found] = await db
        .select({ id: schema.riderProfiles.id })
        .from(schema.riderProfiles)
        .where(eq(schema.riderProfiles.userId, session.userId))
        .limit(1)
      profile = found || null

      if (profile) {
        const [r, req, ext] = await Promise.all([
          getRiderRentals(profile.id),
          getRiderReturnRequests(profile.id),
          getRiderExtensionRequests(profile.id),
        ])
        rentals = r
        requests = req
        extensions = ext
      }
    }
  } catch (err) {
    console.warn('[RiderReturnsPage] Database error:', err)
  }

  const active = rentals.find((rental) => rental.status === 'ACTIVE' || rental.status === 'OVERDUE')
  const openRequest = requests.find(
    ({ request }) => request.status === 'REQUESTED' || request.status === 'CONFIRMED'
  )
  const openExtension =
    active &&
    extensions.find(
      ({ extension }) =>
        extension.bookingId === active.bookingId &&
        ['PENDING', 'APPROVED_AWAITING_PAYMENT'].includes(extension.status)
    )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rental lifecycle</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Returns</h1>
        <p className="mt-1 text-sm text-slate-500">
          Request a time, get operations confirmation, then complete an in-person inspection.
        </p>
      </div>

      {openRequest && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Return appointment</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  {openRequest.bookingNumber} · {openRequest.manufacturer} {openRequest.vehicleName}
                </p>
              </div>
              <Badge variant={openRequest.request.status === 'CONFIRMED' ? 'success' : 'warning'}>
                {openRequest.request.status === 'CONFIRMED' ? 'Appointment confirmed' : 'Awaiting confirmation'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <p className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 text-orange-600" />
              <span>
                <span className="text-xs text-slate-500">Requested time</span>
                <br />
                <strong>
                  {dateTime(
                    openRequest.request.status === 'CONFIRMED'
                      ? openRequest.request.confirmedReturnAt
                      : openRequest.request.preferredReturnAt
                  )}
                </strong>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-orange-600" />
              <span>
                <span className="text-xs text-slate-500">Return location</span>
                <br />
                <strong>{openRequest.request.confirmedLocation ?? openRequest.request.preferredLocation}</strong>
              </span>
            </p>
            <p className="sm:col-span-2 text-xs text-slate-600">
              {openRequest.request.adminNotes ??
                'Please keep the vehicle and keys with you until operations completes the return inspection. Your rental and deposit remain open until then.'}
            </p>
          </CardContent>
        </Card>
      )}

      {active && !openRequest && !openExtension && (
        <ReturnRequestForm bookingId={active.bookingId} minimumOdometer={active.startingOdometer} />
      )}
      {active && openRequest && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Your rental remains active until the operations team records the physical handover and inspection.
        </div>
      )}
      {active && openExtension && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Resolve the extension request before scheduling a return appointment.
        </div>
      )}
      {!active && (
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <ClipboardCheck className="mt-0.5 h-5 w-5 text-slate-400" />
            <div>
              <h2 className="font-semibold">No active rental to return</h2>
              <p className="mt-1 text-sm text-slate-600">
                When a rental is handed over to you, you can request a return appointment here.
              </p>
              <Link
                href="/rider/my-rental"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-700"
              >
                View rental history <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
