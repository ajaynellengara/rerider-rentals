export interface RiderEligibilityCheck {
  dateOfBirth: string | Date; // YYYY-MM-DD
  isDrivingLicenceVerified: boolean;
  isAadhaarVerified: boolean;
}

/**
 * Calculates exact age in completed years based on DOB.
 */
export function calculateAge(dob: string | Date, referenceDate: Date = new Date()): number {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validates rider booking eligibility.
 * Enforces rule: Rider must be aged 20+ and have verified KYC documents.
 */
export function validateRiderEligibility(rider: RiderEligibilityCheck): {
  eligible: boolean;
  age: number;
  reason?: string;
} {
  const age = calculateAge(rider.dateOfBirth);
  if (age < 20) {
    return {
      eligible: false,
      age,
      reason: `Age requirement not met: Rider is ${age} years old (minimum 20 years required by policy).`,
    };
  }

  if (!rider.isDrivingLicenceVerified) {
    return {
      eligible: false,
      age,
      reason: 'Mandatory Driving Licence has not been verified by an administrator.',
    };
  }

  if (!rider.isAadhaarVerified) {
    return {
      eligible: false,
      age,
      reason: 'Mandatory Aadhaar identity document has not been verified.',
    };
  }

  return {
    eligible: true,
    age,
  };
}
