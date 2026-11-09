export interface VehicleAssignmentRecord {
  id: string;
  bookingId: string;
  riderId: string;
  vehicleId: string;
  startingOdometer: number;
  endingOdometer?: number;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  assignmentReason: 'INITIAL_ASSIGNMENT' | 'MAINTENANCE_REPLACEMENT' | 'ACCIDENT_REPLACEMENT';
}

export interface VehicleAsset {
  id: string;
  registrationNumber: string;
  operationalStatus: 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE' | 'ACCIDENT' | 'UNAVAILABLE' | 'RETIRED';
  currentOdometer: number;
}

/**
 * Validates whether a vehicle can be assigned to a booking.
 * Enforces rule: Maintenance or Accident-held vehicles can NEVER be assigned.
 */
export function validateVehicleAssignmentEligibility(
  vehicle: VehicleAsset,
  activeAssignments: VehicleAssignmentRecord[]
): { eligible: boolean; error?: string } {
  if (vehicle.operationalStatus === 'MAINTENANCE') {
    return { eligible: false, error: 'Vehicle is currently under MAINTENANCE and cannot be assigned' };
  }
  if (vehicle.operationalStatus === 'ACCIDENT') {
    return { eligible: false, error: 'Vehicle is held under ACCIDENT investigation and cannot be assigned' };
  }
  if (vehicle.operationalStatus === 'RETIRED' || vehicle.operationalStatus === 'UNAVAILABLE') {
    return { eligible: false, error: `Vehicle is ${vehicle.operationalStatus} and cannot be assigned` };
  }

  const existingActive = activeAssignments.find(
    (a) => a.vehicleId === vehicle.id && a.status === 'ACTIVE'
  );
  if (existingActive) {
    return { eligible: false, error: 'Vehicle already has an ACTIVE assignment. Assignment exclusivity violated.' };
  }

  return { eligible: true };
}

/**
 * Validates that a rider has at most one ACTIVE assignment at any time.
 */
export function validateRiderAssignmentEligibility(
  riderId: string,
  activeAssignments: VehicleAssignmentRecord[]
): { eligible: boolean; error?: string } {
  const existingActive = activeAssignments.find(
    (a) => a.riderId === riderId && a.status === 'ACTIVE'
  );
  if (existingActive) {
    return { eligible: false, error: 'Rider already has an ACTIVE rental assignment. Rider exclusivity violated.' };
  }
  return { eligible: true };
}

/**
 * Executes a vehicle replacement workflow.
 * Core Invariant:
 * 1. Closes previous assignment with breakdown odometer.
 * 2. Creates new assignment for replacement vehicle under the SAME booking.
 * 3. Booking ID and original pricing snapshot remain intact.
 * 4. Preserves full history.
 */
export function executeVehicleReplacement(
  currentAssignment: VehicleAssignmentRecord,
  breakdownOdometer: number,
  replacementVehicle: VehicleAsset,
  newAssignmentId: string,
  reason: 'MAINTENANCE_REPLACEMENT' | 'ACCIDENT_REPLACEMENT' = 'MAINTENANCE_REPLACEMENT'
): {
  closedAssignment: VehicleAssignmentRecord;
  newAssignment: VehicleAssignmentRecord;
  historyPreserved: boolean;
} {
  if (currentAssignment.status !== 'ACTIVE') {
    throw new Error('Only ACTIVE assignments can be replaced');
  }
  if (breakdownOdometer < currentAssignment.startingOdometer) {
    throw new Error('Breakdown odometer cannot be less than starting odometer');
  }
  if (replacementVehicle.operationalStatus !== 'AVAILABLE') {
    throw new Error(`Replacement vehicle must be AVAILABLE, but is ${replacementVehicle.operationalStatus}`);
  }

  // 1. Close current assignment
  const closedAssignment: VehicleAssignmentRecord = {
    ...currentAssignment,
    status: 'CLOSED',
    endingOdometer: breakdownOdometer,
  };

  // 2. Open new assignment retaining bookingId and riderId
  const newAssignment: VehicleAssignmentRecord = {
    id: newAssignmentId,
    bookingId: currentAssignment.bookingId, // Preserved!
    riderId: currentAssignment.riderId,     // Preserved!
    vehicleId: replacementVehicle.id,
    startingOdometer: replacementVehicle.currentOdometer,
    status: 'ACTIVE',
    assignmentReason: reason,
  };

  return {
    closedAssignment,
    newAssignment,
    historyPreserved: true,
  };
}
