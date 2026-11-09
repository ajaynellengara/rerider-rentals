import { describe, it, expect } from 'vitest';
import { calculatePackagePricing, calculateExcessKmCharge } from '@/services/pricing';
import {
  allocatePayment,
  calculateDepositSettlement,
  calculateCancellationRefund,
  calculateFleetProfitability,
  type PaymentRecord,
} from '@/services/financials';
import {
  validateVehicleAssignmentEligibility,
  executeVehicleReplacement,
  type VehicleAssignmentRecord,
  type VehicleAsset,
} from '@/services/assignments';
import { formatKolkataDateTime } from '@/lib/utils';

describe('Domain Services Edge Cases & Boundary Conditions', () => {
  it('handles negative inputs and invalid odometer deltas in pricing', () => {
    expect(() =>
      calculatePackagePricing({
        dailyRate: 450,
        durationDays: 14,
        bookingTokenAmount: -500, // Negative!
        securityDepositAmount: 4000,
        kmLimitPerDay: 100,
        extraKmCharge: 4,
      })
    ).toThrow('Booking token cannot be negative');

    expect(() =>
      calculatePackagePricing({
        dailyRate: 450,
        durationDays: 14,
        bookingTokenAmount: 1000,
        securityDepositAmount: -1000, // Negative!
        kmLimitPerDay: 100,
        extraKmCharge: 4,
      })
    ).toThrow('Security deposit cannot be negative');

    // End odometer less than start odometer
    expect(() => calculateExcessKmCharge(15000, 14000, 1400, 4)).toThrow(
      'End odometer reading cannot be less than starting odometer'
    );
  });

  it('handles financial edge cases and negative deduction checks', () => {
    expect(() => calculateDepositSettlement(-100)).toThrow(
      'Deposit and deduction values cannot be negative'
    );

    expect(() => calculateDepositSettlement(4000, -500)).toThrow(
      'Deposit and deduction values cannot be negative'
    );

    // Zero or negative token cancellation
    const zeroTokenRefund = calculateCancellationRefund(0, 'RIDER');
    expect(zeroTokenRefund.refundReason).toBe('NO_TOKEN_PAID');
    expect(zeroTokenRefund.refundAmount).toBe(0);

    // Negative payment allocation
    expect(() =>
      allocatePayment({
        id: 'pay-err',
        amount: -500,
        type: 'BOOKING_TOKEN',
        status: 'SUCCESS',
      })
    ).toThrow('Payment amount must be greater than zero');

    // Unsupported payment type allocation
    expect(() =>
      allocatePayment({
        id: 'pay-err',
        amount: 500,
        type: 'REFUND' as unknown as PaymentRecord['type'],
        status: 'SUCCESS',
      })
    ).toThrow('Unsupported allocation type');
  });

  it('handles vehicle asset statuses and invalid replacement attempts', () => {
    const retiredScooter: VehicleAsset = {
      id: 'v-ret',
      registrationNumber: 'KL-07-XX-0000',
      operationalStatus: 'RETIRED',
      currentOdometer: 65000,
    };
    const checkRetired = validateVehicleAssignmentEligibility(retiredScooter, []);
    expect(checkRetired.eligible).toBe(false);
    expect(checkRetired.error).toContain('RETIRED');

    const unavailableScooter: VehicleAsset = {
      id: 'v-un',
      registrationNumber: 'KL-07-XX-0001',
      operationalStatus: 'UNAVAILABLE',
      currentOdometer: 10000,
    };
    const checkUnavailable = validateVehicleAssignmentEligibility(unavailableScooter, []);
    expect(checkUnavailable.eligible).toBe(false);
    expect(checkUnavailable.error).toContain('UNAVAILABLE');

    // Replace a closed assignment
    const closedAssignment: VehicleAssignmentRecord = {
      id: 'asgn-closed',
      bookingId: 'bk-1',
      riderId: 'r-1',
      vehicleId: 'v-1',
      startingOdometer: 1000,
      status: 'CLOSED',
      assignmentReason: 'INITIAL_ASSIGNMENT',
    };
    expect(() =>
      executeVehicleReplacement(closedAssignment, 1200, retiredScooter, 'asgn-new')
    ).toThrow('Only ACTIVE assignments can be replaced');

    // Active assignment with breakdown odometer less than starting
    const activeAssignment: VehicleAssignmentRecord = {
      id: 'asgn-act',
      bookingId: 'bk-1',
      riderId: 'r-1',
      vehicleId: 'v-1',
      startingOdometer: 5000,
      status: 'ACTIVE',
      assignmentReason: 'INITIAL_ASSIGNMENT',
    };
    expect(() =>
      executeVehicleReplacement(activeAssignment, 4000, retiredScooter, 'asgn-new')
    ).toThrow('Breakdown odometer cannot be less than starting odometer');

    // Replacement vehicle not AVAILABLE
    expect(() =>
      executeVehicleReplacement(activeAssignment, 5200, retiredScooter, 'asgn-new')
    ).toThrow('Replacement vehicle must be AVAILABLE');
  });

  it('formats full Kolkata datetime strings', () => {
    const date = new Date('2026-11-09T17:00:00Z');
    const formatted = formatKolkataDateTime(date);
    expect(formatted).toBeDefined();
    expect(formatted).not.toBe('-');
    expect(formatKolkataDateTime(null)).toBe('-');
  });
});
