import { getRiderByEmail, getRiderById } from './riders'
import { getVehicleById, getAllVehicles, getAvailableVehicles } from './vehicles'
import { getActivePackages, getAllPackages, getPackageById } from './packages'
import { getRiderActiveRental, getRiderRentals } from './rentals'
import { getRiderPayments, getRentalPayments } from './payments'
import { getHandoverInspection, getRentalInspections } from './inspections'
import { RiderPortalData, SheetPackage, SheetVehicle } from './types'

export * from './types'
export * from './client'
export * from './riders'
export * from './vehicles'
export * from './packages'
export * from './rentals'
export * from './payments'
export * from './inspections'

/**
 * Aggregates all Google Sheet operations data for a specific authenticated rider.
 * Identifies the rider exclusively via session email (never trusting client parameters).
 */
export async function getRiderPortalData(email: string): Promise<RiderPortalData | null> {
  const { rider, source } = await getRiderByEmail(email)
  if (!rider) {
    return null
  }

  // Fetch rentals for this rider
  const [{ rentals: allRentals }, { activeRental }] = await Promise.all([
    getRiderRentals(rider.riderId),
    getRiderActiveRental(rider.riderId),
  ])

  // If there's an active rental, fetch associated vehicle, package, and inspection
  let vehicle: SheetVehicle | null = null
  let rentalPackage: SheetPackage | null = null
  let handoverInspection = null

  if (activeRental) {
    const [vehRes, pkgRes, insRes] = await Promise.all([
      activeRental.vehicleId ? getVehicleById(activeRental.vehicleId) : Promise.resolve({ vehicle: null }),
      activeRental.packageId ? getPackageById(activeRental.packageId) : Promise.resolve({ package: null }),
      getHandoverInspection(activeRental.rentalId),
    ])
    vehicle = vehRes.vehicle
    rentalPackage = pkgRes.package
    handoverInspection = insRes.inspection
  }

  // Fetch payments for this rider
  const { payments } = await getRiderPayments(rider.riderId)

  // Fetch available packages for browsing
  const { packages: availablePackages } = await getActivePackages()

  return {
    rider,
    activeRental,
    vehicle,
    package: rentalPackage,
    payments,
    handoverInspection,
    allRentals,
    availablePackages,
    dataSource: source,
    lastSyncedAt: new Date().toISOString(),
  }
}
