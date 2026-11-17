import { fetchTabRecords, SHEET_TABS, SheetRowRecord } from './client'
import { InspectionType, SheetInspection } from './types'

export function parseInspectionRecord(row: SheetRowRecord): SheetInspection | null {
  const inspectionId = row['inspection_id'] || row['inspectionid'] || row['id']
  const rentalId = row['rental_id'] || row['rentalid']
  const vehicleId = row['vehicle_id'] || row['vehicleid']

  if (!inspectionId || !rentalId) {
    return null
  }

  const rawType = (row['inspection_type'] || row['type'] || 'HANDOVER').toUpperCase()
  const validTypes: InspectionType[] = ['HANDOVER', 'RETURN', 'SPOT_CHECK', 'MAINTENANCE']
  const inspectionType: InspectionType = validTypes.includes(rawType as InspectionType)
    ? (rawType as InspectionType)
    : 'HANDOVER'

  const odo = parseInt(row['odometer_reading'] || row['odometer'] || '0', 10)
  const rawPhotos = row['photo_urls'] || row['inspection_photo_urls'] || row['photos'] || ''
  const photoUrls = rawPhotos
    ? rawPhotos
        .split(/[,;\n]+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : []

  const condition =
    row['vehicle_condition'] ||
    row['condition'] ||
    (row['body_condition'] ? `${row['body_condition']} Condition` : 'Good')

  const damages =
    row['existing_damage_notes'] ||
    row['damage_notes'] ||
    row['damages'] ||
    row['new_damage_notes'] ||
    undefined

  return {
    inspectionId,
    rentalId,
    vehicleId: vehicleId || '',
    riderId: row['rider_id'] || row['riderid'] || '',
    inspectionType,
    odometerReading: Number.isNaN(odo) ? 0 : odo,
    fuelLevel: row['fuel_level'] || '100%',
    vehicleCondition: condition,
    damageNotes: damages,
    inspectionDate: row['inspection_date'] || row['date'] || new Date().toISOString(),
    photoUrls,
  }
}

export async function getAllInspections(): Promise<{ inspections: SheetInspection[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { records, source } = await fetchTabRecords(SHEET_TABS.INSPECTIONS)
  const inspections = records.map(parseInspectionRecord).filter((i): i is SheetInspection => i !== null)
  return { inspections, source }
}

export async function getRentalInspections(
  rentalId: string
): Promise<{ inspections: SheetInspection[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { inspections, source } = await getAllInspections()
  const filtered = inspections.filter((i) => i.rentalId === rentalId)
  return { inspections: filtered, source }
}

export async function getHandoverInspection(
  rentalId: string
): Promise<{ inspection: SheetInspection | null; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { inspections, source } = await getRentalInspections(rentalId)
  const handover = inspections.find((i) => i.inspectionType === 'HANDOVER') || null
  return { inspection: handover, source }
}
