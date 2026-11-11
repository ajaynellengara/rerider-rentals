import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRiderActiveVehicleDetails } from '@/services/rider-portal'
import { VehicleHandoverGallery, type HandoverPhoto } from '@/features/rider/components/vehicle-handover-gallery'
import { getHandoverPhotoUrl } from '@/lib/storage'

const displayDate = (date: Date | string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date)
const displayDateTime = (date: Date) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(date)
const titleCase = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export async function RiderVehicleDetailsView({ riderId }: { riderId: string }) {
  const record = await getRiderActiveVehicleDetails(riderId)
  if (!record) return <div className="space-y-4"><Link href="/rider" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"><ChevronLeft className="h-4 w-4" /> Rider home</Link><Card><CardContent className="p-5"><h1 className="font-semibold text-slate-900">No assigned vehicle</h1><p className="mt-1 text-sm text-slate-600">Vehicle details and handover records appear here after your rental is approved and the vehicle is handed over.</p></CardContent></Card></div>

  const { vehicle, booking, package: rentalPackage, assignment, inspection, photos } = record
  const photoLabels: Record<string, string> = { FRONT: 'Front view', FRONT_VIEW: 'Front view', REAR: 'Rear view', REAR_VIEW: 'Rear view', LEFT: 'Left-side view', LEFT_VIEW: 'Left-side view', LEFT_SIDE: 'Left-side view', LEFT_SIDE_VIEW: 'Left-side view', RIGHT: 'Right-side view', RIGHT_VIEW: 'Right-side view', RIGHT_SIDE: 'Right-side view', RIGHT_SIDE_VIEW: 'Right-side view' }
  const galleryPhotos: HandoverPhoto[] = photos.flatMap((photo) => {
    const src = getHandoverPhotoUrl(photo.storageKey)
    if (!src) return []
    const angle = photo.photoAngle.toUpperCase().replaceAll('-', '_').replaceAll(' ', '_')
    return [{ id: photo.id, label: photoLabels[angle] ?? titleCase(photo.photoAngle), src, caption: photo.caption }]
  })

  return <div className="space-y-5">
    <Link href="/rider" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"><ChevronLeft className="h-4 w-4" /> Rider home</Link>
    <header><p className="text-xs font-bold uppercase tracking-[.14em] text-orange-700">Rental {booking.bookingNumber}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Vehicle details</h1><p className="mt-1 text-sm text-slate-500">Your assigned vehicle and original handover record.</p></header>
    <Card><CardHeader><CardTitle>{vehicle.manufacturer} {vehicle.model}{vehicle.variant ? ` ${vehicle.variant}` : ''} ({vehicle.manufacturingYear})</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Manufacturer" value={vehicle.manufacturer} /><Info label="Model" value={vehicle.model} /><Info label="Manufacturing year" value={String(vehicle.manufacturingYear)} /><Info label="Registration number" value={vehicle.registrationNumber} /><Info label="Chassis number" value={vehicle.chassisNumber} /><Info label="Engine number" value={vehicle.engineNumber} /><Info label="Vehicle category" value={titleCase(vehicle.vehicleCategory)} /><Info label="Rental package" value={`${rentalPackage.name} · ${booking.totalDurationDays} days`} /><Info label="Rental period" value={`${displayDate(booking.startDate)} – ${displayDate(booking.endDate)}`} /><Info label="Handover date and time" value={inspection ? displayDateTime(inspection.inspectedAt) : displayDateTime(assignment.assignmentStart)} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Handover inspection</CardTitle></CardHeader><CardContent>{inspection ? <div className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Odometer at handover" value={`${inspection.odometerReading.toLocaleString('en-IN')} km`} /><Info label="Vehicle condition" value={titleCase(inspection.conditionRating)} /><Info label="Cleanliness" value={titleCase(inspection.cleanlinessRating)} /><Info label="Fuel at handover" value={`${inspection.fuelPercentage}%`} /><Info label="Inspection reference" value={inspection.inspectionNumber} /><p className="sm:col-span-2"><span className="text-xs text-slate-500">Inspection notes</span><br /><strong className="font-medium text-slate-800">{inspection.damagesNoted || 'No additional damage noted.'}</strong></p></div> : <p className="text-sm text-slate-600">No handover inspection has been linked to this assignment yet.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Handover photographs</CardTitle><p className="text-sm text-slate-500">Original inspection photos are read-only. Select a photo to view it larger.</p></CardHeader><CardContent><VehicleHandoverGallery photos={galleryPhotos} /></CardContent></Card>
    <footer className="border-t border-slate-200 pt-4 text-sm text-slate-500"><p>Need help with your vehicle? Contact ReRider support from the rider portal.</p></footer>
  </div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <p><span className="text-xs text-slate-500">{label}</span><br /><strong className="font-medium text-slate-900">{value}</strong></p>
}
