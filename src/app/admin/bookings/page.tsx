import { CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection } from '@/lib/db'
import { getAdminBookingQueue } from '@/services/bookings'
import { completeRentalAction, recordBookingPaymentAction, reviewBookingAction, settleDepositAction, startRentalAction } from '@/features/bookings/actions'

export default async function AdminBookingsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/admin/bookings')
  if (!['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) redirect('/rider')
  const database = await checkDatabaseConnection()
  if (!database.connected) return <Card><CardContent className="p-6"><h1 className="font-semibold">Booking operations are temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">The rental database is offline. No booking or payment changes were made.</p></CardContent></Card>

  const bookings = await getAdminBookingQueue()
  const pending = bookings.filter((booking) => booking.status === 'PENDING').length
  const canReview = ['SUPER_ADMIN', 'ADMIN'].includes(session.role)
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="flex items-center gap-2 text-sm font-medium text-orange-700"><CalendarDays className="h-4 w-4" /> Rental operations</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Booking requests</h1><p className="mt-1 text-sm text-slate-500">Review rider eligibility, fleet availability, dates, and frozen prices.</p></div>
      <Badge variant={pending ? 'warning' : 'success'}>{pending} awaiting review</Badge>
    </div>

    {!bookings.length && <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600"><ClipboardList className="h-5 w-5" /> No rental requests have been submitted.</CardContent></Card>}
    <div className="space-y-3">
      {bookings.map((booking) => <Card key={booking.id}>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div><CardTitle>{booking.riderName} · {booking.vehicleName}</CardTitle><p className="mt-1 text-xs text-slate-500">{booking.bookingNumber} · {booking.registrationNumber} · {booking.riderPhone}</p></div>
          <Badge variant={booking.status === 'CONFIRMED' || booking.status === 'ACTIVE' ? 'success' : booking.status === 'CANCELLED' ? 'destructive' : 'warning'}>{booking.status.replaceAll('_', ' ')}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm md:grid-cols-4">
            <p><span className="text-xs text-slate-500">Rider verification</span><br /><strong>{booking.riderStatus.replaceAll('_', ' ')}</strong></p>
            <p><span className="text-xs text-slate-500">Vehicle state</span><br /><strong>{booking.vehicleStatus.replaceAll('_', ' ')}</strong></p>
            <p><span className="text-xs text-slate-500">Package and dates</span><br /><strong>{booking.packageName} · {booking.durationDays} days</strong><br />{booking.startDate} – {booking.endDate}</p>
            <p><span className="text-xs text-slate-500">Agreed pricing</span><br /><strong>₹{booking.total.toLocaleString('en-IN')} rent</strong><br />₹{booking.token.toLocaleString('en-IN')} token · ₹{booking.deposit.toLocaleString('en-IN')} deposit</p>
          </div>
          {booking.status === 'PENDING' && canReview && <div className="flex flex-wrap gap-2">
            <form action={reviewBookingAction.bind(null, 'CONFIRMED')}><input type="hidden" name="bookingId" value={booking.id} /><Button type="submit" disabled={booking.riderStatus !== 'VERIFIED' || booking.vehicleStatus !== 'AVAILABLE'}><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm request</Button></form>
            <form action={reviewBookingAction.bind(null, 'CANCELLED')}><input type="hidden" name="bookingId" value={booking.id} /><Button type="submit" variant="outline">Decline request</Button></form>
            {(booking.riderStatus !== 'VERIFIED' || booking.vehicleStatus !== 'AVAILABLE') && <p className="self-center text-xs text-amber-800">Confirmation requires verified KYC and an available vehicle.</p>}
          </div>}
          {booking.status === 'CONFIRMED' && <p className="text-sm text-emerald-800">Confirmed. Record the token and deposit when received, then complete the handover inspection and assignment before starting the rental.</p>}
          {booking.status === 'CONFIRMED' && canReview && <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-semibold">Payments and handover</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {([
                ['BOOKING_TOKEN', 'Booking token', booking.token],
                ['RENTAL_BALANCE', 'Remaining rental balance', Math.max(0, booking.total - booking.token)],
                ['SECURITY_DEPOSIT', 'Refundable security deposit', booking.deposit],
              ] as const).map(([type, label, amount]) => <form action={recordBookingPaymentAction} key={type} className="space-y-2 rounded-md bg-slate-50 p-3">
                <input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="type" value={type} />
                <p className="text-xs font-medium text-slate-700">{label}: ₹{amount.toLocaleString('en-IN')}</p>
                {booking.paid[type] ? <p className="text-xs text-emerald-700">Recorded: ₹{booking.paid[type].toLocaleString('en-IN')}</p> : <>
                  <select name="method" defaultValue="UPI" className="h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm" aria-label={`${label} payment method`}><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="CARD">Card</option></select>
                  <input name="reference" placeholder="Transaction reference (optional)" className="h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-xs" />
                  <Button type="submit" size="sm" variant="outline" className="w-full">Record received</Button>
                </>}
              </form>)}
            </div>
            {booking.paid.BOOKING_TOKEN && booking.paid.RENTAL_BALANCE && booking.paid.SECURITY_DEPOSIT ? <form action={startRentalAction} className="flex flex-wrap items-end gap-2 rounded-md bg-orange-50 p-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <label className="text-xs font-medium text-slate-700">Handover odometer (km)<input name="startingOdometer" type="number" min="0" required className="mt-1 block h-10 rounded-md border border-slate-300 px-3 text-sm" /></label>
              <Button type="submit" size="sm">Complete handover and start rental</Button>
            </form> : <p className="text-xs text-slate-500">Record the token, rental balance, and refundable deposit after receipt to enable handover.</p>}
          </div>}
          {['ACTIVE', 'OVERDUE'].includes(booking.status) && <form action={completeRentalAction} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-4">
            <input type="hidden" name="bookingId" value={booking.id} />
            <label className="text-xs font-medium text-slate-700">Return odometer (km)<input name="endingOdometer" type="number" min="0" required className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
            <label className="text-xs font-medium text-slate-700">Fuel level (%)<input name="fuelPercentage" type="number" min="0" max="100" defaultValue="50" required className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
            <label className="text-xs font-medium text-slate-700 md:col-span-2">Return condition / damage notes<input name="damagesNoted" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Optional inspection notes" /></label>
            <div className="md:col-span-4"><Button type="submit" variant="outline">Record return inspection and complete rental</Button></div>
          </form>}
          {booking.status === 'COMPLETED' && canReview && booking.depositBalance > 0 && <form action={settleDepositAction} className="space-y-3 rounded-lg border border-slate-200 p-3">
            <input type="hidden" name="bookingId" value={booking.id} />
            <div><h3 className="text-sm font-semibold">Security deposit settlement</h3><p className="text-xs text-slate-500">Remaining refundable liability: ₹{booking.depositBalance.toLocaleString('en-IN')}. Enter the amounts actually refunded or deducted after inspection.</p></div>
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-xs font-medium text-slate-700">Refund amount<input name="refundAmount" type="number" min="0" max={booking.depositBalance} step="0.01" defaultValue={booking.depositBalance} required className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
              <label className="text-xs font-medium text-slate-700">Damage deduction<input name="damageDeduction" type="number" min="0" max={booking.depositBalance} step="0.01" defaultValue="0" required className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
              <label className="text-xs font-medium text-slate-700">Other agreed deduction<input name="penaltyDeduction" type="number" min="0" max={booking.depositBalance} step="0.01" defaultValue="0" required className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
              <label className="text-xs font-medium text-slate-700">Refund method<select name="refundMethod" defaultValue="UPI" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="CARD">Card</option></select></label>
            </div>
            <label className="block text-xs font-medium text-slate-700">Settlement notes / deduction reason<input name="notes" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Required when recording any deduction" /></label>
            <Button type="submit" variant="outline">Record deposit settlement</Button>
          </form>}
        </CardContent>
      </Card>)}
    </div>
  </div>
}

