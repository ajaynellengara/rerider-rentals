import { describe, it, expect } from 'vitest';
import { validateMaintenanceRelease, type MaintenanceState } from '@/services/maintenance';

describe('Maintenance Safety Gate & Release Inspection (Phase 7 Audit)', () => {
  const ongoingRepair: MaintenanceState = {
    id: 'maint-001',
    vehicleId: 'veh-01',
    issueCategory: 'BRAKE',
    repairStatus: 'IN_PROGRESS',
  };

  const completedRepair: MaintenanceState = {
    id: 'maint-002',
    vehicleId: 'veh-01',
    issueCategory: 'BRAKE',
    repairStatus: 'AWAITING_RELEASE_INSPECTION',
  };

  it('prohibits release while repairs are still in progress', () => {
    const result = validateMaintenanceRelease(ongoingRepair, true, true);
    expect(result.canRelease).toBe(false);
    expect(result.error).toContain('Repairs are still in progress');
  });

  it('blocks release if release inspection with photos is missing', () => {
    const result = validateMaintenanceRelease(completedRepair, false, true);
    expect(result.canRelease).toBe(false);
    expect(result.error).toContain('Safety Gate Violation: A formal release inspection');
  });

  it('blocks release if admin sign-off is missing', () => {
    const result = validateMaintenanceRelease(completedRepair, true, false);
    expect(result.canRelease).toBe(false);
    expect(result.error).toContain('Safety Gate Violation: Admin sign-off');
  });

  it('allows release to AVAILABLE only when both inspection and admin approval exist', () => {
    const result = validateMaintenanceRelease(completedRepair, true, true);
    expect(result.canRelease).toBe(true);
    expect(result.newVehicleStatus).toBe('AVAILABLE');
  });
});
