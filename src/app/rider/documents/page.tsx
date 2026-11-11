import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { FileCheck2, ReceiptText, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderProfileDetails } from '@/services/rider-portal'

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default async function RiderDocumentsPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/documents')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5 text-sm text-slate-600">Documents are temporarily unavailable because the rental database could not be reached.</CardContent></Card>
  const result = await getRiderProfileDetails(session.userId)
  if (!result) return <Card><CardContent className="p-5 text-sm text-slate-600">Your rider profile is not linked to this account.</CardContent></Card>
  const receipts = await db.select({ payment: schema.payments, bookingNumber: schema.bookings.bookingNumber })
    .from(schema.payments).innerJoin(schema.bookings, eq(schema.bookings.id, schema.payments.bookingId))
    .where(eq(schema.payments.riderId, result.profile.id)).orderBy(desc(schema.payments.createdAt))
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Records</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Documents & receipts</h1><p className="mt-1 text-sm text-slate-500">Private verification records and recorded payment receipts.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-orange-600" />Verification documents</CardTitle></CardHeader><CardContent className="space-y-3">{result.documents.length ? result.documents.map((doc) => <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="font-medium">{label(doc.documentType)}</p><p className="mt-1 text-xs text-slate-500">{doc.expiryDate ? `Expires ${doc.expiryDate}` : 'No expiry recorded'}</p></div><Badge variant={doc.verificationStatus === 'VERIFIED' ? 'success' : doc.verificationStatus === 'REJECTED' || doc.verificationStatus === 'EXPIRED' ? 'destructive' : 'warning'}>{label(doc.verificationStatus)}</Badge></div>) : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">Your document submission status will appear here. Contact operations to submit identity documents securely.</p>}<p className="text-xs text-slate-500">Document downloads will be available once private file storage is configured.</p></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-orange-600" />Payment receipts</CardTitle></CardHeader><CardContent className="space-y-3">{receipts.length ? receipts.map(({ payment, bookingNumber }) => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div><p className="font-medium">{label(payment.paymentType)} · {bookingNumber}</p><p className="mt-1 text-xs text-slate-500">{payment.paymentNumber} · {payment.paidAt?.toLocaleDateString('en-IN') ?? 'Date pending'}</p></div><div className="text-right"><p className="font-semibold">₹{Number(payment.amount).toLocaleString('en-IN')}</p><Badge variant={payment.paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>{label(payment.paymentStatus)}</Badge></div></div>) : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">No receipts have been recorded yet.</p>}<Link href="/rider/payments" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700"><FileCheck2 className="h-4 w-4" />View payment and deposit ledger</Link></CardContent></Card>
  </div>
}

