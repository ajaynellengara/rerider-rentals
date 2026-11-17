import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderPortalData } from '@/lib/google-sheets'

const label = (value: string) =>
  value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default async function RiderPaymentsPage() {
  const session = await getSession()
  if (!session) {
    redirect('/api/dev/login?role=rider&next=/rider/payments')
  }
  if (session.role !== 'RIDER') {
    redirect('/api/dev/login?role=rider&next=/rider/payments')
  }

  // 1. Primary Source: Google Sheets Payments tab
  try {
    const portalData = await getRiderPortalData(session.email)
    if (portalData && portalData.payments.length > 0) {
      const receipts = portalData.payments.filter((p) => p.paymentType !== 'SECURITY_DEPOSIT')
      const deposits = portalData.payments.filter(
        (p) => p.paymentType === 'SECURITY_DEPOSIT' || p.paymentType === 'DEPOSIT_REFUND'
      )

      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
            <p className="mt-1 text-sm text-slate-500">Rental receipts and the refundable security deposit ledger.</p>
          </div>
          <section className="space-y-3">
            <h2 className="font-semibold text-slate-900">Receipts</h2>
            {!receipts.length ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
                No rental charge receipts have been recorded yet.
              </p>
            ) : (
              receipts.map((payment) => (
                <Card key={payment.paymentId}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">
                        {label(payment.paymentType)} · {payment.rentalId}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.paymentId} · {payment.paymentDate}
                        {payment.transactionReference ? ` · ${payment.transactionReference}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{payment.amount.toLocaleString('en-IN')}</p>
                      <Badge variant={payment.paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>
                        {label(payment.paymentStatus)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold text-slate-900">Deposit ledger</h2>
            {!deposits.length ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
                No security deposit transactions have been recorded.
              </p>
            ) : (
              deposits.map((payment) => (
                <Card key={payment.paymentId}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">
                        {label(payment.paymentType)} · {payment.rentalId}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{payment.notes ?? 'Security deposit liability'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{payment.amount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">Balance: ₹{payment.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </section>
        </div>
      )
    }
  } catch (err) {
    console.warn('[RiderPayments] Google Sheets fetch error, trying DB fallback:', err)
  }

  // 2. Database Fallback
  const health = await checkDatabaseConnection()
  if (!health.connected) {
    return (
      <Card>
        <CardContent className="p-5">
          <h1 className="font-semibold">Payment history is temporarily unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">The rental database is offline. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  let profile = null
  type PaymentRow = { payment: typeof schema.payments.$inferSelect; bookingNumber: string }
  type DepositRow = { transaction: typeof schema.depositTransactions.$inferSelect; bookingNumber: string }
  let payments: PaymentRow[] = []
  let deposits: DepositRow[] = []

  try {
    const [found] = await db
      .select({ id: schema.riderProfiles.id })
      .from(schema.riderProfiles)
      .where(eq(schema.riderProfiles.userId, session.userId))
      .limit(1)
    profile = found || null

    if (profile) {
      payments = await db
        .select({ payment: schema.payments, bookingNumber: schema.bookings.bookingNumber })
        .from(schema.payments)
        .innerJoin(schema.bookings, eq(schema.bookings.id, schema.payments.bookingId))
        .where(eq(schema.payments.riderId, profile.id))
        .orderBy(desc(schema.payments.createdAt))

      deposits = await db
        .select({ transaction: schema.depositTransactions, bookingNumber: schema.bookings.bookingNumber })
        .from(schema.depositTransactions)
        .innerJoin(schema.bookings, eq(schema.bookings.id, schema.depositTransactions.bookingId))
        .where(eq(schema.depositTransactions.riderId, profile.id))
        .orderBy(desc(schema.depositTransactions.createdAt))
    }
  } catch (err) {
    console.warn('[RiderPaymentsPage] Database fallback error:', err)
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-slate-600">
          Your rider account is not linked to a rental profile yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Rental receipts and the refundable security deposit ledger.</p>
      </div>
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Receipts</h2>
        {!payments.length ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
            No payments have been recorded.
          </p>
        ) : (
          payments.map(({ payment, bookingNumber }) => (
            <Card key={payment.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {label(payment.paymentType)} · {bookingNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {payment.paymentNumber} · {payment.paidAt?.toLocaleDateString('en-IN') ?? 'Pending date'}
                    {payment.transactionReference ? ` · ${payment.transactionReference}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                  <Badge variant={payment.paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>
                    {label(payment.paymentStatus)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Deposit ledger</h2>
        {!deposits.length ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
            No security deposit transactions have been recorded.
          </p>
        ) : (
          deposits.map(({ transaction, bookingNumber }) => (
            <Card key={transaction.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {label(transaction.transactionType)} · {bookingNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {transaction.settlementNotes ?? 'Security deposit movement'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{Number(transaction.amount).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-500">
                    Balance: ₹{Number(transaction.runningBalance).toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
