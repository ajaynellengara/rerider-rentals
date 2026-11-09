import { describe, it, expect } from 'vitest';
import { calculateAge, validateRiderEligibility } from '@/services/kyc';

describe('Rider KYC & Regulatory Age Gate (Phase 5 Audit)', () => {
  it('accurately calculates rider age from date of birth', () => {
    const referenceDate = new Date('2026-11-09');
    expect(calculateAge('2006-11-08', referenceDate)).toBe(20);
    expect(calculateAge('2006-11-10', referenceDate)).toBe(19);
    expect(calculateAge('2000-01-01', referenceDate)).toBe(26);
  });

  it('rejects underage riders below 20 years old', () => {
    const check = validateRiderEligibility({
      dateOfBirth: '2008-05-15', // 18 years old
      isDrivingLicenceVerified: true,
      isAadhaarVerified: true,
    });

    expect(check.eligible).toBe(false);
    expect(check.reason).toContain('minimum 20 years required');
  });

  it('rejects riders with unverified Driving Licence or Aadhaar', () => {
    const missingDL = validateRiderEligibility({
      dateOfBirth: '2002-05-15', // 24 years old
      isDrivingLicenceVerified: false,
      isAadhaarVerified: true,
    });
    expect(missingDL.eligible).toBe(false);
    expect(missingDL.reason).toContain('Driving Licence has not been verified');

    const missingAadhaar = validateRiderEligibility({
      dateOfBirth: '2002-05-15',
      isDrivingLicenceVerified: true,
      isAadhaarVerified: false,
    });
    expect(missingAadhaar.eligible).toBe(false);
    expect(missingAadhaar.reason).toContain('Aadhaar identity document has not been verified');
  });

  it('approves compliant riders aged 20+ with verified documents', () => {
    const eligibleRider = validateRiderEligibility({
      dateOfBirth: '2001-08-20',
      isDrivingLicenceVerified: true,
      isAadhaarVerified: true,
    });

    expect(eligibleRider.eligible).toBe(true);
    expect(eligibleRider.age).toBeGreaterThanOrEqual(20);
  });
});
