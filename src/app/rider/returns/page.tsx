import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowRight, CalendarClock, ClipboardCheck, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderRentals } from '@/services/bookings'
import { getRiderExtensionRequests, getRiderReturnRequests } from '@/services/rider-portal'
import { ReturnRequestForm } from '@/features/rider/components/rider-forms'

const dateTime = (value: Date | null) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(value) : 'Not confirmed'

export default async function RiderReturnsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/returns')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5"><h1 className="font-semibold">Return requests are temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">The rental database is offline. Your rental has not been changed.</p></CardContent></Card>
  const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <Card><CardContent className="p-5 text-sm text-slate-600">Your account is not linked to a rider profile yet.</CardContent></Card>
  const [rentals, requests, extensions] = await Promise.all([getRiderRentals(profile.id), getRiderReturnRequests(profile.id), getRiderExtensionRequests(profile.id)])
  const active = rentals.find((rental) => rental.status === 'ACTIVE' || rental.status === 'OVERDUE')
  const openRequest = requests.find(({ request }) => request.status === 'REQUESTED' || request.status === 'CONFIRMED')
  const openExtension = active && extensions.find(({ extension }) => extension.bookingId === active.bookingId && ['PENDING', 'APPROVED_AWAITING_PAYMENT'].includes(extension.status))
  return <div className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rental lifecycle</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Returns</h1><p className="mt-1 text-sm text-slate-500">Request a time, get operations confirmation, then complete an in-person inspection.</p></div>
    {openRequest && <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>Return appointment</CardTitle><p className="mt-1 text-xs text-slate-500">{openRequest.bookingNumber} · {openRequest.manufacturer} {openRequest.vehicleName}</p></div><Badge variant={openRequest.request.status === 'CONFIRMED' ? 'success' : 'warning'}>{openRequest.request.status === 'CONFIRMED' ? 'Appointment confirmed' : 'Awaiting confirmation'}</Badge></div></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><p className="flex items-start gap-2"><CalendarClock className="mt-0.5 h-4 w-4 text-orange-600" /><span><span className="text-xs text-slate-500">Requested time</span><br /><strong>{dateTime(openRequest.request.status === 'CONFIRMED' ? openRequest.request.confirmedReturnAt : openRequest.request.preferredReturnAt)}</strong></span></p><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-orange-600" /><span><span className="text-xs text-slate-500">Return location</span><br /><strong>{openRequest.request.confirmedLocation ?? openRequest.request.preferredLocation}</strong></span></p><p className="sm:col-span-2 text-xs text-slate-600">{openRequest.request.adminNotes ?? 'Please keep the vehicle and keys with you until operations completes the return inspection. Your rental and deposit remain open until then.'}</p></CardContent></Card>}
    {active && !openRequest && !openExtension && <ReturnRequestForm bookingId={active.bookingId} minimumOdometer={active.startingOdometer} />}
    {active && openRequest && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Your rental remains active until the operations team records the physical handover and inspection.</div>}
    {active && openExtension && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Resolve the extension request before scheduling a return appointment.</div>}
    {!active && <Card><CardContent className="flex items-start gap-3 p-5"><ClipboardCheck className="mt-0.5 h-5 w-5 text-slate-400" /><div><h2 className="font-semibold">No active rental to return</h2><p className="mt-1 text-sm text-slate-600">When a rental is handed over to you, you can request a return appointment here.</p><Link href="/rider/my-rental" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-700">View rental history <ArrowRight className="h-4 w-4" /></Link></div></CardContent></Card>}
    <section className="space-y-3"><h2 className="font-semibold text-slate-900">Return history</h2>{requests.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No return appointments yet.</p> : requests.map(({ request, bookingNumber, manufacturer, vehicleName }) => <Card key={request.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-slate-800">{manufacturer} {vehicleName}</p><p className="mt-1 text-xs text-slate-500">{bookingNumber} · Preferred {dateTime(request.preferredReturnAt)}</p></div><Badge variant={request.status === 'COMPLETED' ? 'success' : request.status === 'CANCELLED' ? 'outline' : request.status === 'CONFIRMED' ? 'success' : 'warning'}>{request.status.replaceAll('_', ' ')}</Badge></CardContent></Card>)}</section>
  </div>
}


