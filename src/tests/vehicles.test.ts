import { describe, it, expect } from 'vitest';
import {
  vehicleCreateSchema,
  vehicleStatusChangeSchema,
  vehiclePricingSchema,
  vehicleDocumentSchema,
  formatRegistrationNumber,
} from '@/lib/validations/vehicle';
import {
  validateStatusTransition,
  computeDocumentExpiry,
  getFleetVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  upsertVehiclePricing,
  calculateVehicleProfitability,
} from '@/services/vehicles';

describe('Vehicle Validation Schemas', () => {
  describe('Registration Number Formatting & Validation', () => {
    it('formats various Indian vehicle registration styles into standard uppercase hyphenated format', () => {
      expect(formatRegistrationNumber('kl-07-bw-1234')).toBe('KL-07-BW-1234');
      expect(formatRegistrationNumber('kl07bw1234')).toBe('KL-07-BW-1234');
      expect(formatRegistrationNumber('KL 7 BW 1234')).toBe('KL-07-BW-1234');
    });

    it('validates a correct Kerala registration number', () => {
      const validData = {
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
        complianceStatus: 'PENDING_REVIEW',
      };

      const result = vehicleCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.registrationNumber).toBe('KL-00-AA-0000');
      }
    });

    it('rejects invalid registration formats', () => {
      const invalidData = {
        registrationNumber: 'NOT-A-REG',
        manufacturer: 'Honda',
        model: 'Dio',
        manufacturingYear: 2022,
        chassisNumber: 'CHASSIS123',
        engineNumber: 'ENG123',
        purchaseDate: '2026-01-15',
        purchaseCost: 70000,
        currentOdometer: 1000,
      };

      const result = vehicleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.registrationNumber).toBeDefined();
      }
    });

    it('rejects negative or zero purchase cost', () => {
      const zeroCost = {
        registrationNumber: 'KL-07-BW-9999',
        manufacturer: 'Honda',
        model: 'Activa',
        manufacturingYear: 2023,
        chassisNumber: 'CHASSIS999',
        engineNumber: 'ENG999',
        purchaseDate: '2026-01-15',
        purchaseCost: 0,
        currentOdometer: 0,
      };

      const result = vehicleCreateSchema.safeParse(zeroCost);
      expect(result.success).toBe(false);
    });

    it('rejects negative odometer readings', () => {
      const negativeOdo = {
        registrationNumber: 'KL-07-BW-9999',
        manufacturer: 'Honda',
        model: 'Activa',
        manufacturingYear: 2023,
        chassisNumber: 'CHASSIS999',
        engineNumber: 'ENG999',
        purchaseDate: '2026-01-15',
        purchaseCost: 70000,
        currentOdometer: -50,
      };

      const result = vehicleCreateSchema.safeParse(negativeOdo);
      expect(result.success).toBe(false);
    });
  });

  describe('Vehicle Status Change Validation', () => {
    it('accepts valid status and audit reason >= 5 characters', () => {
      const valid = {
        operationalStatus: 'MAINTENANCE',
        reason: 'Scheduled 15,000 km oil change and brake inspection',
      };
      const result = vehicleStatusChangeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing or short reason (< 5 characters)', () => {
      const invalid = {
        operationalStatus: 'MAINTENANCE',
        reason: 'fix',
      };
      const result = vehicleStatusChangeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.reason).toBeDefined();
      }
    });
  });

  describe('Vehicle Pricing Validation', () => {
    it('validates correct package pricing configuration', () => {
      const valid = {
        packageId: 'b0000000-0000-4000-8000-000000000014',
        dailyRate: 450,
        bookingTokenAmount: 1000,
        securityDepositAmount: 4000,
        kmLimitPerDay: 100,
        extraKmCharge: 4.0,
      };
      const result = vehiclePricingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects zero or negative daily rate', () => {
      const invalid = {
        packageId: 'b0000000-0000-4000-8000-000000000014',
        dailyRate: 0,
        bookingTokenAmount: 1000,
        securityDepositAmount: 4000,
      };
      const result = vehiclePricingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Vehicle Document Validity Date Verification', () => {
    it('rejects documents where validUntil is before validFrom', () => {
      const invalidDoc = {
        documentType: 'INSURANCE',
        documentNumber: 'POL-12345',
        storageKey: 'vehicles/KL-00-AA-0000/ins.pdf',
        validFrom: '2026-06-01',
        validUntil: '2026-01-01', // Before validFrom!
        isCommercialPermit: false,
      };
      const result = vehicleDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });

    it('accepts documents with valid date range', () => {
      const validDoc = {
        documentType: 'INSURANCE',
        documentNumber: 'POL-12345',
        storageKey: 'vehicles/KL-00-AA-0000/ins.pdf',
        validFrom: '2026-01-01',
        validUntil: '2027-01-01',
        isCommercialPermit: true,
      };
      const result = vehicleDocumentSchema.safeParse(validDoc);
      expect(result.success).toBe(true);
    });
  });
});

describe('Vehicle Domain Service Rules', () => {
  describe('Document Expiry Metrics', () => {
    const fixedNow = new Date('2026-03-01T00:00:00.000Z');

    it('detects an expired document', () => {
      const result = computeDocumentExpiry('2026-02-15', fixedNow);
      expect(result.isExpired).toBe(true);
      expect(result.daysUntilExpiry).toBeLessThan(0);
    });

    it('detects a document expiring soon (within 30 days)', () => {
      const result = computeDocumentExpiry('2026-03-20', fixedNow);
      expect(result.isExpired).toBe(false);
      expect(result.isExpiringSoon).toBe(true);
      expect(result.daysUntilExpiry).toBe(19);
    });

    it('detects a healthy valid document (> 30 days)', () => {
      const result = computeDocumentExpiry('2026-09-01', fixedNow);
      expect(result.isExpired).toBe(false);
      expect(result.isExpiringSoon).toBe(false);
      expect(result.daysUntilExpiry).toBeGreaterThan(30);
    });
  });

  describe('Operational Status State Machine & Transition Rules', () => {
    it('disallows transition to the identical status', () => {
      const result = validateStatusTransition('AVAILABLE', 'AVAILABLE', 'Redundant update');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('already in AVAILABLE status');
    });

    it('enforces mandatory audit reason with min 5 characters', () => {
      const result = validateStatusTransition('AVAILABLE', 'MAINTENANCE', 'bad');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('minimum 5 characters');
    });

    it('disallows transitions from RETIRED status (terminal state)', () => {
      const result = validateStatusTransition(
        'RETIRED',
        'AVAILABLE',
        'Attempting to revive retired scooter'
      );
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Cannot transition a RETIRED vehicle');
    });

    it('disallows ACCIDENT vehicles from jumping directly to AVAILABLE or RENTED', () => {
      const toAvailable = validateStatusTransition(
        'ACCIDENT',
        'AVAILABLE',
        'Quick cosmetic fix claim'
      );
      expect(toAvailable.allowed).toBe(false);
      expect(toAvailable.error).toContain('Accident vehicles must be transitioned to MAINTENANCE');

      const toRented = validateStatusTransition(
        'ACCIDENT',
        'RENTED',
        'Direct rental assignment'
      );
      expect(toRented.allowed).toBe(false);
    });

    it('disallows MAINTENANCE vehicles from jumping directly to RENTED', () => {
      const toRented = validateStatusTransition(
        'MAINTENANCE',
        'RENTED',
        'Assigning straight from workshop'
      );
      expect(toRented.allowed).toBe(false);
      expect(toRented.error).toContain('first be released to AVAILABLE');
    });

    it('enforces Kerala MVD compliance gate before allowing AVAILABLE status', () => {
      const pendingReviewAttempt = validateStatusTransition(
        'UNAVAILABLE',
        'AVAILABLE',
        'Admin inspection completed',
        'PENDING_REVIEW'
      );
      expect(pendingReviewAttempt.allowed).toBe(false);
      expect(pendingReviewAttempt.error).toContain('Compliance Gate Violation');

      const nonCompliantAttempt = validateStatusTransition(
        'UNAVAILABLE',
        'AVAILABLE',
        'Admin inspection completed',
        'NON_COMPLIANT'
      );
      expect(nonCompliantAttempt.allowed).toBe(false);
      expect(nonCompliantAttempt.error).toContain('Compliance Gate Violation');

      const verifiedAttempt = validateStatusTransition(
        'UNAVAILABLE',
        'AVAILABLE',
        'Kerala MVD commercial permit verified and signed off',
        'VERIFIED_COMPLIANT'
      );
      expect(verifiedAttempt.allowed).toBe(true);
    });

    it('allows valid permitted operational transitions', () => {
      expect(
        validateStatusTransition('AVAILABLE', 'RENTED', 'Rider completed handover').allowed
      ).toBe(true);

      expect(
        validateStatusTransition('AVAILABLE', 'MAINTENANCE', 'Scheduled oil change').allowed
      ).toBe(true);

      expect(
        validateStatusTransition('MAINTENANCE', 'AVAILABLE', 'Post-inspection admin signoff')
          .allowed
      ).toBe(true);

      expect(
        validateStatusTransition('RENTED', 'MAINTENANCE', 'Mid-rental mechanical breakdown')
          .allowed
      ).toBe(true);

      expect(
        validateStatusTransition('ACCIDENT', 'MAINTENANCE', 'Moved to workshop for insurance surveyor inspection')
          .allowed
      ).toBe(true);
    });
  });

  describe('Vehicle Operations & Query Methods', () => {
    it('retrieves fleet vehicles and includes initial Honda Dio', async () => {
      const vehicles = await getFleetVehicles();
      expect(vehicles.length).toBeGreaterThanOrEqual(1);

      const dio = vehicles.find((v) => v.registrationNumber === 'KL-00-AA-0000');
      expect(dio).toBeDefined();
      expect(dio?.manufacturer).toBe('Honda');
      expect(dio?.model).toBe('Dio');
      expect(dio?.currentOdometer).toBe(14250);
      expect(dio?.dailyRate14d).toBe(450);
    });

    it('filters fleet vehicles by status', async () => {
      const availableList = await getFleetVehicles({ status: 'AVAILABLE' });
      for (const v of availableList) {
        expect(v.operationalStatus).toBe('AVAILABLE');
      }
    });

    it('filters fleet vehicles by search query', async () => {
      const searchList = await getFleetVehicles({ search: 'dio' });
      expect(searchList.length).toBeGreaterThanOrEqual(1);
      expect(searchList[0].model.toLowerCase()).toContain('dio');
    });

    it('retrieves full 360 aggregate data for a vehicle', async () => {
      const vehicles = await getFleetVehicles();
      const id = vehicles[0].id;
      const data = await getVehicleById(id);

      expect(data).not.toBeNull();
      if (data) {
        expect(data.vehicle.id).toBe(id);
        expect(data.pricing.length).toBeGreaterThanOrEqual(2);
        expect(data.documents.length).toBeGreaterThanOrEqual(4);
        expect(data.statusHistory.length).toBeGreaterThanOrEqual(1);
        expect(data.expenseSummary.totalLifetimeCost).toBeGreaterThanOrEqual(70000);
      }
    });

    it('rejects vehicle creation with duplicate registration number', async () => {
      const result = await createVehicle({
        registrationNumber: 'KL-00-AA-0000', // Already exists!
        manufacturer: 'Honda',
        model: 'Dio',
        manufacturingYear: 2023,
        fuelType: 'PETROL',
        vehicleCategory: 'SCOOTER',
        chassisNumber: 'UNIQUE_CHASSIS_123',
        engineNumber: 'UNIQUE_ENGINE_123',
        purchaseDate: '2026-01-20',
        purchaseCost: 70000,
        currentOdometer: 5000,
        complianceStatus: 'PENDING_REVIEW',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('updates vehicle specifications and current odometer', async () => {
      const vehicles = await getFleetVehicles();
      const id = vehicles[0].id;

      const updateResult = await updateVehicle(id, {
        currentOdometer: 14500,
        variant: '110cc Smart Edition',
      });

      expect(updateResult.success).toBe(true);

      const refreshed = await getVehicleById(id);
      expect(refreshed?.vehicle.currentOdometer).toBe(14500);
      expect(refreshed?.vehicle.variant).toBe('110cc Smart Edition');
    });

    it('executes vehicle operational status change and logs audit history', async () => {
      const vehicles = await getFleetVehicles();
      const id = vehicles[0].id;

      const result = await updateVehicleStatus(
        id,
        'MAINTENANCE',
        'Scheduled 15,000 km periodic engine oil service at workshop'
      );

      expect(result.success).toBe(true);

      const refreshed = await getVehicleById(id);
      expect(refreshed?.vehicle.operationalStatus).toBe('MAINTENANCE');

      // Verify audit history record logged
      const latestHistory = refreshed?.statusHistory[0];
      expect(latestHistory?.toStatus).toBe('MAINTENANCE');
      expect(latestHistory?.reason).toContain('Scheduled 15,000 km');
    });

    it('upserts vehicle-specific pricing without affecting global defaults', async () => {
      const vehicles = await getFleetVehicles();
      const id = vehicles[0].id;
      const packageId = 'b0000000-0000-4000-8000-000000000014';

      const result = await upsertVehiclePricing(
        id,
        packageId,
        {
          packageId,
          dailyRate: 460, // Custom rate for this scooter
          bookingTokenAmount: 1000,
          securityDepositAmount: 4000,
          kmLimitPerDay: 120,
          extraKmCharge: 4.5,
        },
        14
      );

      expect(result.success).toBe(true);

      const refreshed = await getVehicleById(id);
      const pkg14 = refreshed?.pricing.find((p) => p.packageId === packageId);
      expect(pkg14?.dailyRate).toBe(460);
      expect(pkg14?.packageTotalRate).toBe(6440); // 14 * 460
      expect(pkg14?.kmLimitPerDay).toBe(120);
    });

    it('enforces that onboarded vehicle with PENDING_REVIEW compliance starts as UNAVAILABLE', async () => {
      const res = await createVehicle({
        registrationNumber: 'KL-07-CD-5678',
        manufacturer: 'Honda',
        model: 'Activa 6G',
        variant: 'Deluxe',
        manufacturingYear: 2023,
        fuelType: 'PETROL',
        vehicleCategory: 'SCOOTER',
        chassisNumber: 'DEMO-CHASSIS-000002',
        engineNumber: 'DEMO-ENGINE-000002',
        purchaseDate: '2026-02-01',
        purchaseCost: 72000,
        currentOdometer: 8500,
        complianceStatus: 'PENDING_REVIEW', // Incomplete/pending review
        complianceNotes: 'Awaiting commercial fitness and Rent-a-Motorcycle permit verification',
      });

      expect(res.success).toBe(true);
      expect(res.vehicleId).toBeDefined();

      if (res.vehicleId) {
        const created = await getVehicleById(res.vehicleId);
        expect(created?.vehicle.complianceStatus).toBe('PENDING_REVIEW');
        expect(created?.vehicle.operationalStatus).toBe('UNAVAILABLE'); // Must NOT be AVAILABLE!
      }
    });

    it('computes vehicle profitability strictly segregating CapEx, OpEx, and deposit liabilities', () => {
      const metrics = calculateVehicleProfitability({
        purchaseCost: 70000, // Capital expenditure (Asset)
        operatingExpenses: [850, 400], // Periodic service + water wash (OpEx)
        rentalRevenue: 6300, // 14 days @ ₹450 (includes ₹1,000 token)
        securityDepositsHeld: 4000, // Deposit liability (NEVER revenue)
      });

      expect(metrics.capitalizedPurchaseCost).toBe(70000);
      expect(metrics.totalOperatingExpenses).toBe(1250);
      expect(metrics.totalRentalRevenue).toBe(6300);
      expect(metrics.securityDepositLiability).toBe(4000);

      // Operating Profit = Rental Revenue - Operating Expenses = 6300 - 1250 = 5050
      expect(metrics.operatingProfit).toBe(5050);

      // Net Asset Return = Operating Profit - Capital Cost = 5050 - 70000 = -64950
      expect(metrics.netAssetReturn).toBe(-64950);
    });
  });
});


