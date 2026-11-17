import { fetchTabRecords, SHEET_TABS, SheetRowRecord } from './client'
import { RiderAccountStatus, RiderVerificationStatus, SheetRider } from './types'

export function parseRiderRecord(row: SheetRowRecord): SheetRider | null {
  const riderId = row['rider_id'] || row['riderid'] || row['id']
  const email = row['email']
  const name = row['name'] || row['full_name'] || row['rider_name']

  if (!riderId || !email) {
    return null
  }

  const rawVerification = (row['verification_status'] || row['kyc_status'] || 'PENDING').toUpperCase()
  const verificationStatus: RiderVerificationStatus =
    rawVerification === 'VERIFIED' ? 'VERIFIED' : rawVerification === 'REJECTED' ? 'REJECTED' : 'PENDING'

  const rawAccount = (row['account_status'] || 'ACTIVE').toUpperCase()
  const accountStatus: RiderAccountStatus =
    rawAccount === 'ACTIVE'
      ? 'ACTIVE'
      : rawAccount === 'DORMANT'
      ? 'DORMANT'
      : rawAccount === 'SUSPENDED'
      ? 'SUSPENDED'
      : 'PENDING_APPROVAL'

  return {
    riderId,
    name: name || 'Rider',
    email: email.toLowerCase(),
    phone: row['phone'] || row['phone_number'] || '',
    address: row['address'] || '',
    profileImage: row['profile_image_url'] || row['profile_image'] || undefined,
    verificationStatus,
    accountStatus,
    joiningDate:
      row['registration_date'] ||
      row['joining_date'] ||
      row['created_at'] ||
      new Date().toISOString().slice(0, 10),
  }
}

export async function getAllRiders(): Promise<{ riders: SheetRider[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { records, source } = await fetchTabRecords(SHEET_TABS.RIDERS)
  const riders = records.map(parseRiderRecord).filter((r): r is SheetRider => r !== null)
  return { riders, source }
}

export async function getRiderByEmail(email: string): Promise<{ rider: SheetRider | null; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { riders, source } = await getAllRiders()
  const normalized = email.trim().toLowerCase()
  const rider = riders.find((r) => r.email === normalized) || null
  return { rider, source }
}

export async function getRiderById(riderId: string): Promise<{ rider: SheetRider | null; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { riders, source } = await getAllRiders()
  const rider = riders.find((r) => r.riderId === riderId) || null
  return { rider, source }
}
