import { describe, it, expect } from 'vitest';
import * as schema from '@/lib/db/schema';

describe('PostgreSQL Drizzle Schema Audit (Phase 2 Audit)', () => {
  it('exports all 9 required domain modules and tables', () => {
    // Module 1: Auth & Users
    expect(schema.users).toBeDefined();
    expect(schema.roles).toBeDefined();
    expect(schema.userRoles).toBeDefined();

    // Module 2: Rider KYC
    expect(schema.riderProfiles).toBeDefined();
    expect(schema.riderDocuments).toBeDefined();

    // Module 3: Vehicles & Fleet
    expect(schema.vehicles).toBeDefined();
    expect(schema.vehicleDocuments).toBeDefined();
    expect(schema.vehicleStatusHistory).toBeDefined();
    expect(schema.vehiclePhotos).toBeDefined();

    // Module 4: Pricing & Packages
    expect(schema.rentalPackages).toBeDefined();
    expect(schema.vehiclePricing).toBeDefined();

    // Module 5: Bookings & Snapshots
    expect(schema.bookings).toBeDefined();
    expect(schema.bookingPriceSnapshots).toBeDefined();
    expect(schema.bookingExtensions).toBeDefined();

    // Module 6: Decoupled Assignments
    expect(schema.vehicleAssignments).toBeDefined();

    // Module 7: Inspections
    expect(schema.vehicleInspections).toBeDefined();
    expect(schema.inspectionPhotos).toBeDefined();

    // Module 8: Financial Ledger & Deposits
    expect(schema.payments).toBeDefined();
    expect(schema.paymentAllocations).toBeDefined();
    expect(schema.depositTransactions).toBeDefined();
    expect(schema.refunds).toBeDefined();
    expect(schema.expenses).toBeDefined();
    expect(schema.expenseCategories).toBeDefined();

    // Module 9: Maintenance & Support
    expect(schema.maintenanceRecords).toBeDefined();
    expect(schema.maintenanceUpdates).toBeDefined();
    expect(schema.accidentIncidents).toBeDefined();
    expect(schema.insuranceClaims).toBeDefined();
    expect(schema.supportTickets).toBeDefined();
    expect(schema.supportMessages).toBeDefined();
    expect(schema.supportAttachments).toBeDefined();
  });

  it('validates critical table columns and financial types', () => {
    // Vehicles table
    expect(schema.vehicles.registrationNumber).toBeDefined();
    expect(schema.vehicles.purchaseCost).toBeDefined();
    expect(schema.vehicles.operationalStatus).toBeDefined();
    expect(schema.vehicles.complianceStatus).toBeDefined();

    // Booking Price Snapshots (immutable terms)
    expect(schema.bookingPriceSnapshots.bookingId).toBeDefined();
    expect(schema.bookingPriceSnapshots.dailyRate).toBeDefined();
    expect(schema.bookingPriceSnapshots.totalRentalPrice).toBeDefined();
    expect(schema.bookingPriceSnapshots.bookingTokenAmount).toBeDefined();
    expect(schema.bookingPriceSnapshots.securityDepositAmount).toBeDefined();

    // Vehicle Assignments (decoupled allocations)
    expect(schema.vehicleAssignments.bookingId).toBeDefined();
    expect(schema.vehicleAssignments.vehicleId).toBeDefined();
    expect(schema.vehicleAssignments.riderId).toBeDefined();
    expect(schema.vehicleAssignments.startingOdometer).toBeDefined();
    expect(schema.vehicleAssignments.status).toBeDefined();

    // Financial Ledger & Segregated Deposits
    expect(schema.payments.amount).toBeDefined();
    expect(schema.payments.paymentType).toBeDefined();
    expect(schema.depositTransactions.runningBalance).toBeDefined();
    expect(schema.depositTransactions.transactionType).toBeDefined();
  });
});
