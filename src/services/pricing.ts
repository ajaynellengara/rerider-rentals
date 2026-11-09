export interface PackagePricingConfig {
  dailyRate: number;
  durationDays: number;
  bookingTokenAmount: number;
  securityDepositAmount: number;
  kmLimitPerDay: number;
  extraKmCharge: number;
}

export interface PricingCalculationResult {
  dailyRate: number;
  durationDays: number;
  totalRentalPrice: number;
  bookingTokenAmount: number;
  remainingRentalBalance: number;
  securityDepositAmount: number;
  totalInitialCollection: number; // Token + Remaining Rent + Deposit
  totalHandoverDue: number; // Remaining Rent + Deposit
  totalKmLimit: number;
  extraKmCharge: number;
}

/**
 * Pure domain calculation for rental pricing packages
 * Enforces exact financial arithmetic
 */
export function calculatePackagePricing(config: PackagePricingConfig): PricingCalculationResult {
  if (config.dailyRate <= 0) {
    throw new Error('Daily rate must be greater than zero');
  }
  if (config.durationDays <= 0) {
    throw new Error('Duration days must be greater than zero');
  }
  if (config.bookingTokenAmount < 0) {
    throw new Error('Booking token cannot be negative');
  }
  if (config.securityDepositAmount < 0) {
    throw new Error('Security deposit cannot be negative');
  }

  const totalRentalPrice = Math.round(config.dailyRate * config.durationDays * 100) / 100;

  if (config.bookingTokenAmount > totalRentalPrice) {
    throw new Error('Booking token cannot exceed total rental price');
  }

  const remainingRentalBalance = Math.round((totalRentalPrice - config.bookingTokenAmount) * 100) / 100;
  const totalHandoverDue = Math.round((remainingRentalBalance + config.securityDepositAmount) * 100) / 100;
  const totalInitialCollection = Math.round((config.bookingTokenAmount + totalHandoverDue) * 100) / 100;
  const totalKmLimit = config.kmLimitPerDay * config.durationDays;

  return {
    dailyRate: config.dailyRate,
    durationDays: config.durationDays,
    totalRentalPrice,
    bookingTokenAmount: config.bookingTokenAmount,
    remainingRentalBalance,
    securityDepositAmount: config.securityDepositAmount,
    totalInitialCollection,
    totalHandoverDue,
    totalKmLimit,
    extraKmCharge: config.extraKmCharge,
  };
}

/**
 * Calculates excess kilometre charges upon vehicle return
 */
export function calculateExcessKmCharge(
  startOdometer: number,
  endOdometer: number,
  totalKmLimit: number,
  extraKmRate: number
): {
  distanceTravelled: number;
  excessKm: number;
  charge: number;
} {
  if (endOdometer < startOdometer) {
    throw new Error('End odometer reading cannot be less than starting odometer');
  }
  const distanceTravelled = endOdometer - startOdometer;
  const excessKm = Math.max(0, distanceTravelled - totalKmLimit);
  const charge = Math.round(excessKm * extraKmRate * 100) / 100;

  return {
    distanceTravelled,
    excessKm,
    charge,
  };
}
