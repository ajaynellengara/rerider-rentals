import { describe, it, expect } from 'vitest';
import {
  allocatePayment,
  calculateDepositSettlement,
  calculateCancellationRefund,
  calculateFleetProfitability,
} from '@/services/financials';

describe('Financial Accounting & Segregated Deposits (Phase 3 Audit)', () => {
  it('correctly allocates ₹1,000 token to RENTAL_REVENUE (not deposit)', () => {
    const allocations = allocatePayment({
      id: 'pay-001',
      amount: 1000,
      type: 'BOOKING_TOKEN',
      status: 'SUCCESS',
    });

    expect(allocations).toHaveLength(1);
    expect(allocations[0].allocationType).toBe('RENTAL_REVENUE');
    expect(allocations[0].amount).toBe(1000);
  });

  it('correctly allocates ₹4,000 security deposit to SECURITY_DEPOSIT_LIABILITY', () => {
    const allocations = allocatePayment({
      id: 'pay-002',
      amount: 4000,
      type: 'SECURITY_DEPOSIT',
      status: 'SUCCESS',
    });

    expect(allocations).toHaveLength(1);
    expect(allocations[0].allocationType).toBe('SECURITY_DEPOSIT_LIABILITY');
    expect(allocations[0].amount).toBe(4000);
  });

  it('calculates full deposit refund when zero damage occurred', () => {
    const settlement = calculateDepositSettlement(4000, 0, 0, 0);

    expect(settlement.initialDeposit).toBe(4000);
    expect(settlement.totalDeductions).toBe(0);
    expect(settlement.refundableBalance).toBe(4000);
    expect(settlement.additionalChargesDue).toBe(0);
  });

  it('calculates partial deposit refund with approved damage deduction', () => {
    // ₹4,000 deposit - ₹1,200 mirror/panel damage = ₹2,800 refunded
    const settlement = calculateDepositSettlement(4000, 1200, 0, 0);

    expect(settlement.totalDeductions).toBe(1200);
    expect(settlement.refundableBalance).toBe(2800);
    expect(settlement.additionalChargesDue).toBe(0);
  });

  it('handles damage exceeding deposit liability without negative refund', () => {
    // ₹4,000 deposit - ₹5,500 major engine/chassis repair -> ₹0 refund, ₹1,500 additional liability
    const settlement = calculateDepositSettlement(4000, 5500, 0, 0);

    expect(settlement.totalDeductions).toBe(5500);
    expect(settlement.refundableBalance).toBe(0);
    expect(settlement.additionalChargesDue).toBe(1500);
  });

  it('enforces cancellation policy: rider cancellation retains token', () => {
    const result = calculateCancellationRefund(1000, 'RIDER');

    expect(result.refundAmount).toBe(0);
    expect(result.retainedAmount).toBe(1000);
    expect(result.refundReason).toBe('RIDER_CANCELLATION_TOKEN_FORFEITED');
  });

  it('enforces cancellation policy: owner cancellation grants 100% refund', () => {
    const result = calculateCancellationRefund(1000, 'OWNER');

    expect(result.refundAmount).toBe(1000);
    expect(result.retainedAmount).toBe(0);
    expect(result.refundReason).toBe('OWNER_CANCELLATION_FULL_REFUND');
  });

  it('computes fleet profitability strictly segregating deposit liabilities from revenue', () => {
    // Rental Revenue = ₹25,000
    // Expenses = ₹7,000 (Servicing + Insurance)
    // Security Deposits Held = ₹8,000 (2 scooters @ ₹4,000 deposit)
    // Vehicle Purchase = ₹70,000
    const profit = calculateFleetProfitability(25000, 7000, 8000, 70000);

    expect(profit.rentalRevenue).toBe(25000);
    expect(profit.operatingExpenses).toBe(7000);
    expect(profit.netOperatingIncome).toBe(18000); // 25000 - 7000
    expect(profit.securityDepositsHeld).toBe(8000); // Excluded from net income!
    expect(profit.operatingMarginPercent).toBe(72); // 18000 / 25000 * 100%
    expect(profit.roiPercent).toBe(25.71); // 18000 / 70000 * 100%
  });
});
