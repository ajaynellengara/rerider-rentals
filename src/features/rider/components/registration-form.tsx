'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerRiderAction, type RiderActionState } from '@/features/rider/actions'
import { Button } from '@/components/ui/button'

const fieldClass = 'mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm'

export default function RegistrationForm() {
  const [state, action, pending] = useActionState<RiderActionState, FormData>(registerRiderAction, { success: false })
  return <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div><h2 className="text-lg font-semibold text-slate-900">Personal details</h2><p className="mt-1 text-sm text-slate-500">Use your own details. Rentals cannot be transferred to another person.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">First name<input name="firstName" autoComplete="given-name" required maxLength={100} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Last name<input name="lastName" autoComplete="family-name" required maxLength={100} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Mobile number<input name="phone" type="tel" autoComplete="tel" required minLength={10} maxLength={20} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Email address<input name="email" type="email" autoComplete="email" required maxLength={255} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Date of birth<input name="dateOfBirth" type="date" required className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Create password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required className={fieldClass} /><span className="mt-1 block text-xs font-normal text-slate-500">At least 12 characters</span></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address<input name="addressLine1" autoComplete="street-address" required maxLength={500} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Area / landmark<input name="addressLine2" maxLength={500} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">City<input name="city" autoComplete="address-level2" defaultValue="Kochi" required maxLength={100} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">PIN code<input name="pincode" inputMode="numeric" autoComplete="postal-code" required pattern="[0-9]{6}" className={fieldClass} /></label>
    </div>
    <div className="border-t border-slate-100 pt-4"><h3 className="font-semibold text-slate-900">Emergency contact</h3><p className="mt-1 text-xs text-slate-500">We use this only if an urgent rental issue requires it.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-medium text-slate-700">Contact name<input name="emergencyContactName" required maxLength={150} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Mobile number<input name="emergencyContactPhone" type="tel" required maxLength={20} className={fieldClass} /></label>
      <label className="text-sm font-medium text-slate-700">Relationship<input name="emergencyContactRelation" required maxLength={50} className={fieldClass} /></label>
    </div>
    <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">New accounts start unverified. Operations must approve your identity and driving licence before you can request a rental.</p>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <Button disabled={pending} className="w-full">{pending ? 'Creating account…' : 'Create rider account'}</Button>
    <p className="text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-orange-700 hover:underline" href="/login">Sign in</Link></p>
  </form>
}
