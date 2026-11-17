'use client'

import React from 'react'
import Link from 'next/link'
import { Bike, ShieldCheck, RefreshCw, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRiderPolling } from '@/features/rider/hooks/use-rider-polling'
import { RiderPortalData } from '@/lib/google-sheets/types'
import { DirectSheetBookingForm } from '@/features/bookings/components/direct-sheet-booking-form'
import { logoutAction } from '@/features/bookings/actions'

interface LiveRiderDashboardProps {
  initialData: RiderPortalData | null
  userEmail: string
  userName: string
  onVehicleDetails?: () => void
}

const activeStatuses = ['PENDING', 'CONFIRMED', 'ACTIVE', 'EXTENSION_PENDING', 'OVERDUE']
const dateLabel = (date: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(`${date}T00:00:00Z`)
    )
  } catch {
    return date
  }
}
const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
const remainingDays = (endDate: string) => {
  try {
    const parsed = Date.parse(`${endDate}T00:00:00Z`)
    if (Number.isNaN(parsed)) return 0
    return Math.max(0, Math.ceil((parsed - new Date().setUTCHours(0, 0, 0, 0)) / 86400000))
  } catch {
    return 0
  }
}

function computeAccountStatus(rider: RiderPortalData['rider'] | null) {
  if (!rider) return { label: 'Pending Approval', variant: 'warning' as const }
  const status = rider.accountStatus.toUpperCase()
  if (['DORMANT', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    return { label: 'Dormant / Inactive', variant: 'destructive' as const }
  }
  if (status !== 'ACTIVE' || rider.verificationStatus !== 'VERIFIED') {
    return { label: 'Pending Approval', variant: 'warning' as const }
  }
  return { label: '✓ KYC verified', variant: 'success' as const }
}

export function LiveRiderDashboard({ initialData, userEmail, userName, onVehicleDetails }: LiveRiderDashboardProps) {
  const { data, isRefreshing, refresh } = useRiderPolling({
    initialData,
    intervalMs: 20000,
    enabled: true,
  })

  const portal = data || initialData
  const rider = portal?.rider
  const current = portal?.activeRental
  const vehicle = portal?.vehicle
  const pkg = portal?.package
  const status = computeAccountStatus(rider ?? null)

  const odoText = portal?.handoverInspection?.odometerReading
    ? `${portal.handoverInspection.odometerReading.toLocaleString('en-IN')} km`
    : vehicle?.odometer
      ? `${vehicle.odometer.toLocaleString('en-IN')} km`
      : '8,420 km'

  const fuelText = portal?.handoverInspection?.fuelLevel
    ? `Fuel: ${portal.handoverInspection.fuelLevel} • Checked`
    : 'Fuel: 80% • Checked'

  // Find any pending rental if not actively assigned
  const pendingRental = !current && portal?.allRentals?.find((r) => activeStatuses.includes(r.rentalStatus))

  return (
    <div className="space-y-6">
      {/* Rider Welcome Section */}
      <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
          RR
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900">{rider?.name || userName}</h1>
          <p className="truncate text-xs text-slate-500">ReRider Rider • Kochi Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Current Rental Section */}
      <section className="space-y-3">

        {current ? (
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900 text-white shadow-xl shadow-blue-900/20 border border-blue-400/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {current.rentalStatus.replaceAll('_', ' ')}
              </span>

              <button
                type="button"
                onClick={() => refresh()}
                title="Refresh live status from operations sheet"
                aria-label="Refresh status"
                className="p-1.5 text-blue-200 hover:text-white rounded-lg transition"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-300' : ''}`} />
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-blue-200">Assigned Bike</p>
              <h2 className="mt-0.5 text-2xl font-extrabold text-white tracking-tight">
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Honda Dio 110cc'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 bg-black/30 rounded text-xs font-mono font-bold tracking-wider text-yellow-300 border border-white/10">
                  {vehicle?.registrationNumber || 'KL-00-DEMO-02'}
                </span>
                <span className="text-xs text-blue-200">• {vehicle?.manufacturingYear || 2022} Model</span>
              </div>
            </div>

            {/* Dates & Remaining */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 text-center">
              <div className="border-r border-white/10 pr-1">
                <p className="text-[11px] font-medium text-blue-200">Start Date</p>
                <p className="text-xs font-bold text-white mt-0.5">{dateLabel(current.startDate)}</p>
              </div>
              <div className="border-r border-white/10 px-1">
                <p className="text-[11px] font-medium text-blue-200">Return Date</p>
                <p className="text-xs font-bold text-white mt-0.5">{dateLabel(current.endDate)}</p>
              </div>
              <div className="pl-1">
                <p className="text-[11px] font-medium text-amber-300">Days Left</p>
                <p className="text-xs font-extrabold text-amber-300 mt-0.5">
                  {remainingDays(current.endDate)} Days
                </p>
              </div>
            </div>

            {/* Package & Meter Reading */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-[11px] text-blue-200">Package</p>
                <p className="font-bold text-white mt-0.5">{pkg?.packageName || '26-Day Commercial'}</p>
                <p className="text-[10px] text-blue-300">{rupees(current.dailyRate)} / day</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-[11px] text-blue-200">Meter Reading (Odo)</p>
                <p className="font-bold text-white mt-0.5">{odoText}</p>
                <p className="text-[10px] text-emerald-300">{fuelText}</p>
              </div>
            </div>

            {onVehicleDetails ? (
              <button
                type="button"
                onClick={onVehicleDetails}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                <span>View Details</span>
                <Bike className="h-4 w-4 text-blue-900" />
              </button>
            ) : (
              <Link
                href="/rider/vehicles"
                className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                <span>View Details</span>
                <Bike className="h-4 w-4 text-blue-900" />
              </Link>
            )}
          </section>
        ) : pendingRental ? (
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Bike className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Rental request in progress</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Your request ({pendingRental.rentalId}) is{' '}
                  {pendingRental.rentalStatus.toLowerCase().replaceAll('_', ' ')}. Vehicle details will appear after assignment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Bike className="mt-0.5 h-5 w-5 text-slate-400" />
              <div>
                <h3 className="font-semibold text-slate-900">You don&apos;t have an active rental.</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {status.label === 'Active'
                    ? 'Contact ReRider support to find an available rental package.'
                    : 'Your account must be approved and active before you can rent a vehicle.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Direct Booking Form if no active rental */}
      {!current && status.label === 'Active' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Available Scooter & Packages</h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Instant Booking
            </span>
          </div>
          <DirectSheetBookingForm />
        </section>
      )}

      {status.label === 'Pending Approval' && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
            <p className="text-sm text-slate-700">
              Your account is waiting for administrator verification. Rental features will be available after approval.
            </p>
          </CardContent>
        </Card>
      )}

      {status.label === 'Dormant / Inactive' && (
        <Card>
          <CardContent className="p-4 text-sm text-slate-700">
            Your account is currently dormant or inactive. Rental actions are unavailable. Contact ReRider support for assistance.
          </CardContent>
        </Card>
      )}

      <footer className="w-full rounded-xl bg-blue-50/80 border border-slate-200 bg-white p-4 text-xs text-blue-900 ">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm">Need road assistance or emergency support?</p>
            <p className="text-xs text-slate-500 mt-0.5">Kochi Operations Hub is available 24/7 for active rentals.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={"/"}
              className="px-3.5 py-2 bg-gray-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-sm transition"
            >
              Call Hub
            </a>
            <Link
              href="/rider/support"
              className="px-3.5 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-sm transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
