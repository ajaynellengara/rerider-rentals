import { redirect } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSession, requireAdmin } from '@/lib/auth/session'
import { checkDatabaseConnection } from '@/lib/db'
import { getAdminReturnRequests } from '@/services/rider-portal'
import { confirmReturnAction } from '@/features/rider/actions'

const format = (value: Date | null) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(value) : '—'

export default async function AdminReturnsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/admin/returns')
  await requireAdmin()
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5 text-sm text-slate-600">Return requests are unavailable because the operations database could not be reached.</CardContent></Card>
  const requests = await getAdminReturnRequests()
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Operations</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Return appointments</h1><p className="mt-1 text-sm text-slate-500">Confirm a return time and location. Close rentals only after the physical inspection.</p></div>
    {requests.length === 0 ? <Card><CardContent className="p-6 text-sm text-slate-500">No rider return appointment requests yet.</CardContent></Card> : requests.map(({ request, booking, rider, user, vehicle }) => <Card key={request.id}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{rider.fullName} · {vehicle.manufacturer} {vehicle.model}</h2><p className="mt-1 text-xs text-slate-500">{request.id.slice(0, 8).toUpperCase()} · {booking.bookingNumber} · {user.phone}</p></div><Badge variant={request.status === 'COMPLETED' ? 'success' : request.status === 'CANCELLED' ? 'outline' : request.status === 'CONFIRMED' ? 'success' : 'warning'}>{request.status.replaceAll('_', ' ')}</Badge></div>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-xs text-slate-500">Requested appointment</span><br /><strong>{format(request.preferredReturnAt)}</strong></p><p><span className="text-xs text-slate-500">Requested location</span><br /><strong>{request.preferredLocation}</strong></p><p><span className="text-xs text-slate-500">Condition declaration</span><br />{request.conditionDeclaration}</p><p><span className="text-xs text-slate-500">Odometer (preliminary)</span><br />{request.odometerReading?.toLocaleString('en-IN') ?? 'Not provided'}</p></div>
      {request.status === 'REQUESTED' ? <form action={confirmReturnAction} className="grid gap-3 rounded-xl border border-orange-100 p-4 sm:grid-cols-2"><input type="hidden" name="requestId" value={request.id} /><p className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:col-span-2"><CalendarClock className="h-4 w-4 text-orange-600" />Confirm appointment</p><label className="text-xs font-medium text-slate-700">Confirmed date<input name="confirmedDate" type="date" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-700">Confirmed time<input name="confirmedTime" type="time" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-700 sm:col-span-2">Confirmed location<input name="confirmedLocation" defaultValue={request.preferredLocation} required maxLength={255} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-xs font-medium text-slate-700 sm:col-span-2">Rider instructions<textarea name="adminNotes" maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" /></label><button className="h-10 rounded-lg bg-[#fc8019] px-4 text-sm font-semibold text-[#282c3f] sm:col-span-2">Confirm return appointment</button></form> : request.status === 'CONFIRMED' ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Confirmed for {format(request.confirmedReturnAt)} at {request.confirmedLocation}. Complete the usual return inspection in Bookings to close the rental.</p> : null}
    </CardContent></Card>)}
  </div>
}
