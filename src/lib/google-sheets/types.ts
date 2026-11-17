export type RiderVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type RiderAccountStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'DORMANT' | 'SUSPENDED'
export type VehicleOperationalStatus = 'AVAILABLE' | 'ACTIVE' | 'RENTED' | 'MAINTENANCE' | 'ACCIDENT' | 'PENDING_REVIEW' | 'UNAVAILABLE'
export type RentalStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'EXTENSION_PENDING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED'
export type PaymentType = 'TOKEN_ADVANCE' | 'RENTAL_CHARGE' | 'SECURITY_DEPOSIT' | 'DEPOSIT_REFUND' | 'DAMAGE_DEDUCTION' | 'LATE_FEE'
export type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type InspectionType = 'HANDOVER' | 'RETURN' | 'SPOT_CHECK' | 'MAINTENANCE'

export interface SheetRider {
  riderId: string
  name: string
  email: string
  phone: string
  address: string
  profileImage?: string
  verificationStatus: RiderVerificationStatus
  accountStatus: RiderAccountStatus
  joiningDate: string
}

export interface SheetVehicle {
  vehicleId: string
  registrationNumber: string
  brand: string
  model: string
  manufacturingYear: number
  vehicleImage?: string
  currentStatus: VehicleOperationalStatus
  odometer: number
  fuelType: string
}

export interface SheetPackage {
  packageId: string
  packageName: string
  durationDays: number
  dailyRate: number
  totalAmount: number
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface SheetRental {
  rentalId: string
  riderId: string
  vehicleId: string
  packageId: string
  startDate: string
  endDate: string
  dailyRate: number
  totalAmount: number
  advanceAmount: number
  securityDeposit: number
  balanceAmount: number
  rentalStatus: RentalStatus
  createdAt: string
}

export interface SheetPayment {
  paymentId: string
  rentalId: string
  riderId: string
  paymentType: PaymentType
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  transactionReference?: string
  notes?: string
}

export interface SheetInspection {
  inspectionId: string
  rentalId: string
  vehicleId: string
  riderId: string
  inspectionType: InspectionType
  odometerReading: number
  fuelLevel: string // e.g. "100%", "80%"
  vehicleCondition: string
  damageNotes?: string
  inspectionDate: string
  photoUrls: string[]
}

export interface RiderPortalData {
  rider: SheetRider
  activeRental: SheetRental | null
  vehicle: SheetVehicle | null
  package: SheetPackage | null
  payments: SheetPayment[]
  handoverInspection: SheetInspection | null
  allRentals: SheetRental[]
  availablePackages: SheetPackage[]
  dataSource: 'GOOGLE_SHEETS' | 'FALLBACK_STORE'
  lastSyncedAt: string
}
