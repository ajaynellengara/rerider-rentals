import { fetchTabRecords, SHEET_TABS, SheetRowRecord } from './client'
import { RentalStatus, SheetRental } from './types'

export const ACTIVE_RENTAL_STATUSES: RentalStatus[] = [
  'ACTIVE',
  'CONFIRMED',
  'EXTENSION_PENDING',
  'OVERDUE',
]

export function parseRentalRecord(row: SheetRowRecord): SheetRental | null {
  const rentalId = row['rental_id'] || row['rentalid'] || row['id']
  const riderId = row['rider_id'] || row['riderid']
  const vehicleId = row['vehicle_id'] || row['vehicleid']

  if (!rentalId || !riderId) {
    return null
  }

  const rawStatus = (row['rental_status'] || row['status'] || 'PENDING').toUpperCase()
  const validStatuses: RentalStatus[] = [
    'PENDING',
    'CONFIRMED',
    'ACTIVE',
    'EXTENSION_PENDING',
    'OVERDUE',
    'COMPLETED',
    'CANCELLED',
  ]
  const rentalStatus: RentalStatus = validStatuses.includes(rawStatus as RentalStatus)
    ? (rawStatus as RentalStatus)
    : 'PENDING'

  const dailyRate = parseFloat(row['daily_rate'] || '450')
  const totalAmount = parseFloat(row['total_amount'] || row['total_rent_amount'] || row['total_amount_due'] || '6300')
  const advanceAmount = parseFloat(
    row['advance_amount'] || row['booking_token_amount'] || row['token_amount'] || '1000'
  )
  const securityDeposit = parseFloat(row['security_deposit'] || row['deposit_amount'] || '4000')
  const balanceAmount = parseFloat(
    row['balance_amount'] || row['outstanding_balance'] || String(totalAmount - advanceAmount)
  )

  return {
    rentalId,
    riderId,
    vehicleId: vehicleId || '',
    packageId: row['package_id'] || row['packageid'] || '',
    startDate: row['start_date'] || new Date().toISOString().slice(0, 10),
    endDate:
      row['end_date'] ||
      row['expected_return_date'] ||
      row['return_date'] ||
      new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    // Frozen price snapshot:
    dailyRate: Number.isNaN(dailyRate) ? 450 : dailyRate,
    totalAmount: Number.isNaN(totalAmount) ? 6300 : totalAmount,
    advanceAmount: Number.isNaN(advanceAmount) ? 1000 : advanceAmount,
    securityDeposit: Number.isNaN(securityDeposit) ? 4000 : securityDeposit,
    balanceAmount: Number.isNaN(balanceAmount) ? Math.max(0, totalAmount - advanceAmount) : balanceAmount,
    rentalStatus,
    createdAt: row['created_at'] || new Date().toISOString(),
  }
}

export async function getAllRentals(): Promise<{ rentals: SheetRental[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { records, source } = await fetchTabRecords(SHEET_TABS.RENTALS)
  const rentals = records.map(parseRentalRecord).filter((r): r is SheetRental => r !== null)
  return { rentals, source }
}

export async function getRiderRentals(
  riderId: string
): Promise<{ rentals: SheetRental[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { rentals, source } = await getAllRentals()
  const riderRentals = rentals.filter((r) => r.riderId === riderId)
  return { rentals: riderRentals, source }
}

export async function getRiderActiveRental(
  riderId: string
): Promise<{ activeRental: SheetRental | null; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { rentals, source } = await getRiderRentals(riderId)
  // Find the current active rental (if multiple, choose latest created/active)
  const activeRentals = rentals.filter((r) => ACTIVE_RENTAL_STATUSES.includes(r.rentalStatus))
  const activeRental = activeRentals.length > 0 ? activeRentals[activeRentals.length - 1] : null
  return { activeRental, source }
}
