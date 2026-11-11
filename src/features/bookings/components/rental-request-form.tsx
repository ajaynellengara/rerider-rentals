'use client'

import { useActionState, useState } from 'react'
import { requestRentalAction, type BookingActionState } from '@/features/bookings/actions'
import { Button } from '@/components/ui/button'

type RentalOption = {
  vehicleId: string
  vehicleName: string
  registrationPreview: string
  manufacturingYear: number
  fuelType: string
  vehicleCategory: string
  packageId: string
  packageName: string
  durationDays: number
  dailyRate: number
  totalRentalPrice: number
  tokenAmount: number
  depositAmount: number
}

export function RentalRequestForm({ options, disabled = false }: { options: RentalOption[]; disabled?: boolean }) {
  const [state, action, pending] = useActionState<BookingActionState, FormData>(requestRentalAction, { success: false })
  const today = new Date().toISOString().slice(0, 10)
  if (!options.length) return <p className="rounded-lg border border-dashed p-4 text-sm text-slate-600">There are no compliant vehicles available to request right now. Please check again later.</p>
  return <div className="space-y-4">
    {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <div className="grid gap-3">
      {options.map((option) => <RentalOptionCard key={`${option.vehicleId}-${option.packageId}`} option={option} action={action} pending={pending} disabled={disabled} />)}
    </div>
  </div>
}

function RentalOptionCard({ option, action, pending, disabled }: { option: RentalOption; action: (formData: FormData) => void; pending: boolean; disabled: boolean }) {
  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const returnDate = new Date(`${startDate}T00:00:00.000Z`)
  returnDate.setUTCDate(returnDate.getUTCDate() + option.durationDays - 1)
  const returnDateLabel = Number.isNaN(returnDate.getTime()) ? 'Choose a start date' : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(returnDate)
  return <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="vehicleId" value={option.vehicleId} /><input type="hidden" name="packageId" value={option.packageId} />
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{option.vehicleName}</h3><p className="mt-1 text-xs text-slate-500">{option.registrationPreview} · {option.manufacturingYear} · {option.fuelType} {option.vehicleCategory} · {option.packageName}</p></div><span className="rounded-xl bg-orange-50 p-3 text-orange-700">🛵</span></div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><p><span className="text-xs text-slate-500">Duration</span><br /><strong>{option.durationDays} days</strong></p><p><span className="text-xs text-slate-500">Daily rate</span><br /><strong>₹{option.dailyRate.toLocaleString('en-IN')}</strong></p><p><span className="text-xs text-slate-500">Rental total</span><br /><strong>₹{option.totalRentalPrice.toLocaleString('en-IN')}</strong></p><p><span className="text-xs text-slate-500">Token due after confirmation</span><br /><strong>₹{option.tokenAmount.toLocaleString('en-IN')}</strong></p><p><span className="text-xs text-slate-500">Token credit to rent</span><br /><strong>−₹{option.tokenAmount.toLocaleString('en-IN')}</strong></p><p><span className="text-xs text-slate-500">Refundable deposit</span><br /><strong>₹{option.depositAmount.toLocaleString('en-IN')}</strong></p><p className="col-span-2 border-t border-slate-200 pt-3"><span className="text-xs text-slate-500">Balance + deposit before handover (after token)</span><br /><strong>₹{Math.max(0, option.totalRentalPrice - option.tokenAmount + option.depositAmount).toLocaleString('en-IN')}</strong></p></div>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium text-slate-700">Start date<input name="startDate" type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} required className="mt-1 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><p className="text-xs font-medium text-slate-700">Return date<span className="mt-1 flex h-11 items-center rounded-lg bg-slate-50 px-3 text-sm font-semibold text-slate-900">{returnDateLabel}</span></p></div>
        <Button type="submit" disabled={pending || disabled} className="w-full">{pending ? 'Sending request…' : disabled ? 'Resolve your current rental first' : 'Request this rental'}</Button>
      </form>
}

