import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getRiderPortalData } from '@/lib/google-sheets'
import { LiveRiderDashboard } from '@/features/rider/components/live-rider-dashboard'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DirectSheetBookingForm } from '@/features/bookings/components/direct-sheet-booking-form'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function RiderDashboardPage() {
  const session = await getSession()
  if (!session) {
    redirect('/api/dev/login?role=rider&next=/rider')
  }
  if (session.role !== 'RIDER') {
    redirect('/api/dev/login?role=rider&next=/rider')
  }

  // 1. Primary Source: Google Sheets operations data
  try {
    const portalData = await getRiderPortalData(session.email)
    if (portalData) {
      return (
        <LiveRiderDashboard
          initialData={portalData}
          userEmail={session.email}
          userName={session.name || 'Rider'}
        />
      )
    }
  } catch (err) {
    console.warn('[RiderDashboard] Google Sheets fetch error, trying DB fallback:', err)
  }

  // 2. Resilient Database Fallback
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

        <footer className="border-t border-slate-200 pt-5 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Need help?</p>
          <Link href="/rider/support" className="mt-1 inline-flex text-orange-700 hover:text-orange-900">
            Emergency assistance and contact support →
          </Link>
          <p className="mt-3 text-xs">ReRider Rentals · Kochi</p>
        </footer>
      </div>
    )
  }

  let profile = null
  try {
    const [found] = await db
      .select()
      .from(schema.riderProfiles)
      .where(eq(schema.riderProfiles.userId, session.userId))
      .limit(1)
    profile = found || null
  } catch (err) {
    console.warn('[RiderDashboard] Database fallback error:', err)
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Your rider profile is not linked to this account yet. Please contact operations.
        </div>
      </div>
    )
  }

  return (
    <LiveRiderDashboard
      initialData={null}
      userEmail={session.email}
      userName={profile.fullName || session.name || 'Rider'}
    />
  )
}
