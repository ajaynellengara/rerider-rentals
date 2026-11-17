import { fetchTabRecords, SHEET_TABS, SheetRowRecord } from './client'
import { SheetVehicle, VehicleOperationalStatus } from './types'

export function parseVehicleRecord(row: SheetRowRecord): SheetVehicle | null {
  const vehicleId = row['vehicle_id'] || row['vehicleid'] || row['id']
  const regNo = row['registration_number'] || row['reg_number'] || row['reg_no']

  if (!vehicleId || !regNo) {
    return null
  }

  const rawStatus = (row['current_status'] || row['status'] || 'AVAILABLE').toUpperCase()
  const validStatuses: VehicleOperationalStatus[] = [
    'AVAILABLE',
    'ACTIVE',
    'RENTED',
    'MAINTENANCE',
    'ACCIDENT',
    'PENDING_REVIEW',
    'UNAVAILABLE',
  ]
  const currentStatus: VehicleOperationalStatus = validStatuses.includes(rawStatus as VehicleOperationalStatus)
    ? (rawStatus as VehicleOperationalStatus)
    : 'AVAILABLE'

  const yearNum = parseInt(row['manufacturing_year'] || row['year'] || '2022', 10)
  const odoNum = parseInt(row['odometer'] || row['odometer_reading'] || '0', 10)

  return {
    vehicleId,
    registrationNumber: regNo,
    brand: row['brand'] || row['manufacturer'] || 'Honda',
    model: row['model'] || 'Dio 110cc',
    manufacturingYear: Number.isNaN(yearNum) ? 2022 : yearNum,
    vehicleImage: row['vehicle_image_url'] || row['vehicle_image'] || row['image_url'] || undefined,
    currentStatus,
    odometer: Number.isNaN(odoNum) ? 0 : odoNum,
    fuelType: row['fuel_type'] || 'Petrol',
  }
}

export async function getAllVehicles(): Promise<{ vehicles: SheetVehicle[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { records, source } = await fetchTabRecords(SHEET_TABS.VEHICLES)
  const vehicles = records.map(parseVehicleRecord).filter((v): v is SheetVehicle => v !== null)
  return { vehicles, source }
}

export async function getVehicleById(vehicleId: string): Promise<{ vehicle: SheetVehicle | null; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { vehicles, source } = await getAllVehicles()
  const vehicle = vehicles.find((v) => v.vehicleId === vehicleId) || null
  return { vehicle, source }
}

export async function getAvailableVehicles(): Promise<{ vehicles: SheetVehicle[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { vehicles, source } = await getAllVehicles()
  return {
    vehicles: vehicles.filter((v) => v.currentStatus === 'AVAILABLE'),
    source,
  }
}
