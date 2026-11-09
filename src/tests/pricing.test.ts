import { describe, it, expect } from 'vitest';
import { calculatePackagePricing, calculateExcessKmCharge } from '@/services/pricing';

describe('Financial & Pricing Calculations (Phase 3 Audit)', () => {
  it('correctly calculates 14-day package for Honda Dio @ ₹450/day', () => {
    const result = calculatePackagePricing({
      dailyRate: 450,
      durationDays: 14,
      bookingTokenAmount: 1000,
      securityDepositAmount: 4000,
      kmLimitPerDay: 100,
      extraKmCharge: 4,
    });

    expect(result.totalRentalPrice).toBe(6300);
    expect(result.bookingTokenAmount).toBe(1000);
    expect(result.remainingRentalBalance).toBe(5300); // 6300 - 1000
    expect(result.securityDepositAmount).toBe(4000);
    expect(result.totalHandoverDue).toBe(9300); // 5300 + 4000
    expect(result.totalInitialCollection).toBe(10300); // 1000 + 9300
    expect(result.totalKmLimit).toBe(1400); // 14 * 100 km
  });

  it('correctly calculates 26-day package for Honda Dio @ ₹400/day', () => {
    const result = calculatePackagePricing({
      dailyRate: 400,
      durationDays: 26,
      bookingTokenAmount: 1000,
      securityDepositAmount: 4000,
      kmLimitPerDay: 100,
      extraKmCharge: 4,
    });

    expect(result.totalRentalPrice).toBe(10400);
    expect(result.bookingTokenAmount).toBe(1000);
    expect(result.remainingRentalBalance).toBe(9400); // 10400 - 1000
    expect(result.totalHandoverDue).toBe(13400); // 9400 + 4000
    expect(result.totalInitialCollection).toBe(14400); // 1000 + 13400
    expect(result.totalKmLimit).toBe(2600); // 26 * 100 km
  });

  it('rejects invalid pricing configuration inputs', () => {
    expect(() =>
      calculatePackagePricing({
        dailyRate: 0,
        durationDays: 14,
        bookingTokenAmount: 1000,
        securityDepositAmount: 4000,
        kmLimitPerDay: 100,
        extraKmCharge: 4,
      })
    ).toThrow('Daily rate must be greater than zero');

    expect(() =>
      calculatePackagePricing({
        dailyRate: 450,
        durationDays: 0,
        bookingTokenAmount: 1000,
        securityDepositAmount: 4000,
        kmLimitPerDay: 100,
        extraKmCharge: 4,
      })
    ).toThrow('Duration days must be greater than zero');

    expect(() =>
      calculatePackagePricing({
        dailyRate: 450,
        durationDays: 14,
        bookingTokenAmount: 7000, // Token exceeds 6300 rent!
        securityDepositAmount: 4000,
        kmLimitPerDay: 100,
        extraKmCharge: 4,
      })
    ).toThrow('Booking token cannot exceed total rental price');
  });

  it('correctly calculates excess kilometre charges on return', () => {
    // Case 1: Within limit (1,200 km travelled vs 1,400 km limit)
    const withinLimit = calculateExcessKmCharge(14000, 15200, 1400, 4);
    expect(withinLimit.distanceTravelled).toBe(1200);
    expect(withinLimit.excessKm).toBe(0);
    expect(withinLimit.charge).toBe(0);

    // Case 2: Exceeded limit (1,650 km travelled vs 1,400 km limit -> 250 excess km @ ₹4/km = ₹1,000)
    const overLimit = calculateExcessKmCharge(14000, 15650, 1400, 4);
    expect(overLimit.distanceTravelled).toBe(1650);
    expect(overLimit.excessKm).toBe(250);
    expect(overLimit.charge).toBe(1000);
  });
});
