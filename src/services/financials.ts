export interface PaymentRecord {
  id: string;
  amount: number;
  type: 'BOOKING_TOKEN' | 'RENTAL_BALANCE' | 'SECURITY_DEPOSIT' | 'EXTENSION' | 'DAMAGE_CHARGE' | 'REFUND';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
}

export interface PaymentAllocation {
  paymentId: string;
  allocationType: 'RENTAL_REVENUE' | 'SECURITY_DEPOSIT_LIABILITY' | 'DAMAGE_RECOVERY';
  amount: number;
}

export interface DepositLedger {
  bookingId: string;
  depositReceived: number;
  forfeitedDamage: number;
  forfeitedPenalty: number;
  refundedAmount: number;
  currentLiabilityBalance: number;
}

/**
 * Allocates incoming payments into proper accounting categories.
 * Enforces rule: Booking token is RENTAL_REVENUE, Security deposit is SECURITY_DEPOSIT_LIABILITY.
 */
export function allocatePayment(payment: PaymentRecord): PaymentAllocation[] {
  if (payment.amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  switch (payment.type) {
    case 'BOOKING_TOKEN':
    case 'RENTAL_BALANCE':
    case 'EXTENSION':
      return [
        {
          paymentId: payment.id,
          allocationType: 'RENTAL_REVENUE',
          amount: payment.amount,
        },
      ];
    case 'SECURITY_DEPOSIT':
      return [
        {
          paymentId: payment.id,
          allocationType: 'SECURITY_DEPOSIT_LIABILITY',
          amount: payment.amount,
        },
      ];
    case 'DAMAGE_CHARGE':
      return [
        {
          paymentId: payment.id,
          allocationType: 'DAMAGE_RECOVERY',
          amount: payment.amount,
        },
      ];
    default:
      throw new Error(`Unsupported allocation type for payment: ${payment.type}`);
  }
}

/**
 * Calculates security deposit refund and deduction settlement on vehicle return.
 * Guarantees that settlement never exceeds the available deposit.
 */
export function calculateDepositSettlement(
  initialDeposit: number,
  damageDeduction: number = 0,
  excessKmDeduction: number = 0,
  lateFeeDeduction: number = 0
): {
  initialDeposit: number;
  totalDeductions: number;
  refundableBalance: number;
  additionalChargesDue: number;
} {
  if (initialDeposit < 0 || damageDeduction < 0 || excessKmDeduction < 0 || lateFeeDeduction < 0) {
    throw new Error('Deposit and deduction values cannot be negative');
  }

  const totalDeductions = Math.round((damageDeduction + excessKmDeduction + lateFeeDeduction) * 100) / 100;
  const refundableBalance = Math.max(0, Math.round((initialDeposit - totalDeductions) * 100) / 100);
  const additionalChargesDue = Math.max(0, Math.round((totalDeductions - initialDeposit) * 100) / 100);

  return {
    initialDeposit,
    totalDeductions,
    refundableBalance,
    additionalChargesDue,
  };
}

/**
 * Calculates booking cancellation settlement based on cancellation origin.
 * Policy:
 * - If rider cancels, token is retained according to agreed cancellation terms.
 * - If owner cancels, token is 100% refunded to the customer.
 */
export function calculateCancellationRefund(
  tokenPaid: number,
  cancelledBy: 'RIDER' | 'OWNER',
  isVehicleUnavailable: boolean = false
): {
  tokenPaid: number;
  refundAmount: number;
  retainedAmount: number;
  refundReason: string;
} {
  if (tokenPaid <= 0) {
    return {
      tokenPaid: 0,
      refundAmount: 0,
      retainedAmount: 0,
      refundReason: 'NO_TOKEN_PAID',
    };
  }

  if (cancelledBy === 'OWNER' || isVehicleUnavailable) {
    return {
      tokenPaid,
      refundAmount: tokenPaid,
      retainedAmount: 0,
      refundReason: 'OWNER_CANCELLATION_FULL_REFUND',
    };
  }

  // Rider voluntary cancellation retains token as per policy
  return {
    tokenPaid,
    refundAmount: 0,
    retainedAmount: tokenPaid,
    refundReason: 'RIDER_CANCELLATION_TOKEN_FORFEITED',
  };
}

/**
 * Calculates vehicle-wise profitability.
 * Strictly enforces: Security deposits are liabilities and NEVER recognized as rental revenue.
 */
export function calculateFleetProfitability(
  rentalRevenue: number,
  operatingExpenses: number,
  securityDepositsHeld: number,
  vehicleAcquisitionCost: number = 0
): {
  rentalRevenue: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  securityDepositsHeld: number; // Disclosed as liability
  operatingMarginPercent: number;
  roiPercent: number | null;
} {
  const netOperatingIncome = Math.round((rentalRevenue - operatingExpenses) * 100) / 100;
  const operatingMarginPercent =
    rentalRevenue > 0
      ? Math.round((netOperatingIncome / rentalRevenue) * 10000) / 100
      : 0;

  const roiPercent =
    vehicleAcquisitionCost > 0
      ? Math.round((netOperatingIncome / vehicleAcquisitionCost) * 10000) / 100
      : null;

  return {
    rentalRevenue,
    operatingExpenses,
    netOperatingIncome,
    securityDepositsHeld,
    operatingMarginPercent,
    roiPercent,
  };
}
