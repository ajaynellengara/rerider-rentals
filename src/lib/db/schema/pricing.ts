import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  boolean,
  text,
  smallint,
  timestamp,
} from 'drizzle-orm/pg-core';
import { vehicles } from './vehicles';
import { users } from './users';

export const rentalPackages = pgTable('rental_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  durationDays: integer('duration_days').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: smallint('display_order').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehiclePricing = pgTable('vehicle_pricing', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  packageId: uuid('package_id')
    .notNull()
    .references(() => rentalPackages.id, { onDelete: 'restrict' }),
  dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).notNull(),
  packageTotalRate: numeric('package_total_rate', { precision: 10, scale: 2 }).notNull(),
  bookingTokenAmount: numeric('booking_token_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('1000.00'),
  securityDepositAmount: numeric('security_deposit_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('4000.00'),
  kmLimitPerDay: integer('km_limit_per_day').notNull().default(100),
  extraKmCharge: numeric('extra_km_charge', { precision: 10, scale: 2 })
    .notNull()
    .default('4.00'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true })
    .defaultNow()
    .notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
