import {
  pgTable,
  uuid,
  varchar,
  smallint,
  date,
  numeric,
  integer,
  boolean,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const vehicleOperationalStatusEnum = pgEnum('vehicle_operational_status', [
  'AVAILABLE',
  'RESERVED',
  'RENTED',
  'MAINTENANCE',
  'ACCIDENT',
  'UNAVAILABLE',
  'RETIRED',
]);

export const vehicleComplianceStatusEnum = pgEnum('vehicle_compliance_status', [
  'PENDING_REVIEW',
  'VERIFIED_COMPLIANT',
  'RESTRICTED_USE',
  'EXPIRED_DOCS',
  'NON_COMPLIANT',
]);

export const vehicleDocumentTypeEnum = pgEnum('vehicle_document_type', [
  'RC',
  'INSURANCE',
  'PUC',
  'ROAD_TAX',
  'FITNESS',
  'PERMIT',
  'OTHER',
]);

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  registrationNumber: varchar('registration_number', { length: 30 }).notNull().unique(),
  manufacturer: varchar('manufacturer', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  variant: varchar('variant', { length: 50 }),
  manufacturingYear: smallint('manufacturing_year').notNull(),
  fuelType: varchar('fuel_type', { length: 30 }).notNull().default('PETROL'),
  vehicleCategory: varchar('vehicle_category', { length: 50 }).notNull().default('SCOOTER'),
  chassisNumber: varchar('chassis_number', { length: 100 }).notNull().unique(),
  engineNumber: varchar('engine_number', { length: 100 }).notNull().unique(),
  purchaseDate: date('purchase_date').notNull(),
  purchaseCost: numeric('purchase_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('70000.00'),
  currentOdometer: integer('current_odometer').notNull().default(0),
  operationalStatus: vehicleOperationalStatusEnum('operational_status')
    .notNull()
    .default('AVAILABLE'),
  complianceStatus: vehicleComplianceStatusEnum('compliance_status')
    .notNull()
    .default('PENDING_REVIEW'),
  complianceNotes: text('compliance_notes'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehicleDocuments = pgTable('vehicle_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  documentType: vehicleDocumentTypeEnum('document_type').notNull(),
  documentNumber: varchar('document_number', { length: 100 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until').notNull(),
  isCommercialPermit: boolean('is_commercial_permit').notNull().default(false),
  verificationStatus: varchar('verification_status', { length: 30 }).notNull().default('PENDING'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehicleStatusHistory = pgTable('vehicle_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  fromStatus: vehicleOperationalStatusEnum('from_status').notNull(),
  toStatus: vehicleOperationalStatusEnum('to_status').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehiclePhotos = pgTable('vehicle_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  photoType: varchar('photo_type', { length: 50 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  caption: varchar('caption', { length: 255 }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});
