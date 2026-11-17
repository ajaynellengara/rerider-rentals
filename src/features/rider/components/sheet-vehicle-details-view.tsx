import Link from 'next/link'
import { ChevronLeft, Bike, Gauge, Fuel, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SheetInspection, SheetPackage, SheetRental, SheetVehicle } from '@/lib/google-sheets/types'
import { VehicleHandoverGallery, type HandoverPhoto } from '@/features/rider/components/vehicle-handover-gallery'

interface SheetVehicleDetailsViewProps {
  vehicle: SheetVehicle
  rental: SheetRental
  pkg: SheetPackage | null
  inspection: SheetInspection | null
}

const displayDate = (date: string) => {
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(
      new Date(`${date}T00:00:00Z`)
    )
  } catch {
    return date
  }
}

export function SheetVehicleDetailsView({ vehicle, rental, pkg, inspection }: SheetVehicleDetailsViewProps) {
  const galleryPhotos: HandoverPhoto[] = (inspection?.photoUrls || []).map((url, idx) => ({
    id: `photo-${idx}`,
    label: idx === 0 ? 'Front view' : idx === 1 ? 'Rear view' : `View ${idx + 1}`,
    src: url,
    caption: `Handover inspection photo ${idx + 1}`,
  }))

  return (
    <div className="space-y-5">
      <Link
        href="/rider"
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-700 hover:text-blue-900"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      {/* Hero Blue Gradient Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900 text-white shadow-xl shadow-blue-900/20 border border-blue-400/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {rental.rentalStatus.replaceAll('_', ' ')}
          </span>
          <span className="text-xs font-mono font-bold bg-blue-950/50 px-2.5 py-1 rounded-lg border border-white/10 text-blue-200">
            {rental.rentalId}
          </span>
        </div>

        <div>
          <p className="text-xs font-medium text-blue-200">Assigned Vehicle</p>
          <h1 className="mt-0.5 text-2xl font-extrabold text-white tracking-tight">
            {vehicle.brand} {vehicle.model} ({vehicle.manufacturingYear})
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-block px-2.5 py-1 bg-black/40 rounded text-xs font-mono font-bold tracking-wider text-yellow-300 border border-white/15">
              {vehicle.registrationNumber}
            </span>
            <span className="text-xs text-blue-200">
              {pkg?.packageName || 'Commercial Rental'} • {pkg?.durationDays || 14} Days
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/25 backdrop-blur-md p-3 text-xs border border-white/10 sm:grid-cols-4">
          <div>
            <span className="text-blue-200 text-[11px]">Rental start</span>
            <p className="font-bold text-white mt-0.5">{displayDate(rental.startDate)}</p>
          </div>
          <div>
            <span className="text-blue-200 text-[11px]">Expected return</span>
            <p className="font-bold text-white mt-0.5">{displayDate(rental.endDate)}</p>
          </div>
          <div>
            <span className="text-blue-200 text-[11px]">Fuel Type</span>
            <p className="font-bold text-white mt-0.5">{vehicle.fuelType}</p>
          </div>
          <div>
            <span className="text-blue-200 text-[11px]">Handover</span>
            <p className="font-bold text-white mt-0.5">
              {inspection ? displayDate(inspection.inspectionDate.slice(0, 10)) : displayDate(rental.startDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Handover Inspection Metrics */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-600" /> Handover Inspection & Metrics
            </CardTitle>
            {inspection && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Inspected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {inspection ? (
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-slate-500 text-[11px] block">Odometer at Handover</span>
                <span className="text-lg font-bold text-blue-950">
                  {inspection.odometerReading.toLocaleString('en-IN')} km
                </span>
                <span className="text-[10px] text-blue-700 block mt-0.5">100 km/day daily allowance</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500 text-[11px] block">Fuel Level at Handover</span>
                <span className="text-lg font-bold text-emerald-950 flex items-center gap-1.5">
                  <Fuel className="h-4 w-4 text-emerald-600" /> {inspection.fuelLevel} Full
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Return at same level</span>
              </div>
              <Info label="Vehicle condition" value={inspection.vehicleCondition} />
              <Info label="Inspection reference" value={inspection.inspectionId} />
              <Info label="Handover time" value={inspection.inspectionDate} />
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Inspection notes</span>
                <p className="mt-1 font-medium text-slate-800 text-sm">
                  {inspection.damageNotes || 'Vehicle inspected in clean, operational condition. No damages noted.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No handover inspection record linked to this assignment yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Technical Vehicle Specifications */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bike className="h-5 w-5 text-blue-600" /> Technical Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Manufacturer" value={vehicle.brand} />
          <Info label="Model & Variant" value={vehicle.model} />
          <Info label="Manufacturing Year" value={String(vehicle.manufacturingYear)} />
          <Info label="Registration Number" value={vehicle.registrationNumber} />
          <Info label="Fuel Type" value={vehicle.fuelType} />
          <Info label="Current Status" value={vehicle.currentStatus} />
        </CardContent>
      </Card>

      {/* Handover Photographs */}
      {galleryPhotos.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Handover Photographs</CardTitle>
            <p className="text-xs text-slate-500">Original photos taken during handover inspection.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <VehicleHandoverGallery photos={galleryPhotos} />
          </CardContent>
        </Card>
      )}

      {/* Footer Support Banner */}
      <footer className="rounded-xl bg-blue-50/80 border border-blue-200 p-4 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sm">Need road assistance or emergency support?</p>
          <p className="text-blue-700 mt-0.5">Kochi Operations Hub is available 24/7 for active rentals.</p>
        </div>
        <Link
          href="/rider/support"
          className="px-3.5 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-sm transition"
        >
          Contact Support
        </Link>
      </footer>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
      <span className="text-[11px] text-slate-500 block">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}
