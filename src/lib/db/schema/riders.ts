import {
  pgTable,
  uuid,
  varchar,
  date,
  text,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const riderVerificationStatusEnum = pgEnum('rider_verification_status', [
  'UNVERIFIED',
  'DOCUMENTS_PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
]);

export const riderDocumentTypeEnum = pgEnum('rider_document_type', [
  'AADHAAR',
  'DRIVING_LICENCE',
  'PAN',
  'POLICE_CLEARANCE',
  'PROFILE_PHOTO',
]);

export const documentStatusEnum = pgEnum('document_status', [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
]);

export const riderProfiles = pgTable('rider_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'restrict' }),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: varchar('city', { length: 100 }).notNull().default('Kochi'),
  state: varchar('state', { length: 100 }).notNull().default('Kerala'),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  emergencyContactName: varchar('emergency_contact_name', { length: 150 }).notNull(),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }).notNull(),
  emergencyContactRelation: varchar('emergency_contact_relation', { length: 50 }).notNull(),
  verificationStatus: riderVerificationStatusEnum('verification_status')
    .notNull()
    .default('UNVERIFIED'),
  accountStatus: varchar('account_status', { length: 50 }).notNull().default('ACTIVE'),
  rejectionReason: text('rejection_reason'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const riderDocuments = pgTable('rider_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'cascade' }),
  documentType: riderDocumentTypeEnum('document_type').notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  expiryDate: date('expiry_date'),
  verificationStatus: documentStatusEnum('verification_status').notNull().default('PENDING'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  rejectionNotes: text('rejection_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
