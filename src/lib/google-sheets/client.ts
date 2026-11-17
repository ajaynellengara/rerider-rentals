import { importPKCS8, SignJWT } from 'jose'

export const SHEET_TABS = {
  RIDERS: 'riders',
  VEHICLES: 'vehicles',
  PACKAGES: 'packages',
  RENTALS: 'rentals',
  PAYMENTS: 'payments',
  INSPECTIONS: 'vehicle_inspections',
} as const

export type SheetTabName =
  | typeof SHEET_TABS[keyof typeof SHEET_TABS]
  | 'Riders'
  | 'Vehicles'
  | 'Packages'
  | 'Rentals'
  | 'Payments'
  | 'Vehicle Inspection'
  | string

export interface SheetRowRecord {
  [key: string]: string
}

interface TabDescriptor {
  aliases: string[]
  indicators: string[]
}

export const TAB_DESCRIPTORS: Record<string, TabDescriptor> = {
  riders: {
    aliases: ['riders', 'Riders'],
    indicators: ['rider_id', 'riderid', 'full_name', 'email'],
  },
  vehicles: {
    aliases: ['vehicles', 'Vehicles'],
    indicators: ['vehicle_id', 'vehicleid', 'registration_number', 'brand'],
  },
  packages: {
    aliases: ['packages', 'Packages'],
    indicators: ['package_id', 'packageid', 'package_name', 'daily_rate'],
  },
  rentals: {
    aliases: ['rentals', 'Rentals'],
    indicators: ['rental_id', 'rentalid', 'total_rent_amount', 'booking_token_amount'],
  },
  payments: {
    aliases: ['payments', 'Payments'],
    indicators: ['payment_id', 'paymentid', 'payment_type'],
  },
  vehicle_inspections: {
    aliases: ['vehicle_inspections', 'Vehicle Inspection', 'vehicle_inspection', 'inspections', 'Inspections'],
    indicators: ['inspection_id', 'inspectionid', 'inspection_type', 'odometer_reading'],
  },
  vehicle_inspection: {
    aliases: ['vehicle_inspections', 'Vehicle Inspection', 'vehicle_inspection', 'inspections', 'Inspections'],
    indicators: ['inspection_id', 'inspectionid', 'inspection_type', 'odometer_reading'],
  },
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null

/**
 * Normalizes column header strings so both "Rider ID", "rider_id", "RIDER ID" map cleanly to "rider_id"
 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Parses raw CSV string into a 2D string grid, handling quotes, commas, and multiline cells
 */
export function parseCSVToGrid(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        i++ // Skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++ // Skip CRLF
      }
      currentRow.push(currentCell.trim())
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
    } else {
      currentCell += char
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * Converts raw 2D array from Google Sheets (Row 0 = headers, Rows 1..N = values)
 * into an array of key-value objects with normalized keys
 */
export function parseSheetGrid(grid: unknown[][]): SheetRowRecord[] {
  if (!grid || !Array.isArray(grid) || grid.length < 2) {
    return []
  }

  const rawHeaders = grid[0].map((h) => String(h ?? ''))
  const normalizedHeaders = rawHeaders.map(normalizeHeader)

  const records: SheetRowRecord[] = []
  for (let i = 1; i < grid.length; i++) {
    const row = grid[i]
    if (!row || row.length === 0) continue

    // Check if entire row is empty
    const hasValue = row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    if (!hasValue) continue

    const record: SheetRowRecord = {}
    normalizedHeaders.forEach((header, idx) => {
      if (header) {
        const val = row[idx]
        record[header] = val !== null && val !== undefined ? String(val).trim() : ''
      }
    })
    records.push(record)
  }

  return records
}

/**
 * Generates an OAuth2 access token for Google Service Account using jose RS256
 */
export async function getGoogleServiceAccountToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !privateKey) {
    return null
  }

  // Handle escaped newlines in env variables
  privateKey = privateKey.replace(/\\n/g, '\n')

  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60000) {
    return cachedAccessToken.token
  }

  try {
    const parsedKey = await importPKCS8(privateKey, 'RS256')
    const now = Math.floor(Date.now() / 1000)

    const jwt = await new SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/spreadsheets',
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(parsedKey)

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
      cache: 'no-store',
    })

    if (!tokenRes.ok) {
      console.warn(`[GoogleSheets] Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`)
      return null
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; expires_in: number }
    cachedAccessToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    }

    return tokenData.access_token
  } catch (err) {
    console.warn('[GoogleSheets] Auth error, falling back to local store:', err)
    return null
  }
}

/**
 * Resilient In-Memory Fallback Store matching all 6 tabs
 */
export const FALLBACK_SHEET_DATA: Record<string, unknown[][]> = {
  [SHEET_TABS.RIDERS]: [
    ['rider_id', 'name', 'email', 'phone', 'address', 'profile_image', 'verification_status', 'account_status', 'joining_date'],
    ['RID-001', 'Anandhu Krishna', 'anandhu.krishna@example.com', '+91 98470 12345', 'Kakkanad, Kochi, Kerala 682030', '', 'VERIFIED', 'ACTIVE', '2026-02-15'],
    ['RID-002', 'Rahul Nair', 'rahul.nair@example.com', '+91 98470 67890', 'Edappally, Kochi, Kerala 682024', '', 'PENDING', 'PENDING_APPROVAL', '2026-03-01'],
  ],
  Riders: [
    ['rider_id', 'name', 'email', 'phone', 'address', 'profile_image', 'verification_status', 'account_status', 'joining_date'],
    ['RID-001', 'Anandhu Krishna', 'anandhu.krishna@example.com', '+91 98470 12345', 'Kakkanad, Kochi, Kerala 682030', '', 'VERIFIED', 'ACTIVE', '2026-02-15'],
    ['RID-002', 'Rahul Nair', 'rahul.nair@example.com', '+91 98470 67890', 'Edappally, Kochi, Kerala 682024', '', 'PENDING', 'PENDING_APPROVAL', '2026-03-01'],
  ],
  [SHEET_TABS.VEHICLES]: [
    ['vehicle_id', 'registration_number', 'brand', 'model', 'manufacturing_year', 'vehicle_image', 'current_status', 'odometer', 'fuel_type'],
    ['VEH-001', 'KL-07-BW-1234', 'Honda', 'Dio 110cc', '2022', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc', 'ACTIVE', '14250', 'Petrol'],
    ['VEH-002', 'KL-07-CC-5678', 'TVS', 'Jupiter 110cc', '2023', '', 'AVAILABLE', '8500', 'Petrol'],
  ],
  Vehicles: [
    ['vehicle_id', 'registration_number', 'brand', 'model', 'manufacturing_year', 'vehicle_image', 'current_status', 'odometer', 'fuel_type'],
    ['VEH-001', 'KL-07-BW-1234', 'Honda', 'Dio 110cc', '2022', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc', 'ACTIVE', '14250', 'Petrol'],
    ['VEH-002', 'KL-07-CC-5678', 'TVS', 'Jupiter 110cc', '2023', '', 'AVAILABLE', '8500', 'Petrol'],
  ],
  [SHEET_TABS.PACKAGES]: [
    ['package_id', 'package_name', 'duration_days', 'daily_rate', 'total_amount', 'description', 'status'],
    ['PKG-14D', '14-Day Commercial Standard', '14', '450', '6300', 'Designed for delivery riders. 100 km/day included with full maintenance coverage.', 'ACTIVE'],
    ['PKG-26D', '26-Day Monthly Package', '26', '400', '10400', 'Discounted long-term monthly rental for steady daily commuters and gig fleet partners.', 'ACTIVE'],
    ['PKG-07D', '7-Day Weekly Trial', '7', '500', '3500', 'Short-term trial package for new gig delivery pilots.', 'INACTIVE'],
  ],
  Packages: [
    ['package_id', 'package_name', 'duration_days', 'daily_rate', 'total_amount', 'description', 'status'],
    ['PKG-14D', '14-Day Commercial Standard', '14', '450', '6300', 'Designed for delivery riders. 100 km/day included with full maintenance coverage.', 'ACTIVE'],
    ['PKG-26D', '26-Day Monthly Package', '26', '400', '10400', 'Discounted long-term monthly rental for steady daily commuters and gig fleet partners.', 'ACTIVE'],
    ['PKG-07D', '7-Day Weekly Trial', '7', '500', '3500', 'Short-term trial package for new gig delivery pilots.', 'INACTIVE'],
  ],
  [SHEET_TABS.RENTALS]: [
    ['rental_id', 'rider_id', 'vehicle_id', 'package_id', 'start_date', 'end_date', 'daily_rate', 'total_amount', 'advance_amount', 'security_deposit', 'balance_amount', 'rental_status', 'created_at'],
    ['RNT-1001', 'RID-001', 'VEH-001', 'PKG-14D', '2026-11-12', '2026-11-26', '450', '6300', '1000', '4000', '5300', 'ACTIVE', '2026-03-01T09:00:00Z'],
    ['RNT-1000', 'RID-001', 'VEH-001', 'PKG-14D', '2026-01-10', '2026-01-24', '450', '6300', '1000', '4000', '0', 'COMPLETED', '2026-01-10T09:00:00Z'],
  ],
  Rentals: [
    ['rental_id', 'rider_id', 'vehicle_id', 'package_id', 'start_date', 'end_date', 'daily_rate', 'total_amount', 'advance_amount', 'security_deposit', 'balance_amount', 'rental_status', 'created_at'],
    ['RNT-1001', 'RID-001', 'VEH-001', 'PKG-14D', '2026-11-12', '2026-11-26', '450', '6300', '1000', '4000', '5300', 'ACTIVE', '2026-03-01T09:00:00Z'],
    ['RNT-1000', 'RID-001', 'VEH-001', 'PKG-14D', '2026-01-10', '2026-01-24', '450', '6300', '1000', '4000', '0', 'COMPLETED', '2026-01-10T09:00:00Z'],
  ],
  [SHEET_TABS.PAYMENTS]: [
    ['payment_id', 'rental_id', 'rider_id', 'payment_type', 'amount', 'payment_date', 'payment_method', 'payment_status', 'transaction_reference', 'notes'],
    ['PAY-101', 'RNT-1001', 'RID-001', 'TOKEN_ADVANCE', '1000', '2026-11-12', 'UPI', 'SUCCESS', 'UPI/2026/03/99281', 'Advance booking token received via UPI'],
    ['PAY-102', 'RNT-1001', 'RID-001', 'SECURITY_DEPOSIT', '4000', '2026-11-12', 'UPI', 'SUCCESS', 'UPI/2026/03/99282', 'Refundable security deposit liability held in trust'],
  ],
  Payments: [
    ['payment_id', 'rental_id', 'rider_id', 'payment_type', 'amount', 'payment_date', 'payment_method', 'payment_status', 'transaction_reference', 'notes'],
    ['PAY-101', 'RNT-1001', 'RID-001', 'TOKEN_ADVANCE', '1000', '2026-11-12', 'UPI', 'SUCCESS', 'UPI/2026/03/99281', 'Advance booking token received via UPI'],
    ['PAY-102', 'RNT-1001', 'RID-001', 'SECURITY_DEPOSIT', '4000', '2026-11-12', 'UPI', 'SUCCESS', 'UPI/2026/03/99282', 'Refundable security deposit liability held in trust'],
  ],
  [SHEET_TABS.INSPECTIONS]: [
    ['inspection_id', 'rental_id', 'vehicle_id', 'rider_id', 'inspection_type', 'odometer_reading', 'fuel_level', 'vehicle_condition', 'damage_notes', 'inspection_date', 'photo_urls'],
    ['INS-101', 'RNT-1001', 'VEH-001', 'RID-001', 'HANDOVER', '14250', '100%', 'Good Condition', 'Minor cosmetic scuff on left lower body panel', '2026-11-12T13:02:02.552Z', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc,https://images.unsplash.com/photo-1568772585407-9361f9bf3a87'],
  ],
  'Vehicle Inspection': [
    ['inspection_id', 'rental_id', 'vehicle_id', 'rider_id', 'inspection_type', 'odometer_reading', 'fuel_level', 'vehicle_condition', 'damage_notes', 'inspection_date', 'photo_urls'],
    ['INS-101', 'RNT-1001', 'VEH-001', 'RID-001', 'HANDOVER', '14250', '100%', 'Good Condition', 'Minor cosmetic scuff on left lower body panel', '2026-11-12T13:02:02.552Z', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc,https://images.unsplash.com/photo-1568772585407-9361f9bf3a87'],
  ],
}

/**
 * Fetches rows from a Google Sheet tab or falls back to local data
 */
export async function fetchTabRecords(
  tabName: SheetTabName
): Promise<{ records: SheetRowRecord[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const sheetId = process.env.GOOGLE_SHEET_ID || '1IRY6DPk3_E_wOHFrM-5mbE2gSQEULMxrE565nfWsdss'
  const normalizedKey = normalizeHeader(tabName)
  const descriptor = TAB_DESCRIPTORS[normalizedKey] || {
    aliases: [tabName],
    indicators: [],
  }

  // Method 1: Google Service Account OAuth2 (if configured)
  if (sheetId && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const accessToken = await getGoogleServiceAccountToken()
    if (accessToken) {
      for (const alias of descriptor.aliases) {
        try {
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            sheetId
          )}/values/${encodeURIComponent(alias)}?valueRenderOption=UNFORMATTED_VALUE`
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
          })

          if (res.ok) {
            const data = (await res.json()) as { values?: unknown[][] }
            if (data.values && data.values.length > 0) {
              const headers = (data.values[0] || []).map((h) => normalizeHeader(String(h)))
              const matches =
                descriptor.indicators.length === 0 ||
                descriptor.indicators.some((ind) => headers.includes(ind))
              if (matches) {
                return {
                  records: parseSheetGrid(data.values),
                  source: 'GOOGLE_SHEETS',
                }
              }
            }
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'test') console.warn(`[GoogleSheets] Fetch error on tab ${alias}:`, err)
        }
      }
    }
  }

  // Method 2: Public / Shared Sheet CSV Export (Works with 'Anyone with the link' sharing)
  if (sheetId) {
    for (const alias of descriptor.aliases) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
          sheetId
        )}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(alias)}`
        const res = await fetch(gvizUrl, { cache: 'no-store' })
        if (res.ok) {
          const text = await res.text()
          // If not redirected to an HTML login wall
          if (text && !text.trim().startsWith('<')) {
            const grid = parseCSVToGrid(text)
            if (grid.length > 1) {
              const headers = (grid[0] || []).map(normalizeHeader)
              const matches =
                descriptor.indicators.length === 0 ||
                descriptor.indicators.some((ind) => headers.includes(ind))
              if (matches) {
                return {
                  records: parseSheetGrid(grid),
                  source: 'GOOGLE_SHEETS',
                }
              }
            }
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[GoogleSheets] CSV export error on tab ${alias}:`, err)
        }
      }
    }
  }

  // Method 3: Graceful fallback store
  const fallbackGrid =
    FALLBACK_SHEET_DATA[tabName] ||
    FALLBACK_SHEET_DATA[normalizedKey] ||
    FALLBACK_SHEET_DATA[descriptor.aliases[0]] ||
    []
  return {
    records: parseSheetGrid(fallbackGrid),
    source: 'FALLBACK_STORE',
  }
}
