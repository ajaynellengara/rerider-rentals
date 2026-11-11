import { redirect } from 'next/navigation'
import { ArrowRight, CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSession, requireAdmin } from '@/lib/auth/session'
import { checkDatabaseConnection } from '@/lib/db'
import { getAdminExtensionQueue } from '@/services/rider-portal'
import { reviewExtensionAction } from '@/features/rider/actions'
import { recordBookingPaymentAction } from '@/features/bookings/actions'

export default async function AdminExtensionsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/admin/extensions')
  await requireAdmin()
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5 text-sm text-slate-600">Extension requests are unavailable because the operations database could not be reached.</CardContent></Card>
  const queue = await getAdminExtensionQueue()
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Operations</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Rental extensions</h1><p className="mt-1 text-sm text-slate-500">Review schedule conflicts. The current return date changes only after approval and recorded payment.</p></div>
    {queue.length === 0 ? <Card><CardContent className="p-6 text-sm text-slate-500">No extension requests yet.</CardContent></Card> : queue.map(({ extension, booking, rider, vehicle }) => <Card key={extension.id}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{rider.fullName} · {vehicle.manufacturer} {vehicle.model}</h2><p className="mt-1 text-xs text-slate-500">{booking.bookingNumber} · {extension.additionalDays} additional days</p></div><Badge variant={extension.status === 'PAID' ? 'success' : extension.status === 'DECLINED' ? 'destructive' : extension.status === 'PENDING' ? 'warning' : 'outline'}>{extension.status.replaceAll('_', ' ')}</Badge></div>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3"><p><span className="text-xs text-slate-500">Current return date</span><br /><strong>{extension.previousEndDate}</strong></p><p><span className="text-xs text-slate-500">Requested return date</span><br /><strong>{extension.newEndDate}</strong></p><p><span className="text-xs text-slate-500">Rate and extension amount</span><br /><strong>₹{Number(extension.dailyRateApplied).toLocaleString('en-IN')} × {extension.additionalDays} = ₹{Number(extension.additionalRentalAmount).toLocaleString('en-IN')}</strong></p></div>
      {extension.status === 'PENDING' && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><p className="flex items-center gap-2 text-sm text-slate-600"><CalendarClock className="h-4 w-4 text-orange-600" />Confirm vehicle availability through the extended date.</p><div className="flex gap-2"><form action={reviewExtensionAction.bind(null, 'DECLINE')}><input type="hidden" name="extensionId" value={extension.id} /><Button variant="outline">Decline</Button></form><form action={reviewExtensionAction.bind(null, 'APPROVE')}><input type="hidden" name="extensionId" value={extension.id} /><Button>Approve<ArrowRight className="ml-2 h-4 w-4" /></Button></form></div></div>}
      {extension.status === 'APPROVED_AWAITING_PAYMENT' && <form action={recordBookingPaymentAction} className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-3"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="type" value="EXTENSION" /><p className="text-sm font-semibold text-emerald-900 sm:col-span-3">Approved. Record the extension payment after it is received to confirm the new return date.</p><select name="method" defaultValue="UPI" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="CARD">Card</option></select><input name="reference" placeholder="Transaction reference (optional)" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm" /><Button type="submit">Record ₹{Number(extension.additionalRentalAmount).toLocaleString('en-IN')} received</Button></form>}
    </CardContent></Card>)}
  </div>
}
