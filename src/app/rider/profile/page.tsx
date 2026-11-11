import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'
import { checkDatabaseConnection } from '@/lib/db'
import { getRiderProfileDetails } from '@/services/rider-portal'

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const masked = (value: string | null) => value ? `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : 'Not provided'

export default async function RiderProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login?next=/rider/profile')
  if (session.role !== 'RIDER') redirect('/admin')
  const health = await checkDatabaseConnection()
  if (!health.connected) return <Card><CardContent className="p-5 text-sm text-slate-600">Your profile is temporarily unavailable because the rental database could not be reached.</CardContent></Card>
  const result = await getRiderProfileDetails(session.userId)
  if (!result) return <Card><CardContent className="p-5 text-sm text-slate-600">Your rider profile is not linked to this account.</CardContent></Card>
  const { profile, user, documents } = result
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Account</p><h1 className="mt-1 text-2xl font-bold text-slate-900">My profile</h1><p className="mt-1 text-sm text-slate-500">Your personal and verification details.</p></div><Badge variant={profile.verificationStatus === 'VERIFIED' ? 'success' : profile.verificationStatus === 'REJECTED' ? 'destructive' : 'warning'}>{label(profile.verificationStatus)}</Badge></div>
    <Card><CardHeader><CardTitle>Personal information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Info label="Full name" value={profile.fullName} /><Info label="Mobile" value={profile.phone} /><Info label="Email" value={user.email} /><Info label="Date of birth" value={new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${profile.dateOfBirth}T00:00:00Z`))} /><Info label="Address" value={`${profile.addressLine1}${profile.addressLine2 ? `, ${profile.addressLine2}` : ''}, ${profile.city}, ${profile.state} ${profile.pincode}`} /><Info label="Account status" value={label(profile.accountStatus)} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Emergency contact</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><Info label="Name" value={profile.emergencyContactName} /><Info label="Mobile" value={profile.emergencyContactPhone} /><Info label="Relationship" value={profile.emergencyContactRelation} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Verification documents</CardTitle></CardHeader><CardContent className="space-y-3">{profile.rejectionReason && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Operations note: {profile.rejectionReason}</p>}{documents.length ? documents.map((doc) => <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-sm font-semibold text-slate-800">{label(doc.documentType)}</p><p className="mt-1 text-xs text-slate-500">{masked(doc.documentNumber)}{doc.expiryDate ? ` · Expires ${doc.expiryDate}` : ''}</p></div><Badge variant={doc.verificationStatus === 'VERIFIED' ? 'success' : doc.verificationStatus === 'REJECTED' || doc.verificationStatus === 'EXPIRED' ? 'destructive' : 'warning'}>{label(doc.verificationStatus)}</Badge></div>) : <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">No documents have been submitted yet. Contact operations for the secure document submission process.</p>}<p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">Identity document files stay private. This account view never exposes their storage links.</p></CardContent></Card>
  </div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value || '—'}</p></div>
}
