import { describe, it, expect, beforeEach } from 'vitest';
import {
  replaceVehicleAssignment,
  createVehicle,
  getVehicleById,
  updateVehicleStatus,
  resetInMemoryAssignmentsForTesting,
} from '@/services/vehicles';

describe('Transactional Vehicle Replacement Workflow', () => {
  beforeEach(() => {
    resetInMemoryAssignmentsForTesting();
  });
  it('executes vehicle replacement preserving booking identity, rider identity, and pricing snapshots', async () => {
    // 1. Onboard a compliant replacement scooter
    const repOnboard = await createVehicle({
      registrationNumber: 'KL-07-EF-4321',
      manufacturer: 'Honda',
      model: 'Activa',
      variant: '125cc Disc',
      manufacturingYear: 2023,
      fuelType: 'PETROL',
      vehicleCategory: 'SCOOTER',
      chassisNumber: 'DEMO-CHASSIS-000003',
      engineNumber: 'DEMO-ENGINE-000003',
      purchaseDate: '2026-02-01',
      purchaseCost: 75000,
      currentOdometer: 9800,
      complianceStatus: 'VERIFIED_COMPLIANT',
    });

    expect(repOnboard.success).toBe(true);
    const replacementVehicleId = repOnboard.vehicleId!;

    // 2. Perform replacement mid-rental
    const bookingId = 'bk-00000000-0000-4000-8000-000000000001';
    const currentAssignmentId = 'asg-00000000-0000-4000-8000-000000000001';
    const breakdownOdometer = 14420; // Started at 14250, ran 170 km before service needed

    const result = await replaceVehicleAssignment({
      bookingId,
      currentAssignmentId,
      breakdownOdometer,
      replacementVehicleId,
      reason: 'MAINTENANCE_REPLACEMENT',
      adminNotes: 'Replaced due to drive belt wear; allocated Activa KL-07-EF-4321',
    });

    expect(result.success).toBe(true);
    expect(result.bookingId).toBe(bookingId); // Invariant 1: Booking preserved!
    expect(result.riderId).toBe('rdr-00000000-0000-4000-8000-000000000001'); // Invariant 2: Rider preserved!
    expect(result.preservedPricingSnapshot).toBe(true); // Invariant 3: Price snapshot immutability!

    // Verify closed assignment
    expect(result.closedAssignment?.status).toBe('CLOSED');
    expect(result.closedAssignment?.endingOdometer).toBe(breakdownOdometer);

    // Verify new replacement assignment
    expect(result.newAssignment?.status).toBe('ACTIVE');
    expect(result.newAssignment?.bookingId).toBe(bookingId);
    expect(result.newAssignment?.vehicleId).toBe(replacementVehicleId);
    expect(result.newAssignment?.startingOdometer).toBe(9800);
    expect(result.newAssignment?.previousAssignmentId).toBe(currentAssignmentId);

    // Verify old vehicle transitioned to MAINTENANCE
    const oldVehicle = await getVehicleById('a0000000-0000-4000-8000-000000000001');
    expect(oldVehicle?.vehicle.operationalStatus).toBe('MAINTENANCE');
    expect(oldVehicle?.vehicle.currentOdometer).toBe(breakdownOdometer);

    // Verify replacement vehicle transitioned to RENTED
    const repVehicle = await getVehicleById(replacementVehicleId);
    expect(repVehicle?.vehicle.operationalStatus).toBe('RENTED');
  });

  it('rejects replacement when breakdown odometer is lower than starting odometer', async () => {
    const repOnboard = await createVehicle({
      registrationNumber: 'KL-07-EF-9999',
      manufacturer: 'Honda',
      model: 'Dio',
      manufacturingYear: 2023,
      fuelType: 'PETROL',
      vehicleCategory: 'SCOOTER',
      chassisNumber: 'DEMO-CHASSIS-000004',
      engineNumber: 'DEMO-ENGINE-000004',
      purchaseDate: '2026-02-01',
      purchaseCost: 70000,
      currentOdometer: 5000,
      complianceStatus: 'VERIFIED_COMPLIANT',
    });

    const result = await replaceVehicleAssignment({
      bookingId: 'bk-00000000-0000-4000-8000-000000000001',
      currentAssignmentId: 'asg-00000000-0000-4000-8000-000000000001',
      breakdownOdometer: 1000, // Invalid: less than starting odometer 14250!
      replacementVehicleId: repOnboard.vehicleId!,
      reason: 'MAINTENANCE_REPLACEMENT',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot be less than starting odometer');
  });

  it('rejects replacement if replacement vehicle is under MAINTENANCE or ACCIDENT', async () => {
    const brokenScooter = await createVehicle({
      registrationNumber: 'KL-07-EF-8888',
      manufacturer: 'Honda',
      model: 'Dio',
      manufacturingYear: 2023,
      fuelType: 'PETROL',
      vehicleCategory: 'SCOOTER',
      chassisNumber: 'DEMO-CHASSIS-000005',
      engineNumber: 'DEMO-ENGINE-000005',
      purchaseDate: '2026-02-01',
      purchaseCost: 70000,
      currentOdometer: 12000,
      complianceStatus: 'VERIFIED_COMPLIANT',
    });

    // Mark as MAINTENANCE
    await updateVehicleStatus(
      brokenScooter.vehicleId!,
      'MAINTENANCE',
      'Engine knocking under repair'
    );

    const result = await replaceVehicleAssignment({
      bookingId: 'bk-00000000-0000-4000-8000-000000000001',
      currentAssignmentId: 'asg-00000000-0000-4000-8000-000000000001',
      breakdownOdometer: 14500,
      replacementVehicleId: brokenScooter.vehicleId!,
      reason: 'MAINTENANCE_REPLACEMENT',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must be AVAILABLE, but is currently MAINTENANCE');
  });

  it('enforces assignment exclusivity: blocks replacement vehicle with existing active rental', async () => {
    // Attempting to replace with a vehicle that is already RENTED
    const result = await replaceVehicleAssignment({
      bookingId: 'bk-00000000-0000-4000-8000-000000000001',
      currentAssignmentId: 'asg-00000000-0000-4000-8000-000000000001',
      breakdownOdometer: 14500,
      replacementVehicleId: 'a0000000-0000-4000-8000-000000000001', // Already in use / not available!
      reason: 'MAINTENANCE_REPLACEMENT',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

