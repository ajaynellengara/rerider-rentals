import {
  pgTable,
  uuid,
  varchar,
  numeric,
  date,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { riderProfiles } from './riders';
import { vehicles } from './vehicles';
import { users } from './users';

export const paymentTypeEnum = pgEnum('payment_type', [
  'BOOKING_TOKEN',
  'RENTAL_BALANCE',
  'SECURITY_DEPOSIT',
  'EXTENSION',
  'LATE_FEE',
  'DAMAGE_CHARGE',
  'REFUND',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CARD',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'REVERSED',
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentNumber: varchar('payment_number', { length: 50 }).notNull().unique(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionReference: varchar('transaction_reference', { length: 150 }),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  recordedBy: uuid('recorded_by')
    .notNull()
    .references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentAllocations = pgTable('payment_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  allocationType: varchar('allocation_type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const depositTransactionTypeEnum = pgEnum('deposit_transaction_type', [
  'RECEIVED',
  'REFUNDED',
  'FORFEITED_DAMAGE',
  'FORFEITED_PENALTY',
]);

export const depositTransactions = pgTable('deposit_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  transactionType: depositTransactionTypeEnum('transaction_type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  runningBalance: numeric('running_balance', { precision: 12, scale: 2 }).notNull(),
  paymentId: uuid('payment_id').references(() => payments.id),
  settlementNotes: text('settlement_notes'),
  recordedBy: uuid('recorded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  refundNumber: varchar('refund_number', { length: 50 }).notNull().unique(),
  paymentId: uuid('payment_id').references(() => payments.id),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  refundReason: varchar('refund_reason', { length: 100 }).notNull(),
  refundMethod: paymentMethodEnum('refund_method').notNull(),
  transactionReference: varchar('transaction_reference', { length: 150 }),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isCapitalized: boolean('is_capitalized').notNull().default(false),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseNumber: varchar('expense_number', { length: 50 }).notNull().unique(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => expenseCategories.id, { onDelete: 'restrict' }),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  expenseDate: date('expense_date').notNull(),
  vendorName: varchar('vendor_name', { length: 150 }),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('UPI'),
  invoiceReference: varchar('invoice_reference', { length: 100 }),
  receiptStorageKey: varchar('receipt_storage_key', { length: 500 }),
  description: text('description').notNull(),
  recordedBy: uuid('recorded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
