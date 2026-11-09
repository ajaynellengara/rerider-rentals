import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { ArrowRight, Bike, CalendarDays, CircleHelp, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { checkDatabaseConnection } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderRentals } from '@/services/bookings'

export default async function RiderDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider')
  if (session.role !== 'RIDER') redirect('/admin')
  const database = await checkDatabaseConnection()
  if (!database.connected) return <Card><CardContent className="p-5"><h1 className="font-semibold">Rider rentals are temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">The rental database is offline. Please try again after the operations database is restored.</p></CardContent></Card>
  const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  const rentals = profile ? await getRiderRentals(profile.id) : []
  const current = rentals.find((rental) => ['ACTIVE', 'CONFIRMED', 'PENDING', 'EXTENSION_PENDING', 'OVERDUE'].includes(rental.status))

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3">
      <div><h1 className="text-xl font-bold text-slate-900">Welcome, {profile?.fullName ?? session.name}</h1><p className="mt-1 text-xs text-slate-500">Kochi rider portal</p></div>
      {profile?.verificationStatus === 'VERIFIED' ? <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" /> KYC verified</Badge> : <Badge variant="warning">KYC {profile?.verificationStatus?.replaceAll('_', ' ') ?? 'not linked'}</Badge>}
    </div>

    {current ? <Card className="overflow-hidden border-slate-800 bg-slate-900 text-white">
      <CardHeader className="pb-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-orange-300">{current.status === 'ACTIVE' ? 'Active rental' : 'Rental request'}</span><Badge variant={current.status === 'ACTIVE' ? 'success' : 'warning'}>{current.status.replaceAll('_', ' ')}</Badge></div><CardTitle className="mt-2 text-xl text-white">{current.vehicleName}<span className="ml-2 block text-sm font-normal text-slate-300">{current.registrationNumber}</span></CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/10 p-3 text-xs">
          <p><span className="text-slate-300">Package</span><br /><strong>{current.packageName}</strong></p>
          <p><span className="text-slate-300">Rental dates</span><br /><strong>{current.startDate} – {current.endDate}</strong></p>
          <p><span className="text-slate-300">Agreed rate</span><br /><strong>₹{current.dailyRate.toLocaleString('en-IN')} / day</strong></p>
          <p><span className="text-slate-300">Refundable deposit</span><br /><strong>₹{current.depositAmount.toLocaleString('en-IN')}</strong></p>
        </div>
        <Link href="/rider/my-rental"><Button size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">View rental details<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></Link>
      </CardContent>
    </Card> : <Card><CardContent className="flex flex-col items-start gap-3 p-5">
      <div className="flex items-center gap-2"><Bike className="h-5 w-5 text-orange-600" /><h2 className="font-semibold">No current rental</h2></div>
      <p className="text-sm text-slate-600">Browse available, compliant vehicles and send a request for operations to review.</p>
      <Link href="/rider/my-rental"><Button>Browse rentals<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
    </CardContent></Card>}

    <div className="grid grid-cols-2 gap-3">
      <Link href="/rider/my-rental"><Card className="h-full hover:border-orange-300"><CardContent className="flex h-full flex-col justify-between gap-4 p-4"><CalendarDays className="h-4 w-4 text-orange-600" /><span className="text-sm font-medium">My rental and requests</span></CardContent></Card></Link>
      <Card className="h-full"><CardContent className="flex h-full flex-col justify-between gap-4 p-4"><CircleHelp className="h-4 w-4 text-slate-500" /><span className="text-sm font-medium">Kochi fleet support</span><span className="text-xs text-slate-500">Contact details are provided by operations.</span></CardContent></Card>
    </div>
  </div>
}
