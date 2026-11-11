import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { CheckCircle2, CircleHelp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection, db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getRiderSupportTickets } from '@/services/rider-portal'
import { SupportRequestForm } from '@/features/rider/components/rider-forms'
import { EmergencyAssistance } from '@/features/rider/components/emergency-assistance'

export default async function RiderSupportPage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/support')
  if (session.role !== 'RIDER') redirect('/admin')
  const phone = process.env.RERIDER_SUPPORT_PHONE?.trim() ?? ''
  const whatsapp = process.env.RERIDER_SUPPORT_WHATSAPP?.trim() ?? ''
  const health = await checkDatabaseConnection()
  if (!health.connected) return <div className="space-y-4"><EmergencyAssistance phone={phone} whatsapp={whatsapp} /><Card><CardContent className="p-5 text-sm text-slate-600">General support requests are temporarily unavailable because the rental database could not be reached.</CardContent></Card></div>
  const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
  if (!profile) return <Card><CardContent className="p-5 text-sm text-slate-600">Your rider profile is not linked to this account.</CardContent></Card>
  const tickets = await getRiderSupportTickets(profile.id)
  const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Help center</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Support</h1><p className="mt-1 text-sm text-slate-500">Emergency help and normal rental enquiries.</p></div><EmergencyAssistance phone={phone} whatsapp={whatsapp} /><section className="space-y-3"><div><h2 className="font-semibold text-slate-900">Contact Support</h2><p className="mt-1 text-sm text-slate-500">For rental, payment, account, or general questions.</p></div><SupportRequestForm /></section>
    <section className="space-y-3"><h2 className="font-semibold text-slate-900">Your requests</h2>{tickets.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">You have no open support requests.</p> : tickets.map(({ ticket, bookingNumber }) => <Card key={ticket.id}><CardContent className="flex flex-wrap items-start justify-between gap-3 p-4"><div className="flex gap-3"><CircleHelp className="mt-0.5 h-4 w-4 text-orange-600" /><div><p className="font-semibold text-slate-800">{ticket.subject}</p><p className="mt-1 text-xs text-slate-500">{ticket.ticketNumber} · {label(ticket.category)}{bookingNumber ? ` · ${bookingNumber}` : ''}</p><p className="mt-2 text-xs text-slate-500">Submitted {ticket.createdAt.toLocaleDateString('en-IN')}</p></div></div><Badge variant={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'success' : 'warning'}>{ticket.status === 'RESOLVED' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}{label(ticket.status)}</Badge></CardContent></Card>)}</section>
    <p className="text-xs text-slate-500">For immediate danger, contact local emergency services first.</p>
  </div>
}

