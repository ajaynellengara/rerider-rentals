'use client'

import { useActionState } from 'react'
import { createSupportTicketAction, requestExtensionAction, requestReturnAction, type RiderActionState } from '@/features/rider/actions'
import { Button } from '@/components/ui/button'

export function ReturnRequestForm({ bookingId, minimumOdometer }: { bookingId: string; minimumOdometer?: number | null }) {
  const [state, action, pending] = useActionState<RiderActionState, FormData>(requestReturnAction, { success: false })
  return <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <input type="hidden" name="bookingId" value={bookingId} />
    <div><h2 className="font-semibold text-slate-900">Request a return appointment</h2><p className="mt-1 text-sm text-slate-500">Operations will confirm your return time and location. Your rental stays active until the handover inspection is completed.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Preferred date<input name="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)} required className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      <label className="text-sm font-medium text-slate-700">Preferred time<input name="preferredTime" type="time" required className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Preferred return location<input name="preferredLocation" defaultValue="ReRider Kochi hub" required maxLength={255} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      <label className="text-sm font-medium text-slate-700">Current odometer <span className="font-normal text-slate-400">(optional)</span><input name="odometerReading" type="number" min={minimumOdometer ?? 0} inputMode="numeric" className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Vehicle condition declaration<textarea name="conditionDeclaration" required minLength={5} maxLength={2000} rows={3} placeholder="Describe the current condition and any issues to report." className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Additional notes <span className="font-normal text-slate-400">(optional)</span><textarea name="riderNotes" maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
    </div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
    <Button disabled={pending}>{pending ? 'Sending request…' : 'Send return request'}</Button>
  </form>
}

export function SupportRequestForm() {
  const [state, action, pending] = useActionState<RiderActionState, FormData>(createSupportTicketAction, { success: false })
  return <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div><h2 className="font-semibold text-slate-900">Contact operations</h2><p className="mt-1 text-sm text-slate-500">For urgent safety issues, call the operations team using the contact details in your agreement.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Topic<select name="category" className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"><option value="VEHICLE_ISSUE">Vehicle issue</option><option value="PAYMENT">Payment</option><option value="RETURN">Return</option><option value="ACCOUNT">Account</option><option value="OTHER">Other</option></select></label>
      <label className="text-sm font-medium text-slate-700">Priority<select name="priority" className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3"><option value="MEDIUM">Normal</option><option value="HIGH">High</option><option value="LOW">Low</option></select></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Subject<input name="subject" required minLength={4} maxLength={200} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">What happened?<textarea name="message" required minLength={10} maxLength={3000} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
    </div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
    <Button disabled={pending}>{pending ? 'Sending…' : 'Send support request'}</Button>
  </form>
}


export function ExtensionRequestForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState<RiderActionState, FormData>(requestExtensionAction, { success: false })
  return <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <input type="hidden" name="bookingId" value={bookingId} />
    <div><h3 className="font-semibold text-slate-900">Request an extension</h3><p className="mt-1 text-xs text-slate-500">Operations checks the vehicle schedule. The agreed daily rate is used; the return date changes only after approval and payment.</p></div>
    <div className="flex flex-wrap items-end gap-3"><label className="text-xs font-medium text-slate-700">Additional days<input name="additionalDays" type="number" min="1" max="30" defaultValue="1" required className="mt-1 block h-10 w-32 rounded-lg border border-slate-300 px-3 text-sm" /></label><Button disabled={pending}>{pending ? 'Sending…' : 'Request extension'}</Button></div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
  </form>
}
