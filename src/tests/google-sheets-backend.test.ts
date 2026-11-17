import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeHeader,
  parseCSVToGrid,
  parseSheetGrid,
  SHEET_TABS,
} from '@/lib/google-sheets/client'
import { parseRiderRecord, getRiderByEmail } from '@/lib/google-sheets/riders'
import { parseVehicleRecord, getVehicleById } from '@/lib/google-sheets/vehicles'
import { parsePackageRecord, getActivePackages } from '@/lib/google-sheets/packages'
import { parseRentalRecord, getRiderRentals, getRiderActiveRental } from '@/lib/google-sheets/rentals'
import { parsePaymentRecord, getRiderPayments } from '@/lib/google-sheets/payments'
import { parseInspectionRecord, getHandoverInspection } from '@/lib/google-sheets/inspections'
import { getRiderPortalData } from '@/lib/google-sheets'
import { GET } from '@/app/api/rider/portal/route'
import * as sessionModule from '@/lib/auth/session'

describe('Google Sheets Backend Integration', () => {
  describe('Tab Grid & Header Normalization', () => {
    it('normalizes various header formats cleanly', () => {
      expect(normalizeHeader('Rider ID')).toBe('rider_id')
      expect(normalizeHeader('rider_id')).toBe('rider_id')
      expect(normalizeHeader('  RIDER  ID  ')).toBe('rider_id')
      expect(normalizeHeader('Registration Number')).toBe('registration_number')
      expect(normalizeHeader('Daily Rate (INR)')).toBe('daily_rate_inr')
      expect(normalizeHeader('Odometer Reading')).toBe('odometer_reading')
      expect(normalizeHeader('Vehicle Inspection')).toBe('vehicle_inspection')
    })

    it('parses CSV strings into 2D grids, handling quoted commas and escapes', () => {
      const csv = `"Rider ID","Name","Notes"\r\n"RID-001","Anandhu, Krishna","Good rider, 5*"\n"RID-002","Rahul Nair","No issues"`
      const grid = parseCSVToGrid(csv)
      expect(grid).toHaveLength(3)
      expect(grid[0]).toEqual(['Rider ID', 'Name', 'Notes'])
      expect(grid[1]).toEqual(['RID-001', 'Anandhu, Krishna', 'Good rider, 5*'])
      expect(grid[2]).toEqual(['RID-002', 'Rahul Nair', 'No issues'])
    })

    it('parses 2D sheet grids into key-value records with normalized keys', () => {
      const grid = [
        ['Rider ID', 'Full Name', 'Email', 'Phone'],
        ['RID-001', 'Anandhu Krishna', 'anandhu@example.com', '+91 98470 12345'],
        ['', '', '', ''], // empty row to skip
        ['RID-002', 'Rahul Nair', 'rahul@example.com', '+91 98470 67890'],
      ]

      const records = parseSheetGrid(grid)
      expect(records).toHaveLength(2)
      expect(records[0]).toEqual({
        rider_id: 'RID-001',
        full_name: 'Anandhu Krishna',
        email: 'anandhu@example.com',
        phone: '+91 98470 12345',
      })
      expect(records[1].rider_id).toBe('RID-002')
    })
  })

  describe('Tab Schemas & Parser Modules', () => {
    it('Tab 1: parses Riders record with KYC and account status', () => {
      const row = {
        rider_id: 'RID-100',
        name: 'Suresh Kumar',
        email: 'suresh@example.com',
        phone: '9847112233',
        address: 'MG Road, Ernakulam',
        verification_status: 'VERIFIED',
        account_status: 'ACTIVE',
        joining_date: '2026-03-01',
      }
      const rider = parseRiderRecord(row)
      expect(rider).not.toBeNull()
      expect(rider?.riderId).toBe('RID-100')
      expect(rider?.email).toBe('suresh@example.com')
      expect(rider?.verificationStatus).toBe('VERIFIED')
      expect(rider?.accountStatus).toBe('ACTIVE')
    })

    it('Tab 2: parses Vehicles record with operational status and specs', () => {
      const row = {
        vehicle_id: 'VEH-101',
        registration_number: 'KL-07-BW-9999',
        brand: 'Honda',
        model: 'Dio 110cc',
        manufacturing_year: '2023',
        current_status: 'AVAILABLE',
        odometer: '12500',
        fuel_type: 'Petrol',
      }
      const vehicle = parseVehicleRecord(row)
      expect(vehicle).not.toBeNull()
      expect(vehicle?.vehicleId).toBe('VEH-101')
      expect(vehicle?.registrationNumber).toBe('KL-07-BW-9999')
      expect(vehicle?.manufacturingYear).toBe(2023)
      expect(vehicle?.odometer).toBe(12500)
      expect(vehicle?.currentStatus).toBe('AVAILABLE')
    })

    it('Tab 3: parses Packages record with dynamic rate without hardcoding', () => {
      const row = {
        package_id: 'PKG-CUSTOM',
        package_name: '20-Day Monsoon Special',
        duration_days: '20',
        daily_rate: '425.50',
        total_amount: '8510',
        description: 'Monsoon commercial package with rain gear.',
        status: 'ACTIVE',
      }
      const pkg = parsePackageRecord(row)
      expect(pkg).not.toBeNull()
      expect(pkg?.packageId).toBe('PKG-CUSTOM')
      expect(pkg?.durationDays).toBe(20)
      expect(pkg?.dailyRate).toBe(425.50)
      expect(pkg?.totalAmount).toBe(8510)
      expect(pkg?.status).toBe('ACTIVE')
    })

    it('Tab 4: parses Rentals record with frozen price snapshot and liability segregation', () => {
      const row = {
        rental_id: 'RNT-888',
        rider_id: 'RID-100',
        vehicle_id: 'VEH-101',
        package_id: 'PKG-CUSTOM',
        start_date: '2026-03-15',
        end_date: '2026-04-04',
        daily_rate: '425.50',
        total_amount: '8510',
        advance_amount: '1000',
        security_deposit: '4000',
        balance_amount: '7510',
        rental_status: 'ACTIVE',
      }
      const rental = parseRentalRecord(row)
      expect(rental).not.toBeNull()
      expect(rental?.rentalId).toBe('RNT-888')
      expect(rental?.dailyRate).toBe(425.50)
      expect(rental?.advanceAmount).toBe(1000)
      expect(rental?.securityDeposit).toBe(4000)
      expect(rental?.balanceAmount).toBe(7510)
      expect(rental?.rentalStatus).toBe('ACTIVE')
    })

    it('Tab 5: parses Payments record with ledger segregation for security deposits', () => {
      const row = {
        payment_id: 'PAY-501',
        rental_id: 'RNT-888',
        rider_id: 'RID-100',
        payment_type: 'SECURITY_DEPOSIT',
        amount: '4000',
        payment_date: '2026-03-15',
        payment_method: 'UPI',
        payment_status: 'SUCCESS',
        transaction_reference: 'UPI/AXIS/123456789',
        notes: 'Security deposit held in liability ledger',
      }
      const payment = parsePaymentRecord(row)
      expect(payment).not.toBeNull()
      expect(payment?.paymentType).toBe('SECURITY_DEPOSIT')
      expect(payment?.amount).toBe(4000)
      expect(payment?.paymentMethod).toBe('UPI')
      expect(payment?.paymentStatus).toBe('SUCCESS')
    })

    it('Tab 5: handles live sheet human-readable strings for payments', () => {
      const p1 = parsePaymentRecord({
        payment_id: 'PAY-001',
        rental_id: 'REN-001',
        rider_id: 'RDR-001',
        payment_type: 'Booking Token',
        amount: '1000',
        payment_method: 'UPI',
        payment_status: 'Completed',
      })
      expect(p1?.paymentType).toBe('TOKEN_ADVANCE')
      expect(p1?.paymentStatus).toBe('SUCCESS')

      const p2 = parsePaymentRecord({
        payment_id: 'PAY-002',
        rental_id: 'REN-001',
        rider_id: 'RDR-001',
        payment_type: 'Advance',
        amount: '2000',
        payment_method: 'Cash',
        payment_status: 'Completed',
      })
      expect(p2?.paymentType).toBe('RENTAL_CHARGE')
      expect(p2?.paymentMethod).toBe('CASH')

      const p3 = parsePaymentRecord({
        payment_id: 'PAY-004',
        rental_id: 'REN-002',
        rider_id: 'RDR-003',
        payment_type: 'Security Deposit Refund',
        amount: '4000',
        payment_method: 'Bank Transfer',
        payment_status: 'Refunded',
      })
      expect(p3?.paymentType).toBe('DEPOSIT_REFUND')
      expect(p3?.paymentMethod).toBe('BANK_TRANSFER')
      expect(p3?.paymentStatus).toBe('REFUNDED')
    })

    it('Tab 6: parses Vehicle Inspection record with odometer, fuel and photo URLs', () => {
      const row = {
        inspection_id: 'INS-901',
        rental_id: 'RNT-888',
        vehicle_id: 'VEH-101',
        rider_id: 'RID-100',
        inspection_type: 'HANDOVER',
        odometer_reading: '12500',
        fuel_level: '100%',
        vehicle_condition: 'Excellent',
        damage_notes: 'No scratches observed',
        inspection_date: '2026-03-15T10:00:00Z',
        photo_urls: 'https://cdn.example.com/front.jpg, https://cdn.example.com/rear.jpg',
      }
      const inspection = parseInspectionRecord(row)
      expect(inspection).not.toBeNull()
      expect(inspection?.inspectionType).toBe('HANDOVER')
      expect(inspection?.odometerReading).toBe(12500)
      expect(inspection?.fuelLevel).toBe('100%')
      expect(inspection?.photoUrls).toEqual([
        'https://cdn.example.com/front.jpg',
        'https://cdn.example.com/rear.jpg',
      ])
    })

    it('Tab 6: maps live sheet vehicle_inspections column naming variations', () => {
      const row = {
        inspection_id: 'INS-001',
        rental_id: 'REN-001',
        vehicle_id: 'VEH-001',
        rider_id: 'RDR-001',
        inspection_type: 'Handover',
        odometer_reading: '4500',
        fuel_level: 'Full',
        body_condition: 'Good',
        existing_damage_notes: 'Minor scratch on left panel',
        inspection_photo_urls: 'https://cdn.example.com/p1.jpg',
      }
      const inspection = parseInspectionRecord(row)
      expect(inspection).not.toBeNull()
      expect(inspection?.inspectionType).toBe('HANDOVER')
      expect(inspection?.vehicleCondition).toBe('Good Condition')
      expect(inspection?.damageNotes).toBe('Minor scratch on left panel')
      expect(inspection?.photoUrls).toEqual(['https://cdn.example.com/p1.jpg'])
    })
  })

  describe('Rider Data Isolation & Aggregation', () => {
    it('retrieves portal data strictly for the authenticated rider email', async () => {
      const portalData = await getRiderPortalData('anandhu.krishna@example.com')
      expect(portalData).not.toBeNull()
      expect(portalData?.rider.riderId).toBe('RID-001')
      expect(portalData?.rider.name).toBe('Anandhu Krishna')

      // Ensure active rental belongs to RID-001
      expect(portalData?.activeRental?.riderId).toBe('RID-001')
      expect(portalData?.activeRental?.rentalId).toBe('RNT-1001')

      // Ensure payments belong strictly to RID-001
      portalData?.payments.forEach((payment) => {
        expect(payment.riderId).toBe('RID-001')
      })

      // Associated vehicle is Honda Dio
      expect(portalData?.vehicle?.registrationNumber).toBe('KL-07-BW-1234')
      expect(portalData?.vehicle?.brand).toBe('Honda')

      // Associated inspection matches handover
      expect(portalData?.handoverInspection?.inspectionType).toBe('HANDOVER')
      expect(portalData?.handoverInspection?.rentalId).toBe('RNT-1001')
    })

    it('returns null when the email does not exist in the sheet', async () => {
      const portalData = await getRiderPortalData('unknown.intruder@example.com')
      expect(portalData).toBeNull()
    })

    it('enforces single active rental invariant', async () => {
      const { activeRental } = await getRiderActiveRental('RID-001')
      expect(activeRental).not.toBeNull()
      expect(activeRental?.rentalStatus).toBe('ACTIVE')
      expect(activeRental?.rentalId).toBe('RNT-1001')
    })

    it('dynamically lists available active packages from the sheet', async () => {
      const { packages } = await getActivePackages()
      expect(packages.length).toBeGreaterThan(0)
      packages.forEach((pkg) => {
        expect(pkg.status).toBe('ACTIVE')
        expect(pkg.dailyRate).toBeGreaterThan(0)
      })
      const has14D = packages.some((p) => p.packageId === 'PKG-14D')
      const has26D = packages.some((p) => p.packageId === 'PKG-26D')
      expect(has14D).toBe(true)
      expect(has26D).toBe(true)
    })
  })

  describe('API Route /api/rider/portal Security & Response', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('returns 401 when no session exists', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null)

      const response = await GET()
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('returns 401 when user is not a RIDER (e.g. ADMIN trying to access rider endpoint)', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
        userId: 'admin-1',
        email: 'admin@rerider.com',
        role: 'ADMIN',
        name: 'Fleet Manager',
      })

      const response = await GET()
      expect(response.status).toBe(401)
    })

    it('returns 404 when rider email is not in the operations sheet', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
        userId: 'rider-unknown',
        email: 'unregistered.rider@gmail.com',
        role: 'RIDER',
        name: 'New Rider',
      })

      const response = await GET()
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('not found in the operations Google Sheet')
    })

    it('returns 200 with full operations data for verified rider', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
        userId: 'rider-001',
        email: 'anandhu.krishna@example.com',
        role: 'RIDER',
        name: 'Anandhu Krishna',
      })

      const response = await GET()
      expect(response.status).toBe(200)

      // Ensure anti-caching headers are set for real-time freshness
      expect(response.headers.get('Cache-Control')).toContain('no-store')

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.rider.email).toBe('anandhu.krishna@example.com')
      expect(body.data.rider.verificationStatus).toBe('VERIFIED')
      expect(body.data.activeRental.rentalId).toBe('RNT-1001')
      expect(body.data.vehicle.registrationNumber).toBe('KL-07-BW-1234')
      expect(body.data.payments.length).toBeGreaterThan(0)
    })
  })
})
