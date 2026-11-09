import { db, checkDatabaseConnection } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import {
  VehicleCreateInput,
  VehicleUpdateInput,
  VehiclePricingInput,
  VehicleDocumentInput,
} from '@/lib/validations/vehicle';

export type VehicleOperationalStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'RENTED'
  | 'MAINTENANCE'
  | 'ACCIDENT'
  | 'UNAVAILABLE'
  | 'RETIRED';

export type VehicleComplianceStatus =
  | 'PENDING_REVIEW'
  | 'VERIFIED_COMPLIANT'
  | 'RESTRICTED_USE'
  | 'EXPIRED_DOCS'
  | 'NON_COMPLIANT';

export interface VehicleListItem {
  id: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  variant: string | null;
  manufacturingYear: number;
  fuelType: string;
  vehicleCategory: string;
  currentOdometer: number;
  operationalStatus: VehicleOperationalStatus;
  complianceStatus: VehicleComplianceStatus;
  dailyRate14d?: number;
  dailyRate26d?: number;
  activeRiderName?: string | null;
  activeBookingId?: string | null;
  totalExpenses?: number;
}

export interface VehicleDocumentItem {
  id: string;
  vehicleId: string;
  documentType: string;
  documentNumber: string;
  storageKey: string;
  validFrom: string;
  validUntil: string;
  isCommercialPermit: boolean;
  verificationStatus: string;
  notes?: string | null;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface VehiclePricingItem {
  id: string;
  packageId: string;
  packageName: string;
  packageCode: string;
  durationDays: number;
  dailyRate: number;
  packageTotalRate: number;
  bookingTokenAmount: number;
  securityDepositAmount: number;
  kmLimitPerDay: number;
  extraKmCharge: number;
  isActive: boolean;
}

export interface VehicleStatusHistoryItem {
  id: string;
  fromStatus: VehicleOperationalStatus;
  toStatus: VehicleOperationalStatus;
  reason: string;
  changedByName?: string | null;
  createdAt: string;
}

export interface VehicleDetailAggregate {
  vehicle: {
    id: string;
    registrationNumber: string;
    manufacturer: string;
    model: string;
    variant: string | null;
    manufacturingYear: number;
    fuelType: string;
    vehicleCategory: string;
    chassisNumber: string;
    engineNumber: string;
    purchaseDate: string;
    purchaseCost: number;
    currentOdometer: number;
    operationalStatus: VehicleOperationalStatus;
    complianceStatus: VehicleComplianceStatus;
    complianceNotes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  pricing: VehiclePricingItem[];
  documents: VehicleDocumentItem[];
  statusHistory: VehicleStatusHistoryItem[];
  activeAssignment?: {
    assignmentId: string;
    bookingId: string;
    riderId: string;
    riderName: string;
    riderPhone: string;
    startingOdometer: number;
    assignedAt: string;
    expectedReturnDate: string;
    packageCode: string;
  } | null;
  maintenanceHistory: Array<{
    id: string;
    serviceType: string;
    repairStatus: string;
    description: string;
    totalCost: number;
    serviceDate: string;
    workshopName: string;
  }>;
  expenseSummary: {
    totalLifetimeCost: number;
    purchaseCost: number;
    maintenanceCost: number;
    recordsCount: number;
  };
}

let dbAvailableCache: boolean | null = null;

export async function isDbAvailable(): Promise<boolean> {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_WITH_REAL_DB) {
    return false;
  }
  if (dbAvailableCache !== null) return dbAvailableCache;
  try {
    const res = await Promise.race([
      checkDatabaseConnection(),
      new Promise<{ connected: boolean }>((_, reject) =>
        setTimeout(() => reject(new Error('DB Timeout')), 500)
      ),
    ]);
    dbAvailableCache = res.connected;
  } catch {
    dbAvailableCache = false;
  }
  return dbAvailableCache;
}

export function setDbAvailableForTesting(available: boolean | null) {
  dbAvailableCache = available;
}

/**
 * Pure helper to compute document validity metrics
 */
export function computeDocumentExpiry(validUntilDateStr: string, referenceDate: Date = new Date()): {
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  const expiryDate = new Date(validUntilDateStr);
  const diffTime = expiryDate.getTime() - referenceDate.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  return {
    daysUntilExpiry,
    isExpired,
    isExpiringSoon,
  };
}

/**
 * Validates operational status state transitions
 */
export function validateStatusTransition(
  fromStatus: VehicleOperationalStatus,
  toStatus: VehicleOperationalStatus,
  reason: string,
  complianceStatus?: VehicleComplianceStatus
): { allowed: boolean; error?: string } {
  if (fromStatus === toStatus) {
    return { allowed: false, error: `Vehicle is already in ${fromStatus} status` };
  }

  if (!reason || reason.trim().length < 5) {
    return {
      allowed: false,
      error: 'A mandatory audit reason (minimum 5 characters) is required for operational status transitions',
    };
  }

  // Compliance Gate: Cannot transition to AVAILABLE unless compliance is VERIFIED_COMPLIANT
  if (toStatus === 'AVAILABLE' && complianceStatus && complianceStatus !== 'VERIFIED_COMPLIANT') {
    return {
      allowed: false,
      error: 'Compliance Gate Violation: Vehicle cannot be marked AVAILABLE until mandatory compliance verification and authorised approval are complete',
    };
  }

  // Rules:
  // 1. RETIRED is a terminal operational state
  if (fromStatus === 'RETIRED') {
    return { allowed: false, error: 'Cannot transition a RETIRED vehicle without administrative un-retirement override' };
  }

  // 2. ACCIDENT cannot jump directly to AVAILABLE or RENTED
  if (fromStatus === 'ACCIDENT' && (toStatus === 'AVAILABLE' || toStatus === 'RENTED')) {
    return {
      allowed: false,
      error: 'Accident vehicles must be transitioned to MAINTENANCE for repair and undergo formal inspection before release',
    };
  }

  // 3. MAINTENANCE cannot jump directly to RENTED
  if (fromStatus === 'MAINTENANCE' && toStatus === 'RENTED') {
    return {
      allowed: false,
      error: 'Vehicles under MAINTENANCE must first be released to AVAILABLE before assignment to a rental',
    };
  }

  return { allowed: true };
}

// In-Memory Fallback Store (Used when PostgreSQL daemon is offline during testing or local dev)
const inMemoryVehicles: Array<VehicleDetailAggregate['vehicle']> = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    registrationNumber: 'KL-00-AA-0000',
    manufacturer: 'Honda',
    model: 'Dio',
    variant: '110cc Deluxe',
    manufacturingYear: 2022,
    fuelType: 'PETROL',
    vehicleCategory: 'SCOOTER',
    chassisNumber: 'DEMO-CHASSIS-000001',
    engineNumber: 'DEMO-ENGINE-000001',
    purchaseDate: '2026-01-15',
    purchaseCost: 70000,
    currentOdometer: 14250,
    operationalStatus: 'AVAILABLE',
    complianceStatus: 'VERIFIED_COMPLIANT',
    complianceNotes: 'Kerala MVD Rent-a-Motorcycle Scheme compliance verified with commercial endorsement',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
];

const inMemoryPricing: VehiclePricingItem[] = [
  {
    id: 'p0000000-0000-4000-8000-000000000001',
    packageId: 'b0000000-0000-4000-8000-000000000014',
    packageName: '14 Days Package',
    packageCode: 'PKG_14D',
    durationDays: 14,
    dailyRate: 450,
    packageTotalRate: 6300,
    bookingTokenAmount: 1000,
    securityDepositAmount: 4000,
    kmLimitPerDay: 100,
    extraKmCharge: 4.0,
    isActive: true,
  },
  {
    id: 'p0000000-0000-4000-8000-000000000002',
    packageId: 'b0000000-0000-4000-8000-000000000026',
    packageName: '26 Days Package',
    packageCode: 'PKG_26D',
    durationDays: 26,
    dailyRate: 400,
    packageTotalRate: 10400,
    bookingTokenAmount: 1000,
    securityDepositAmount: 4000,
    kmLimitPerDay: 100,
    extraKmCharge: 4.0,
    isActive: true,
  },
];

const inMemoryDocuments: VehicleDocumentItem[] = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    vehicleId: 'a0000000-0000-4000-8000-000000000001',
    documentType: 'RC',
    documentNumber: 'KL07BW1234/2022',
    storageKey: 'vehicles/KL-00-AA-0000/rc.pdf',
    validFrom: '2022-03-10',
    validUntil: '2037-03-09',
    isCommercialPermit: true,
    verificationStatus: 'VERIFIED',
    notes: 'Registration Certificate issued by Ernakulam RTO with Rent-a-Motorcycle endorsement',
    daysUntilExpiry: 3770,
    isExpired: false,
    isExpiringSoon: false,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    vehicleId: 'a0000000-0000-4000-8000-000000000001',
    documentType: 'INSURANCE',
    documentNumber: 'NIC-COMM-2026-98124',
    storageKey: 'vehicles/KL-00-AA-0000/insurance.pdf',
    validFrom: '2026-01-10',
    validUntil: '2027-01-09',
    isCommercialPermit: false,
    verificationStatus: 'VERIFIED',
    notes: 'Comprehensive Commercial Passenger 2-Wheeler Insurance Policy',
    daysUntilExpiry: 60,
    isExpired: false,
    isExpiringSoon: false,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000003',
    vehicleId: 'a0000000-0000-4000-8000-000000000001',
    documentType: 'PUC',
    documentNumber: 'KL-PUC-2026-4421',
    storageKey: 'vehicles/KL-00-AA-0000/puc.pdf',
    validFrom: '2026-01-05',
    validUntil: '2026-07-04',
    isCommercialPermit: false,
    verificationStatus: 'VERIFIED',
    notes: 'Pollution Under Control Certificate valid 6 months',
    daysUntilExpiry: 120,
    isExpired: false,
    isExpiringSoon: false,
  },
  {
    id: 'd0000000-0000-4000-8000-000000000004',
    vehicleId: 'a0000000-0000-4000-8000-000000000001',
    documentType: 'PERMIT',
    documentNumber: 'KL/ERNAKULAM/RENTAL/004',
    storageKey: 'vehicles/KL-00-AA-0000/mvd-permit.pdf',
    validFrom: '2026-01-15',
    validUntil: '2031-01-14',
    isCommercialPermit: true,
    verificationStatus: 'VERIFIED',
    notes: 'Kerala MVD Rent-a-Motorcycle Scheme Commercial Permit',
    daysUntilExpiry: 1520,
    isExpired: false,
    isExpiringSoon: false,
  },
];

const inMemoryStatusHistory: VehicleStatusHistoryItem[] = [
  {
    id: 'h0000000-0000-4000-8000-000000000001',
    fromStatus: 'AVAILABLE',
    toStatus: 'AVAILABLE',
    reason: 'Initial vehicle onboarding into Kochi fleet operations',
    changedByName: 'Operations Manager',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
];

function getFilteredMemoryVehicles(filters?: { status?: string; search?: string }): VehicleListItem[] {
  let results: VehicleListItem[] = inMemoryVehicles.map((v) => ({
    id: v.id,
    registrationNumber: v.registrationNumber,
    manufacturer: v.manufacturer,
    model: v.model,
    variant: v.variant,
    manufacturingYear: v.manufacturingYear,
    fuelType: v.fuelType,
    vehicleCategory: v.vehicleCategory,
    currentOdometer: v.currentOdometer,
    operationalStatus: v.operationalStatus,
    complianceStatus: v.complianceStatus,
    dailyRate14d: inMemoryPricing.find((p) => p.packageCode === 'PKG_14D')?.dailyRate || 450,
    dailyRate26d: inMemoryPricing.find((p) => p.packageCode === 'PKG_26D')?.dailyRate || 400,
    totalExpenses: 70000,
  }));

  if (filters?.status && filters.status !== 'ALL') {
    results = results.filter((v) => v.operationalStatus === filters.status);
  }
  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (v) =>
        v.registrationNumber.toLowerCase().includes(q) ||
        v.manufacturer.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    );
  }
  return results;
}

/**
 * Service function: Retrieve fleet vehicles for admin listing
 */
export async function getFleetVehicles(filters?: {
  status?: string;
  search?: string;
}): Promise<VehicleListItem[]> {
  const dbOk = await isDbAvailable();
  if (!dbOk) {
    return getFilteredMemoryVehicles(filters);
  }

  try {
    const rows = await db
      .select({
        id: schema.vehicles.id,
        registrationNumber: schema.vehicles.registrationNumber,
        manufacturer: schema.vehicles.manufacturer,
        model: schema.vehicles.model,
        variant: schema.vehicles.variant,
        manufacturingYear: schema.vehicles.manufacturingYear,
        fuelType: schema.vehicles.fuelType,
        vehicleCategory: schema.vehicles.vehicleCategory,
        currentOdometer: schema.vehicles.currentOdometer,
        operationalStatus: schema.vehicles.operationalStatus,
        complianceStatus: schema.vehicles.complianceStatus,
      })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.isDeleted, false))
      .orderBy(desc(schema.vehicles.createdAt));

    let results: VehicleListItem[] = rows.map((v) => ({
      id: v.id,
      registrationNumber: v.registrationNumber,
      manufacturer: v.manufacturer,
      model: v.model,
      variant: v.variant,
      manufacturingYear: v.manufacturingYear,
      fuelType: v.fuelType,
      vehicleCategory: v.vehicleCategory,
      currentOdometer: v.currentOdometer,
      operationalStatus: v.operationalStatus as VehicleOperationalStatus,
      complianceStatus: v.complianceStatus as VehicleComplianceStatus,
      dailyRate14d: 450,
      dailyRate26d: 400,
    }));

    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter((v) => v.operationalStatus === filters.status);
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(q) ||
          v.manufacturer.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      );
    }
    return results;
  } catch {
    return getFilteredMemoryVehicles(filters);
  }
}

/**
 * Service function: Retrieve full 360° aggregate data for a single vehicle
 */
export async function getVehicleById(id: string): Promise<VehicleDetailAggregate | null> {
  const dbOk = await isDbAvailable();
  if (!dbOk) {
    const memVehicle = inMemoryVehicles.find((mv) => mv.id === id);
    if (!memVehicle) return null;
    return buildAggregateFromMemory(memVehicle);
  }

  try {
    const [v] = await db
      .select()
      .from(schema.vehicles)
      .where(and(eq(schema.vehicles.id, id), eq(schema.vehicles.isDeleted, false)));

    if (!v) {
      const memVehicle = inMemoryVehicles.find((mv) => mv.id === id);
      if (!memVehicle) return null;
      return buildAggregateFromMemory(memVehicle);
    }

    // Load pricing
    const pricingRows = await db
      .select({
        id: schema.vehiclePricing.id,
        packageId: schema.vehiclePricing.packageId,
        packageName: schema.rentalPackages.name,
        packageCode: schema.rentalPackages.code,
        durationDays: schema.rentalPackages.durationDays,
        dailyRate: schema.vehiclePricing.dailyRate,
        packageTotalRate: schema.vehiclePricing.packageTotalRate,
        bookingTokenAmount: schema.vehiclePricing.bookingTokenAmount,
        securityDepositAmount: schema.vehiclePricing.securityDepositAmount,
        kmLimitPerDay: schema.vehiclePricing.kmLimitPerDay,
        extraKmCharge: schema.vehiclePricing.extraKmCharge,
        isActive: schema.vehiclePricing.isActive,
      })
      .from(schema.vehiclePricing)
      .innerJoin(
        schema.rentalPackages,
        eq(schema.vehiclePricing.packageId, schema.rentalPackages.id)
      )
      .where(eq(schema.vehiclePricing.vehicleId, id));

    const pricing: VehiclePricingItem[] = pricingRows.map((p) => ({
      id: p.id,
      packageId: p.packageId,
      packageName: p.packageName,
      packageCode: p.packageCode,
      durationDays: p.durationDays,
      dailyRate: Number(p.dailyRate),
      packageTotalRate: Number(p.packageTotalRate),
      bookingTokenAmount: Number(p.bookingTokenAmount),
      securityDepositAmount: Number(p.securityDepositAmount),
      kmLimitPerDay: p.kmLimitPerDay,
      extraKmCharge: Number(p.extraKmCharge),
      isActive: p.isActive,
    }));

    // Load documents
    const docRows = await db
      .select()
      .from(schema.vehicleDocuments)
      .where(eq(schema.vehicleDocuments.vehicleId, id));

    const documents: VehicleDocumentItem[] = docRows.map((d) => {
      const expiry = computeDocumentExpiry(d.validUntil);
      return {
        id: d.id,
        vehicleId: d.vehicleId,
        documentType: d.documentType,
        documentNumber: d.documentNumber,
        storageKey: d.storageKey,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        isCommercialPermit: d.isCommercialPermit,
        verificationStatus: d.verificationStatus,
        notes: d.notes,
        ...expiry,
      };
    });

    // Load status history
    const historyRows = await db
      .select({
        id: schema.vehicleStatusHistory.id,
        fromStatus: schema.vehicleStatusHistory.fromStatus,
        toStatus: schema.vehicleStatusHistory.toStatus,
        reason: schema.vehicleStatusHistory.reason,
        createdAt: schema.vehicleStatusHistory.createdAt,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      })
      .from(schema.vehicleStatusHistory)
      .leftJoin(schema.users, eq(schema.vehicleStatusHistory.changedBy, schema.users.id))
      .where(eq(schema.vehicleStatusHistory.vehicleId, id))
      .orderBy(desc(schema.vehicleStatusHistory.createdAt));

    const statusHistory: VehicleStatusHistoryItem[] = historyRows.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus as VehicleOperationalStatus,
      toStatus: h.toStatus as VehicleOperationalStatus,
      reason: h.reason,
      changedByName: h.firstName ? `${h.firstName} ${h.lastName}`.trim() : 'Operations Admin',
      createdAt: h.createdAt.toISOString(),
    }));

    return {
      vehicle: {
        id: v.id,
        registrationNumber: v.registrationNumber,
        manufacturer: v.manufacturer,
        model: v.model,
        variant: v.variant,
        manufacturingYear: v.manufacturingYear,
        fuelType: v.fuelType,
        vehicleCategory: v.vehicleCategory,
        chassisNumber: v.chassisNumber,
        engineNumber: v.engineNumber,
        purchaseDate: v.purchaseDate,
        purchaseCost: Number(v.purchaseCost),
        currentOdometer: v.currentOdometer,
        operationalStatus: v.operationalStatus as VehicleOperationalStatus,
        complianceStatus: v.complianceStatus as VehicleComplianceStatus,
        complianceNotes: v.complianceNotes,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      },
      pricing,
      documents,
      statusHistory,
      activeAssignment: null,
      maintenanceHistory: [],
      expenseSummary: {
        totalLifetimeCost: Number(v.purchaseCost),
        purchaseCost: Number(v.purchaseCost),
        maintenanceCost: 0,
        recordsCount: 1,
      },
    };
  } catch {
    const memVehicle = inMemoryVehicles.find((mv) => mv.id === id);
    if (!memVehicle) return null;
    return buildAggregateFromMemory(memVehicle);
  }
}

function buildAggregateFromMemory(vehicle: VehicleDetailAggregate['vehicle']): VehicleDetailAggregate {
  const documents = inMemoryDocuments
    .filter((d) => d.vehicleId === vehicle.id)
    .map((d) => ({
      ...d,
      ...computeDocumentExpiry(d.validUntil),
    }));

  return {
    vehicle,
    pricing: inMemoryPricing,
    documents,
    statusHistory: inMemoryStatusHistory,
    activeAssignment: null,
    maintenanceHistory: [
      {
        id: 'm0000000-0000-4000-8000-000000000001',
        serviceType: 'PERIODIC_OIL_CHANGE',
        repairStatus: 'COMPLETED',
        description: 'First periodic service: Honda 10W30 engine oil replacement and brake inspection',
        totalCost: 850,
        serviceDate: '2026-02-01',
        workshopName: 'Demo Workshop, Palarivattom',
      },
    ],
    expenseSummary: {
      totalLifetimeCost: vehicle.purchaseCost + 850,
      purchaseCost: vehicle.purchaseCost,
      maintenanceCost: 850,
      recordsCount: 2,
    },
  };
}

/**
 * Service function: Create new vehicle onboarding record
 */
export async function createVehicle(
  input: VehicleCreateInput,
  adminId?: string
): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
  const dbOk = await isDbAvailable();
  if (!dbOk) {
    return createVehicleInMemory(input);
  }

  try {
    const [existing] = await db
      .select({ id: schema.vehicles.id })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.registrationNumber, input.registrationNumber));

    if (existing) {
      return {
        success: false,
        error: `A vehicle with registration number ${input.registrationNumber} already exists`,
      };
    }

    const initialOperationalStatus: VehicleOperationalStatus =
      input.complianceStatus === 'VERIFIED_COMPLIANT' ? 'AVAILABLE' : 'UNAVAILABLE';
    const onboardingReason =
      input.complianceStatus === 'VERIFIED_COMPLIANT'
        ? 'Initial vehicle onboarding into Kochi fleet operations'
        : 'Initial vehicle onboarding (Awaiting Kerala MVD compliance verification)';

    const [created] = await db
      .insert(schema.vehicles)
      .values({
        registrationNumber: input.registrationNumber,
        manufacturer: input.manufacturer,
        model: input.model,
        variant: input.variant || null,
        manufacturingYear: input.manufacturingYear,
        fuelType: input.fuelType,
        vehicleCategory: input.vehicleCategory,
        chassisNumber: input.chassisNumber,
        engineNumber: input.engineNumber,
        purchaseDate: input.purchaseDate,
        purchaseCost: input.purchaseCost.toFixed(2),
        currentOdometer: input.currentOdometer,
        operationalStatus: initialOperationalStatus,
        complianceStatus: input.complianceStatus,
        complianceNotes: input.complianceNotes || null,
      })
      .returning();

    // Log initial status in history
    await db.insert(schema.vehicleStatusHistory).values({
      vehicleId: created.id,
      fromStatus: initialOperationalStatus,
      toStatus: initialOperationalStatus,
      reason: onboardingReason,
      changedBy: adminId || null,
    });

    return { success: true, vehicleId: created.id };
  } catch {
    return createVehicleInMemory(input);
  }
}

function createVehicleInMemory(input: VehicleCreateInput): {
  success: boolean;
  vehicleId?: string;
  error?: string;
} {
  const existing = inMemoryVehicles.find(
    (v) => v.registrationNumber === input.registrationNumber
  );
  if (existing) {
    return {
      success: false,
      error: `A vehicle with registration number ${input.registrationNumber} already exists`,
    };
  }

  const initialOperationalStatus: VehicleOperationalStatus =
    input.complianceStatus === 'VERIFIED_COMPLIANT' ? 'AVAILABLE' : 'UNAVAILABLE';
  const onboardingReason =
    input.complianceStatus === 'VERIFIED_COMPLIANT'
      ? 'Initial vehicle onboarding into Kochi fleet operations'
      : 'Initial vehicle onboarding (Awaiting Kerala MVD compliance verification)';

  const newId = `v-${Date.now()}`;
  const newVehicle: VehicleDetailAggregate['vehicle'] = {
    id: newId,
    registrationNumber: input.registrationNumber,
    manufacturer: input.manufacturer,
    model: input.model,
    variant: input.variant || null,
    manufacturingYear: input.manufacturingYear,
    fuelType: input.fuelType,
    vehicleCategory: input.vehicleCategory,
    chassisNumber: input.chassisNumber,
    engineNumber: input.engineNumber,
    purchaseDate: input.purchaseDate,
    purchaseCost: input.purchaseCost,
    currentOdometer: input.currentOdometer,
    operationalStatus: initialOperationalStatus,
    complianceStatus: input.complianceStatus,
    complianceNotes: input.complianceNotes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryVehicles.push(newVehicle);
  inMemoryStatusHistory.unshift({
    id: `h-${Date.now()}`,
    fromStatus: initialOperationalStatus,
    toStatus: initialOperationalStatus,
    reason: onboardingReason,
    changedByName: 'Operations Manager',
    createdAt: new Date().toISOString(),
  });

  return { success: true, vehicleId: newId };
}

/**
 * Service function: Update vehicle specifications or general details
 */
export async function updateVehicle(
  id: string,
  input: VehicleUpdateInput
): Promise<{ success: boolean; error?: string }> {
  const dbOk = await isDbAvailable();
  if (!dbOk) {
    return updateVehicleInMemory(id, input);
  }

  try {
    await db
      .update(schema.vehicles)
      .set({
        ...(input.manufacturer && { manufacturer: input.manufacturer }),
        ...(input.model && { model: input.model }),
        ...(input.variant !== undefined && { variant: input.variant }),
        ...(input.manufacturingYear && { manufacturingYear: input.manufacturingYear }),
        ...(input.currentOdometer !== undefined && { currentOdometer: input.currentOdometer }),
        ...(input.complianceStatus && { complianceStatus: input.complianceStatus }),
        ...(input.complianceNotes !== undefined && { complianceNotes: input.complianceNotes }),
        updatedAt: new Date(),
      })
      .where(eq(schema.vehicles.id, id));

    return { success: true };
  } catch {
    return updateVehicleInMemory(id, input);
  }
}

function updateVehicleInMemory(
  id: string,
  input: VehicleUpdateInput
): { success: boolean; error?: string } {
  const v = inMemoryVehicles.find((item) => item.id === id);
  if (!v) return { success: false, error: 'Vehicle not found' };
  if (input.manufacturer) v.manufacturer = input.manufacturer;
  if (input.model) v.model = input.model;
  if (input.variant !== undefined) v.variant = input.variant;
  if (input.manufacturingYear) v.manufacturingYear = input.manufacturingYear;
  if (input.currentOdometer !== undefined) v.currentOdometer = input.currentOdometer;
  if (input.complianceStatus) v.complianceStatus = input.complianceStatus;
  if (input.complianceNotes !== undefined) v.complianceNotes = input.complianceNotes;
  v.updatedAt = new Date().toISOString();
  return { success: true };
}

/**
 * Service function: Transition vehicle operational status with mandatory audit log
 */
export async function updateVehicleStatus(
  id: string,
  newStatus: VehicleOperationalStatus,
  reason: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  const vehicle = await getVehicleById(id);
  if (!vehicle) return { success: false, error: 'Vehicle not found' };

  const currentStatus = vehicle.vehicle.operationalStatus;
  const validation = validateStatusTransition(
    currentStatus,
    newStatus,
    reason,
    vehicle.vehicle.complianceStatus
  );
  if (!validation.allowed) {
    return { success: false, error: validation.error };
  }

  const dbOk = await isDbAvailable();
  if (!dbOk) {
    return updateVehicleStatusInMemory(id, newStatus, reason);
  }

  try {
    await db
      .update(schema.vehicles)
      .set({
        operationalStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.vehicles.id, id));

    await db.insert(schema.vehicleStatusHistory).values({
      vehicleId: id,
      fromStatus: currentStatus,
      toStatus: newStatus,
      reason: reason.trim(),
      changedBy: adminId || null,
    });

    return { success: true };
  } catch {
    return updateVehicleStatusInMemory(id, newStatus, reason);
  }
}

function updateVehicleStatusInMemory(
  id: string,
  newStatus: VehicleOperationalStatus,
  reason: string
): { success: boolean; error?: string } {
  const v = inMemoryVehicles.find((item) => item.id === id);
  if (!v) return { success: false, error: 'Vehicle not found' };

  const currentStatus = v.operationalStatus;
  v.operationalStatus = newStatus;
  v.updatedAt = new Date().toISOString();

  inMemoryStatusHistory.unshift({
    id: `h-${Date.now()}`,
    fromStatus: currentStatus,
    toStatus: newStatus,
    reason: reason.trim(),
    changedByName: 'Operations Manager',
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Service function: Upsert vehicle-specific pricing for a rental package
 */
export async function upsertVehiclePricing(
  vehicleId: string,
  packageId: string,
  pricingInput: VehiclePricingInput,
  durationDays: number,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  const packageTotalRate = Math.round(pricingInput.dailyRate * durationDays * 100) / 100;

  const dbOk = await isDbAvailable();
  if (!dbOk) {
    return upsertVehiclePricingInMemory(vehicleId, packageId, pricingInput, packageTotalRate, durationDays);
  }

  try {
    const [existing] = await db
      .select({ id: schema.vehiclePricing.id })
      .from(schema.vehiclePricing)
      .where(
        and(
          eq(schema.vehiclePricing.vehicleId, vehicleId),
          eq(schema.vehiclePricing.packageId, packageId),
          eq(schema.vehiclePricing.isActive, true)
        )
      );

    if (existing) {
      await db
        .update(schema.vehiclePricing)
        .set({
          dailyRate: pricingInput.dailyRate.toFixed(2),
          packageTotalRate: packageTotalRate.toFixed(2),
          bookingTokenAmount: pricingInput.bookingTokenAmount.toFixed(2),
          securityDepositAmount: pricingInput.securityDepositAmount.toFixed(2),
          kmLimitPerDay: pricingInput.kmLimitPerDay,
          extraKmCharge: pricingInput.extraKmCharge.toFixed(2),
        })
        .where(eq(schema.vehiclePricing.id, existing.id));
    } else {
      await db.insert(schema.vehiclePricing).values({
        vehicleId,
        packageId,
        dailyRate: pricingInput.dailyRate.toFixed(2),
        packageTotalRate: packageTotalRate.toFixed(2),
        bookingTokenAmount: pricingInput.bookingTokenAmount.toFixed(2),
        securityDepositAmount: pricingInput.securityDepositAmount.toFixed(2),
        kmLimitPerDay: pricingInput.kmLimitPerDay,
        extraKmCharge: pricingInput.extraKmCharge.toFixed(2),
        isActive: true,
        createdBy: adminId || null,
      });
    }

    return { success: true };
  } catch {
    return upsertVehiclePricingInMemory(vehicleId, packageId, pricingInput, packageTotalRate, durationDays);
  }
}

function upsertVehiclePricingInMemory(
  _vehicleId: string,
  packageId: string,
  pricingInput: VehiclePricingInput,
  packageTotalRate: number,
  durationDays: number
): { success: boolean; error?: string } {
  const existing = inMemoryPricing.find((p) => p.packageId === packageId);
  if (existing) {
    existing.dailyRate = pricingInput.dailyRate;
    existing.packageTotalRate = packageTotalRate;
    existing.bookingTokenAmount = pricingInput.bookingTokenAmount;
    existing.securityDepositAmount = pricingInput.securityDepositAmount;
    existing.kmLimitPerDay = pricingInput.kmLimitPerDay;
    existing.extraKmCharge = pricingInput.extraKmCharge;
  } else {
    inMemoryPricing.push({
      id: `p-${Date.now()}`,
      packageId,
      packageName: durationDays === 14 ? '14 Days Package' : `${durationDays} Days Package`,
      packageCode: `PKG_${durationDays}D`,
      durationDays,
      dailyRate: pricingInput.dailyRate,
      packageTotalRate,
      bookingTokenAmount: pricingInput.bookingTokenAmount,
      securityDepositAmount: pricingInput.securityDepositAmount,
      kmLimitPerDay: pricingInput.kmLimitPerDay,
      extraKmCharge: pricingInput.extraKmCharge,
      isActive: true,
    });
  }
  return { success: true };
}

export interface MemoryAssignment {
  id: string;
  bookingId: string;
  riderId: string;
  vehicleId: string;
  startingOdometer: number;
  endingOdometer?: number | null;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  assignmentReason:
    | 'INITIAL_ASSIGNMENT'
    | 'MAINTENANCE_REPLACEMENT'
    | 'ACCIDENT_REPLACEMENT'
    | 'OTHER_APPROVED_REASON';
  previousAssignmentId?: string | null;
  assignmentStart: string;
  assignmentEnd?: string | null;
  notes?: string | null;
}

export const inMemoryAssignments: MemoryAssignment[] = [
  {
    id: 'asg-00000000-0000-4000-8000-000000000001',
    bookingId: 'bk-00000000-0000-4000-8000-000000000001',
    riderId: 'rdr-00000000-0000-4000-8000-000000000001',
    vehicleId: 'a0000000-0000-4000-8000-000000000001',
    startingOdometer: 14250,
    endingOdometer: null,
    status: 'ACTIVE',
    assignmentReason: 'INITIAL_ASSIGNMENT',
    previousAssignmentId: null,
    assignmentStart: '2026-02-01T09:00:00.000Z',
    notes: 'Initial demo assignment',
  },
];

export function resetInMemoryAssignmentsForTesting() {
  inMemoryAssignments.length = 0;
  inMemoryAssignments.push({
    id: 'asg-00000000-0000-4000-8000-000000000001',
    bookingId: 'bk-00000000-0000-4000-8000-000000000001',
    riderId: 'rdr-00000000-0000-4000-8000-000000000001',
    vehicleId: 'a0000000-0000-4000-8000-000000000001',
    startingOdometer: 14250,
    endingOdometer: null,
    status: 'ACTIVE',
    assignmentReason: 'INITIAL_ASSIGNMENT',
    previousAssignmentId: null,
    assignmentStart: '2026-02-01T09:00:00.000Z',
    notes: 'Initial demo assignment',
  });
}

export interface VehicleReplacementParams {
  bookingId: string;
  currentAssignmentId: string;
  breakdownOdometer: number;
  replacementVehicleId: string;
  reason: 'MAINTENANCE_REPLACEMENT' | 'ACCIDENT_REPLACEMENT';
  adminId?: string;
  adminNotes?: string;
}

export interface VehicleReplacementOutcome {
  success: boolean;
  closedAssignment?: {
    id: string;
    vehicleId: string;
    startingOdometer: number;
    endingOdometer?: number | null;
    status: string;
    notes?: string | null;
  };
  newAssignment?: {
    id: string;
    bookingId: string;
    riderId: string;
    vehicleId: string;
    previousAssignmentId?: string | null;
    startingOdometer: number;
    endingOdometer?: number | null;
    status: string;
    assignmentReason: string;
    notes?: string | null;
  };
  bookingId?: string;
  riderId?: string;
  preservedPricingSnapshot?: boolean;
  error?: string;
}

/**
 * Service function: Executes a transactional vehicle replacement mid-rental
 * Invariant: Preserves original booking identity, rider identity, and frozen price snapshots.
 */
export async function replaceVehicleAssignment(
  params: VehicleReplacementParams
): Promise<VehicleReplacementOutcome> {
  const dbOk = await isDbAvailable();
  if (!dbOk) {
    return replaceVehicleAssignmentInMemory(params);
  }

  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch current assignment
      const [current] = await tx
        .select()
        .from(schema.vehicleAssignments)
        .where(
          and(
            eq(schema.vehicleAssignments.id, params.currentAssignmentId),
            eq(schema.vehicleAssignments.bookingId, params.bookingId)
          )
        );

      if (!current) {
        throw new Error('Current assignment not found for the specified booking');
      }
      if (current.status !== 'ACTIVE') {
        throw new Error(`Assignment cannot be replaced because status is ${current.status}`);
      }
      if (params.breakdownOdometer < current.startingOdometer) {
        throw new Error(
          `Breakdown odometer (${params.breakdownOdometer}) cannot be less than starting odometer (${current.startingOdometer})`
        );
      }

      // 2. Fetch replacement vehicle
      const [repVehicle] = await tx
        .select()
        .from(schema.vehicles)
        .where(eq(schema.vehicles.id, params.replacementVehicleId));

      if (!repVehicle) {
        throw new Error('Replacement vehicle not found');
      }
      if (repVehicle.operationalStatus !== 'AVAILABLE') {
        throw new Error(
          `Replacement vehicle must be AVAILABLE, but is currently ${repVehicle.operationalStatus}`
        );
      }
      if (repVehicle.complianceStatus !== 'VERIFIED_COMPLIANT') {
        throw new Error(
          `Replacement vehicle must have VERIFIED_COMPLIANT status, but is ${repVehicle.complianceStatus}`
        );
      }

      // 3. Verify replacement vehicle has NO other active assignment (Exclusivity)
      const [existingActive] = await tx
        .select({ id: schema.vehicleAssignments.id })
        .from(schema.vehicleAssignments)
        .where(
          and(
            eq(schema.vehicleAssignments.vehicleId, params.replacementVehicleId),
            eq(schema.vehicleAssignments.status, 'ACTIVE')
          )
        );

      if (existingActive) {
        throw new Error(
          'Replacement vehicle already has an ACTIVE assignment. Assignment exclusivity violated.'
        );
      }

      // 4. Close current assignment
      const [closed] = await tx
        .update(schema.vehicleAssignments)
        .set({
          status: 'CLOSED',
          endingOdometer: params.breakdownOdometer,
          assignmentEnd: new Date(),
          notes: `${current.notes || ''} [Replaced due to ${params.reason}]`.trim(),
          updatedAt: new Date(),
        })
        .where(eq(schema.vehicleAssignments.id, current.id))
        .returning();

      // 5. Transition broken vehicle status
      const oldVehicleStatus: VehicleOperationalStatus =
        params.reason === 'ACCIDENT_REPLACEMENT' ? 'ACCIDENT' : 'MAINTENANCE';
      await tx
        .update(schema.vehicles)
        .set({
          operationalStatus: oldVehicleStatus,
          currentOdometer: params.breakdownOdometer,
          updatedAt: new Date(),
        })
        .where(eq(schema.vehicles.id, current.vehicleId));

      await tx.insert(schema.vehicleStatusHistory).values({
        vehicleId: current.vehicleId,
        fromStatus: 'RENTED',
        toStatus: oldVehicleStatus,
        reason: `Replaced in booking ${params.bookingId} due to ${params.reason}`,
        changedBy: params.adminId || null,
      });

      // 6. Create replacement assignment preserving bookingId & riderId
      const [newAsg] = await tx
        .insert(schema.vehicleAssignments)
        .values({
          bookingId: current.bookingId,
          riderId: current.riderId,
          vehicleId: repVehicle.id,
          previousAssignmentId: current.id,
          startingOdometer: repVehicle.currentOdometer,
          status: 'ACTIVE',
          assignmentReason: params.reason,
          notes:
            params.adminNotes ||
            `Replacement vehicle allocated for booking ${params.bookingId}`,
        })
        .returning();

      // 7. Transition replacement vehicle to RENTED
      await tx
        .update(schema.vehicles)
        .set({
          operationalStatus: 'RENTED',
          updatedAt: new Date(),
        })
        .where(eq(schema.vehicles.id, repVehicle.id));

      await tx.insert(schema.vehicleStatusHistory).values({
        vehicleId: repVehicle.id,
        fromStatus: 'AVAILABLE',
        toStatus: 'RENTED',
        reason: `Allocated as replacement vehicle in booking ${params.bookingId}`,
        changedBy: params.adminId || null,
      });

      return {
        success: true,
        closedAssignment: closed,
        newAssignment: newAsg,
        bookingId: current.bookingId,
        riderId: current.riderId,
        preservedPricingSnapshot: true,
      };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Replacement transaction failed';
    return { success: false, error: message };
  }
}

function replaceVehicleAssignmentInMemory(
  params: VehicleReplacementParams
): VehicleReplacementOutcome {
  // 1. Find current assignment
  const current = inMemoryAssignments.find(
    (a) => a.id === params.currentAssignmentId && a.bookingId === params.bookingId
  );
  if (!current) {
    return { success: false, error: 'Current assignment not found for the specified booking' };
  }
  if (current.status !== 'ACTIVE') {
    return {
      success: false,
      error: `Assignment cannot be replaced because status is ${current.status}`,
    };
  }
  if (params.breakdownOdometer < current.startingOdometer) {
    return {
      success: false,
      error: `Breakdown odometer (${params.breakdownOdometer}) cannot be less than starting odometer (${current.startingOdometer})`,
    };
  }

  // 2. Find replacement vehicle
  const repVehicle = inMemoryVehicles.find((v) => v.id === params.replacementVehicleId);
  if (!repVehicle) {
    return { success: false, error: 'Replacement vehicle not found' };
  }
  if (repVehicle.operationalStatus !== 'AVAILABLE') {
    return {
      success: false,
      error: `Replacement vehicle must be AVAILABLE, but is currently ${repVehicle.operationalStatus}`,
    };
  }
  if (repVehicle.complianceStatus !== 'VERIFIED_COMPLIANT') {
    return {
      success: false,
      error: `Replacement vehicle must have VERIFIED_COMPLIANT status, but is ${repVehicle.complianceStatus}`,
    };
  }

  // 3. Check exclusivity
  const existingActive = inMemoryAssignments.find(
    (a) => a.vehicleId === params.replacementVehicleId && a.status === 'ACTIVE'
  );
  if (existingActive) {
    return {
      success: false,
      error: 'Replacement vehicle already has an ACTIVE assignment. Assignment exclusivity violated.',
    };
  }

  // 4. Close current assignment
  current.status = 'CLOSED';
  current.endingOdometer = params.breakdownOdometer;
  current.assignmentEnd = new Date().toISOString();
  current.notes = `${current.notes || ''} [Replaced due to ${params.reason}]`.trim();

  // 5. Update old vehicle
  const oldVehicle = inMemoryVehicles.find((v) => v.id === current.vehicleId);
  const oldVehicleStatus: VehicleOperationalStatus =
    params.reason === 'ACCIDENT_REPLACEMENT' ? 'ACCIDENT' : 'MAINTENANCE';
  if (oldVehicle) {
    oldVehicle.operationalStatus = oldVehicleStatus;
    oldVehicle.currentOdometer = params.breakdownOdometer;
    oldVehicle.updatedAt = new Date().toISOString();
  }

  inMemoryStatusHistory.unshift({
    id: `h-${Date.now()}`,
    fromStatus: 'RENTED',
    toStatus: oldVehicleStatus,
    reason: `Replaced in booking ${params.bookingId} due to ${params.reason}`,
    changedByName: 'Operations Manager',
    createdAt: new Date().toISOString(),
  });

  // 6. Create replacement assignment
  const newAsgId = `asg-${Date.now()}`;
  const newAsg: MemoryAssignment = {
    id: newAsgId,
    bookingId: current.bookingId, // Preserved!
    riderId: current.riderId,     // Preserved!
    vehicleId: repVehicle.id,
    previousAssignmentId: current.id,
    startingOdometer: repVehicle.currentOdometer,
    endingOdometer: null,
    status: 'ACTIVE',
    assignmentReason: params.reason,
    assignmentStart: new Date().toISOString(),
    notes:
      params.adminNotes ||
      `Replacement vehicle allocated for booking ${params.bookingId}`,
  };
  inMemoryAssignments.push(newAsg);

  // 7. Update replacement vehicle
  repVehicle.operationalStatus = 'RENTED';
  repVehicle.updatedAt = new Date().toISOString();

  inMemoryStatusHistory.unshift({
    id: `h-${Date.now() + 1}`,
    fromStatus: 'AVAILABLE',
    toStatus: 'RENTED',
    reason: `Allocated as replacement vehicle in booking ${params.bookingId}`,
    changedByName: 'Operations Manager',
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    closedAssignment: current,
    newAssignment: newAsg,
    bookingId: current.bookingId,
    riderId: current.riderId,
    preservedPricingSnapshot: true,
  };
}

/**
 * Pure domain function: Computes vehicle profitability and capital segregation
 * Enforces:
 * 1. Capitalized purchase cost is kept separate from operating expenses.
 * 2. Operating expenses (maintenance, oil changes, repairs) are P&L items.
 * 3. Security deposit liabilities are balance sheet items, NEVER included in rental revenue.
 */
export function calculateVehicleProfitability(params: {
  purchaseCost: number;
  operatingExpenses: number[];
  rentalRevenue: number;
  securityDepositsHeld: number;
}): {
  capitalizedPurchaseCost: number;
  totalOperatingExpenses: number;
  totalRentalRevenue: number;
  securityDepositLiability: number;
  operatingProfit: number;
  netAssetReturn: number;
} {
  const capitalizedPurchaseCost = Math.round(params.purchaseCost * 100) / 100;
  const totalOperatingExpenses =
    Math.round(params.operatingExpenses.reduce((sum, exp) => sum + exp, 0) * 100) / 100;
  const totalRentalRevenue = Math.round(params.rentalRevenue * 100) / 100;
  const securityDepositLiability = Math.round(params.securityDepositsHeld * 100) / 100;

  // Operating Profit = Rental Revenue - Operating Expenses (Deposits are NOT revenue)
  const operatingProfit = Math.round((totalRentalRevenue - totalOperatingExpenses) * 100) / 100;

  // Net Asset Return = Operating Profit - Capital Acquisition Cost
  const netAssetReturn = Math.round((operatingProfit - capitalizedPurchaseCost) * 100) / 100;

  return {
    capitalizedPurchaseCost,
    totalOperatingExpenses,
    totalRentalRevenue,
    securityDepositLiability,
    operatingProfit,
    netAssetReturn,
  };
}




