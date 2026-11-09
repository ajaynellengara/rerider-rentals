import { describe, it, expect } from 'vitest';
import {
  validateVehicleAssignmentEligibility,
  validateRiderAssignmentEligibility,
  executeVehicleReplacement,
  type VehicleAssignmentRecord,
  type VehicleAsset,
} from '@/services/assignments';

describe('Vehicle Assignments & Swaps (Phase 6 Audit)', () => {
  const availableScooter: VehicleAsset = {
    id: 'veh-001',
    registrationNumber: 'KL-00-AA-0000',
    operationalStatus: 'AVAILABLE',
    currentOdometer: 14200,
  };

  const maintenanceScooter: VehicleAsset = {
    id: 'veh-002',
    registrationNumber: 'KL-07-BW-5678',
    operationalStatus: 'MAINTENANCE',
    currentOdometer: 22000,
  };

  const accidentScooter: VehicleAsset = {
    id: 'veh-003',
    registrationNumber: 'KL-07-BW-9999',
    operationalStatus: 'ACCIDENT',
    currentOdometer: 18000,
  };

  it('prohibits assignment of MAINTENANCE or ACCIDENT held vehicles', () => {
    const maintCheck = validateVehicleAssignmentEligibility(maintenanceScooter, []);
    expect(maintCheck.eligible).toBe(false);
    expect(maintCheck.error).toContain('MAINTENANCE');

    const accidentCheck = validateVehicleAssignmentEligibility(accidentScooter, []);
    expect(accidentCheck.eligible).toBe(false);
    expect(accidentCheck.error).toContain('ACCIDENT');
  });

  it('enforces vehicle assignment exclusivity: no dual active assignments for a vehicle', () => {
    const existingActiveAssignment: VehicleAssignmentRecord = {
      id: 'asgn-001',
      bookingId: 'bk-100',
      riderId: 'rider-01',
      vehicleId: availableScooter.id,
      startingOdometer: 14200,
      status: 'ACTIVE',
      assignmentReason: 'INITIAL_ASSIGNMENT',
    };

    const check = validateVehicleAssignmentEligibility(availableScooter, [existingActiveAssignment]);
    expect(check.eligible).toBe(false);
    expect(check.error).toContain('Assignment exclusivity violated');
  });

  it('enforces rider assignment exclusivity: no simultaneous active rentals for a rider', () => {
    const activeAssignments: VehicleAssignmentRecord[] = [
      {
        id: 'asgn-001',
        bookingId: 'bk-100',
        riderId: 'rider-01',
        vehicleId: 'veh-99',
        startingOdometer: 1000,
        status: 'ACTIVE',
        assignmentReason: 'INITIAL_ASSIGNMENT',
      },
    ];

    const check = validateRiderAssignmentEligibility('rider-01', activeAssignments);
    expect(check.eligible).toBe(false);
    expect(check.error).toContain('Rider exclusivity violated');
  });

  it('executes vehicle replacement workflow correctly preserving booking ID & pricing continuity', () => {
    // Current assignment: Honda Dio @ 14,000 km
    const currentAssignment: VehicleAssignmentRecord = {
      id: 'asgn-old',
      bookingId: 'bk-2026-001',
      riderId: 'rider-rahul',
      vehicleId: 'veh-dio',
      startingOdometer: 14000,
      status: 'ACTIVE',
      assignmentReason: 'INITIAL_ASSIGNMENT',
    };

    // Scooter breaks down at 14,450 km
    const replacementScooter: VehicleAsset = {
      id: 'veh-access',
      registrationNumber: 'KL-07-CD-5555',
      operationalStatus: 'AVAILABLE',
      currentOdometer: 8500,
    };

    const swapResult = executeVehicleReplacement(
      currentAssignment,
      14450,
      replacementScooter,
      'asgn-new'
    );

    // Old assignment closed with breakdown odometer
    expect(swapResult.closedAssignment.status).toBe('CLOSED');
    expect(swapResult.closedAssignment.endingOdometer).toBe(14450);

    // New assignment opened with replacement scooter
    expect(swapResult.newAssignment.id).toBe('asgn-new');
    expect(swapResult.newAssignment.vehicleId).toBe('veh-access');
    expect(swapResult.newAssignment.startingOdometer).toBe(8500);
    expect(swapResult.newAssignment.status).toBe('ACTIVE');

    // CRITICAL INVARIANT: Booking ID & Rider ID preserved unchanged!
    expect(swapResult.newAssignment.bookingId).toBe('bk-2026-001');
    expect(swapResult.newAssignment.riderId).toBe('rider-rahul');
    expect(swapResult.historyPreserved).toBe(true);
  });
});

