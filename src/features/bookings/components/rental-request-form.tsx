'use client'

import { useActionState } from 'react'
import { requestRentalAction, type BookingActionState } from '@/features/bookings/actions'
import { Button } from '@/components/ui/button'

type RentalOption = {
  vehicleId: string
  vehicleName: string
  registrationNumber: string
  packageId: string
  packageName: string
  durationDays: number
  dailyRate: number
  totalRentalPrice: number
  tokenAmount: number
  depositAmount: number
}

export function RentalRequestForm({ options }: { options: RentalOption[] }) {
  const [state, action, pending] = useActionState<BookingActionState, FormData>(requestRentalAction, { success: false })
  const today = new Date().toISOString().slice(0, 10)

  if (!options.length) return <p className="rounded-lg border border-dashed p-4 text-sm text-slate-600">There are no compliant vehicles available to request right now. Please check again later.</p>

  return <div className="space-y-4">
    {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <div className="grid gap-3 md:grid-cols-2">
      {options.map((option) => <form action={action} key={`${option.vehicleId}-${option.packageId}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="vehicleId" value={option.vehicleId} />
        <input type="hidden" name="packageId" value={option.packageId} />
        <div>
          <h3 className="font-semibold text-slate-900">{option.vehicleName}</h3>
          <p className="text-xs text-slate-500">{option.registrationNumber} · {option.packageName}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="text-slate-500">Duration</span><br /><strong>{option.durationDays} days</strong></p>
          <p><span className="text-slate-500">Daily rate</span><br /><strong>₹{option.dailyRate.toLocaleString('en-IN')}</strong></p>
          <p><span className="text-slate-500">Rental total</span><br /><strong>₹{option.totalRentalPrice.toLocaleString('en-IN')}</strong></p>
          <p><span className="text-slate-500">Token · refundable deposit</span><br /><strong>₹{option.tokenAmount.toLocaleString('en-IN')} · ₹{option.depositAmount.toLocaleString('en-IN')}</strong></p>
        </div>
        <label className="block text-xs font-medium text-slate-700">Preferred start date
          <input name="startDate" type="date" min={today} defaultValue={today} required className="mt-1 block h-11 w-full rounded-md border border-slate-300 px-3 text-sm" />
        </label>
        <Button type="submit" disabled={pending} className="w-full">{pending ? 'Sending request…' : 'Request this rental'}</Button>
      </form>)}
    </div>
  </div>
}
