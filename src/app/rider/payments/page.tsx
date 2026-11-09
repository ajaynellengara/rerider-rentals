import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default async function RiderPaymentsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/payments')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5"><h1 className="font-semibold">Payment history is temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">The rental database is offline. Please try again later.</p></CardContent></Card>

  const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <Card><CardContent className="p-5 text-sm text-slate-600">Your rider account is not linked to a rental profile yet.</CardContent></Card>
  const payments = await db.select({ payment: schema.payments, bookingNumber: schema.bookings.bookingNumber })
    .from(schema.payments).innerJoin(schema.bookings, eq(schema.bookings.id, schema.payments.bookingId))
    .where(eq(schema.payments.riderId, profile.id)).orderBy(desc(schema.payments.createdAt))
  const deposits = await db.select({ transaction: schema.depositTransactions, bookingNumber: schema.bookings.bookingNumber })
    .from(schema.depositTransactions).innerJoin(schema.bookings, eq(schema.bookings.id, schema.depositTransactions.bookingId))
    .where(eq(schema.depositTransactions.riderId, profile.id)).orderBy(desc(schema.depositTransactions.createdAt))

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900">Payments</h1><p className="mt-1 text-sm text-slate-500">Rental receipts and the refundable security deposit ledger.</p></div>
    <section className="space-y-3"><h2 className="font-semibold text-slate-900">Receipts</h2>
      {!payments.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">No payments have been recorded.</p> : payments.map(({ payment, bookingNumber }) => <Card key={payment.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-medium">{label(payment.paymentType)} · {bookingNumber}</p><p className="mt-1 text-xs text-slate-500">{payment.paymentNumber} · {payment.paidAt?.toLocaleDateString('en-IN') ?? 'Pending date'}{payment.transactionReference ? ` · ${payment.transactionReference}` : ''}</p></div>
        <div className="text-right"><p className="font-semibold">₹{Number(payment.amount).toLocaleString('en-IN')}</p><Badge variant={payment.paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>{label(payment.paymentStatus)}</Badge></div>
      </CardContent></Card>)}
    </section>
    <section className="space-y-3"><h2 className="font-semibold text-slate-900">Deposit ledger</h2>
      {!deposits.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">No security deposit transactions have been recorded.</p> : deposits.map(({ transaction, bookingNumber }) => <Card key={transaction.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-medium">{label(transaction.transactionType)} · {bookingNumber}</p><p className="mt-1 text-xs text-slate-500">{transaction.settlementNotes ?? 'Security deposit movement'}</p></div>
        <div className="text-right"><p className="font-semibold">₹{Number(transaction.amount).toLocaleString('en-IN')}</p><p className="text-xs text-slate-500">Balance: ₹{Number(transaction.runningBalance).toLocaleString('en-IN')}</p></div>
      </CardContent></Card>)}
    </section>
  </div>
}
