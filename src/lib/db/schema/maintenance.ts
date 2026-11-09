import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { vehicles } from './vehicles';
import { bookings } from './bookings';
import { riderProfiles } from './riders';
import { users } from './users';
import { vehicleInspections } from './inspections';

export const maintenanceCategoryEnum = pgEnum('maintenance_category', [
  'SCHEDULED_SERVICE',
  'ENGINE',
  'BRAKE',
  'TYRE',
  'BATTERY',
  'ELECTRICAL',
  'BREAKDOWN',
  'OTHER',
]);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'REPORTED',
  'IN_PROGRESS',
  'AWAITING_PARTS',
  'AWAITING_RELEASE_INSPECTION',
  'COMPLETED',
  'CANCELLED',
]);

export const maintenanceRecords = pgTable('maintenance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  maintenanceNumber: varchar('maintenance_number', { length: 50 }).notNull().unique(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),
  reportedBy: uuid('reported_by')
    .notNull()
    .references(() => users.id),
  issueCategory: maintenanceCategoryEnum('issue_category').notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('MEDIUM'),
  reportDate: date('report_date').defaultNow().notNull(),
  odometerReading: integer('odometer_reading').notNull(),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }).default('0.00'),
  actualCost: numeric('actual_cost', { precision: 10, scale: 2 }).default('0.00'),
  serviceProvider: varchar('service_provider', { length: 150 }),
  repairStatus: maintenanceStatusEnum('repair_status').notNull().default('REPORTED'),
  completionDate: date('completion_date'),
  releaseInspectionId: uuid('release_inspection_id').references(
    () => vehicleInspections.id
  ),
  adminReleasedBy: uuid('admin_released_by').references(() => users.id),
  adminReleasedAt: timestamp('admin_released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const maintenanceUpdates = pgTable('maintenance_updates', {
  id: uuid('id').defaultRandom().primaryKey(),
  maintenanceId: uuid('maintenance_id')
    .notNull()
    .references(() => maintenanceRecords.id, { onDelete: 'cascade' }),
  notes: text('notes').notNull(),
  updatedBy: uuid('updated_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accidentIncidents = pgTable('accident_incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentNumber: varchar('incident_number', { length: 50 }).notNull().unique(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),
  incidentDate: timestamp('incident_date', { withTimezone: true }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description').notNull(),
  isVehicleDrivable: boolean('is_vehicle_drivable').notNull().default(false),
  thirdPartyInvolved: boolean('third_party_involved').notNull().default(false),
  policeReportFiled: boolean('police_report_filed').notNull().default(false),
  firGdNumber: varchar('fir_gd_number', { length: 100 }),
  damageAssessment: text('damage_assessment'),
  estimatedRepairCost: numeric('estimated_repair_cost', { precision: 10, scale: 2 }).default(
    '0.00'
  ),
  actualRepairCost: numeric('actual_repair_cost', { precision: 10, scale: 2 }).default('0.00'),
  riderLiabilityAmount: numeric('rider_liability_amount', { precision: 10, scale: 2 }).default(
    '0.00'
  ),
  incidentStatus: varchar('incident_status', { length: 50 }).notNull().default('REPORTED'),
  reportedBy: uuid('reported_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const insuranceClaims = pgTable('insurance_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id')
    .notNull()
    .unique()
    .references(() => accidentIncidents.id, { onDelete: 'restrict' }),
  claimNumber: varchar('claim_number', { length: 100 }).notNull().unique(),
  insurerName: varchar('insurer_name', { length: 150 }).notNull(),
  policyNumber: varchar('policy_number', { length: 100 }).notNull(),
  claimAmount: numeric('claim_amount', { precision: 12, scale: 2 }).notNull(),
  approvedAmount: numeric('approved_amount', { precision: 12, scale: 2 }),
  claimStatus: varchar('claim_status', { length: 50 }).notNull().default('SUBMITTED'),
  filedDate: date('filed_date').notNull(),
  settledDate: date('settled_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  category: varchar('category', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('MEDIUM'),
  status: varchar('status', { length: 30 }).notNull().default('OPEN'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const supportMessages = pgTable('support_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => supportTickets.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  senderRole: varchar('sender_role', { length: 30 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const supportAttachments = pgTable('support_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => supportMessages.id, { onDelete: 'cascade' }),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  fileName: varchar('original_file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
