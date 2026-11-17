import { fetchTabRecords, SHEET_TABS, SheetRowRecord } from './client'
import { SheetPackage } from './types'

export function parsePackageRecord(row: SheetRowRecord): SheetPackage | null {
  const packageId = row['package_id'] || row['packageid'] || row['id']
  const packageName = row['package_name'] || row['name']

  if (!packageId || !packageName) {
    return null
  }

  const durationDays = parseInt(row['duration_days'] || row['days'] || '14', 10)
  const dailyRate = parseFloat(row['daily_rate'] || row['rate_per_day'] || '450')
  const totalAmount = parseFloat(row['total_amount'] || row['total_rent'] || String(dailyRate * durationDays))
  const status =
    (row['status'] || row['package_status'] || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'

  return {
    packageId,
    packageName,
    durationDays: Number.isNaN(durationDays) ? 14 : durationDays,
    dailyRate: Number.isNaN(dailyRate) ? 450 : dailyRate,
    totalAmount: Number.isNaN(totalAmount) ? 6300 : totalAmount,
    description: row['description'] || row['package_description'] || '',
    status,
  }
}

export async function getAllPackages(): Promise<{ packages: SheetPackage[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { records, source } = await fetchTabRecords(SHEET_TABS.PACKAGES)
  const packages = records.map(parsePackageRecord).filter((p): p is SheetPackage => p !== null)
  return { packages, source }
}

export async function getActivePackages(): Promise<{ packages: SheetPackage[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { packages, source } = await getAllPackages()
  return {
    packages: packages.filter((p) => p.status === 'ACTIVE'),
    source,
  }
}

export async function getPackageById(packageId: string): Promise<{ package: SheetPackage | null; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { packages, source } = await getAllPackages()
  const pkg = packages.find((p) => p.packageId === packageId) || null
  return { package: pkg, source }
}
