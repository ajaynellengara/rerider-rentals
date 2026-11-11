import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { RiderVehicleDetailsView } from '@/features/rider/components/vehicle-details-view'

export default async function RiderVehicleDetailsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/vehicles')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5 text-sm text-slate-600">Vehicle details are temporarily unavailable because the rental database could not be reached.</CardContent></Card>
  const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <Card><CardContent className="p-5 text-sm text-slate-600">Your rider profile is not linked to this account yet.</CardContent></Card>
  return <RiderVehicleDetailsView riderId={profile.id} />
}

