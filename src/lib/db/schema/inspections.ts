import {
  pgTable,
  uuid,
  varchar,
  integer,
  smallint,
  numeric,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { vehicles } from './vehicles';
import { users } from './users';

export const inspectionTypeEnum = pgEnum('inspection_type', [
  'HANDOVER',
  'RETURN',
  'MAINTENANCE_RELEASE',
  'ACCIDENT_ASSESSMENT',
]);

export const vehicleInspections = pgTable('vehicle_inspections', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionNumber: varchar('inspection_number', { length: 50 }).notNull().unique(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id'),
  inspectionType: inspectionTypeEnum('inspection_type').notNull(),
  odometerReading: integer('odometer_reading').notNull(),
  fuelPercentage: smallint('fuel_percentage').notNull(),
  cleanlinessRating: varchar('cleanliness_rating', { length: 30 }).notNull().default('CLEAN'),
  conditionRating: varchar('condition_rating', { length: 30 }).notNull().default('GOOD'),
  damagesNoted: text('damages_noted'),
  estimatedDamageCost: numeric('estimated_damage_cost', { precision: 10, scale: 2 }).default(
    '0.00'
  ),
  inspectorId: uuid('inspector_id')
    .notNull()
    .references(() => users.id),
  riderSignatureStorageKey: varchar('rider_signature_storage_key', { length: 500 }),
  inspectedAt: timestamp('inspected_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inspectionPhotos = pgTable('inspection_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspectionId: uuid('inspection_id')
    .notNull()
    .references(() => vehicleInspections.id, { onDelete: 'cascade' }),
  photoAngle: varchar('photo_angle', { length: 50 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  caption: varchar('caption', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
