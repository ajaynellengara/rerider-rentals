import {
  pgTable,
  uuid,
  varchar,
  date,
  integer,
  numeric,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { riderProfiles } from './riders';
import { vehicles } from './vehicles';
import { rentalPackages } from './pricing';
import { users } from './users';

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'ACTIVE',
  'EXTENSION_PENDING',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE',
]);

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingNumber: varchar('booking_number', { length: 50 }).notNull().unique(),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),
  packageId: uuid('package_id')
    .notNull()
    .references(() => rentalPackages.id, { onDelete: 'restrict' }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalDurationDays: integer('total_duration_days').notNull(),
  bookingStatus: bookingStatusEnum('booking_status').notNull().default('PENDING'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bookingPriceSnapshots = pgTable('booking_price_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  packageCode: varchar('package_code', { length: 50 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).notNull(),
  totalRentalPrice: numeric('total_rental_price', { precision: 10, scale: 2 }).notNull(),
  bookingTokenAmount: numeric('booking_token_amount', { precision: 10, scale: 2 }).notNull(),
  remainingRentalBalance: numeric('remaining_rental_balance', { precision: 10, scale: 2 }).notNull(),
  securityDepositAmount: numeric('security_deposit_amount', { precision: 10, scale: 2 }).notNull(),
  kmLimitTotal: integer('km_limit_total').notNull(),
  extraKmCharge: numeric('extra_km_charge', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  approvedBy: uuid('approved_by').references(() => users.id),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bookingExtensions = pgTable('booking_extensions', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  additionalDays: integer('additional_days').notNull(),
  previousEndDate: date('previous_end_date').notNull(),
  newEndDate: date('new_end_date').notNull(),
  dailyRateApplied: numeric('daily_rate_applied', { precision: 10, scale: 2 }).notNull(),
  additionalRentalAmount: numeric('additional_rental_amount', { precision: 10, scale: 2 }).notNull(),
  paymentId: uuid('payment_id'),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  requestedBy: uuid('requested_by')
    .notNull()
    .references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
