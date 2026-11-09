export interface MaintenanceState {
  id: string;
  vehicleId: string;
  issueCategory: string;
  repairStatus: 'REPORTED' | 'IN_PROGRESS' | 'AWAITING_RELEASE_INSPECTION' | 'COMPLETED' | 'CANCELLED';
  releaseInspectionId?: string;
  adminReleasedBy?: string;
}

/**
 * Validates the safety gate for releasing a vehicle from maintenance back to AVAILABLE.
 * Invariant: A vehicle returning from maintenance NEVER automatically becomes AVAILABLE.
 * Requires an explicit authorized inspection and admin release.
 */
export function validateMaintenanceRelease(
  record: MaintenanceState,
  hasReleaseInspection: boolean,
  hasAdminApproval: boolean
): { canRelease: boolean; newVehicleStatus?: 'AVAILABLE'; error?: string } {
  if (record.repairStatus === 'REPORTED' || record.repairStatus === 'IN_PROGRESS') {
    return {
      canRelease: false,
      error: 'Repairs are still in progress. Vehicle cannot be released.',
    };
  }

  if (!hasReleaseInspection) {
    return {
      canRelease: false,
      error: 'Safety Gate Violation: A formal release inspection with photos is required before release.',
    };
  }

  if (!hasAdminApproval) {
    return {
      canRelease: false,
      error: 'Safety Gate Violation: Admin sign-off is required to release vehicle to AVAILABLE.',
    };
  }

  return {
    canRelease: true,
    newVehicleStatus: 'AVAILABLE',
  };
}
