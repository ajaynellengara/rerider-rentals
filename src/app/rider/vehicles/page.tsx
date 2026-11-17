import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { RiderVehicleDetailsView } from '@/features/rider/components/vehicle-details-view'
import { getRiderPortalData } from '@/lib/google-sheets'
import { SheetVehicleDetailsView } from '@/features/rider/components/sheet-vehicle-details-view'

export default async function RiderVehicleDetailsPage() {
  const session = await getSession()
  if (!session) {
    if (process.env.NODE_ENV !== 'production') {
      redirect('/api/dev/login?role=rider&next=/rider/vehicles')
    }
    redirect('/login?next=/rider/vehicles')
  }
  if (session.role !== 'RIDER') {
    if (process.env.NODE_ENV !== 'production') {
      redirect('/api/dev/login?role=rider&next=/rider/vehicles')
    }
    redirect('/admin')
  }

  // 1. Check Google Sheets data first
  try {
    const portalData = await getRiderPortalData(session.email)
    if (portalData?.activeRental && portalData?.vehicle) {
      return (
        <SheetVehicleDetailsView
          vehicle={portalData.vehicle}
          rental={portalData.activeRental}
          pkg={portalData.package}
          inspection={portalData.handoverInspection}
        />
      )
    }
  } catch (err) {
    console.warn('[RiderVehicleDetails] Google Sheets fetch error, trying DB fallback:', err)
  }

  // 2. Database Fallback
  const health = await checkDatabaseConnection()
  if (!health.connected) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-slate-600">
          Vehicle details are temporarily unavailable because the rental database could not be reached.
        </CardContent>
      </Card>
    )
  }

  let profile = null
  try {
    const [found] = await db
      .select({ id: schema.riderProfiles.id })
      .from(schema.riderProfiles)
      .where(eq(schema.riderProfiles.userId, session.userId))
      .limit(1)
    profile = found || null
  } catch (err) {
    console.warn('[RiderVehicleDetails] Database fallback error:', err)
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-slate-600">
          Your rider profile is not linked to this account yet.
        </CardContent>
      </Card>
    )
  }

  return <RiderVehicleDetailsView riderId={profile.id} />
}
