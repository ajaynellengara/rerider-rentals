import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { riderProfiles } from './riders';
import { vehicles } from './vehicles';

export const assignmentReasonEnum = pgEnum('assignment_reason', [
  'INITIAL_ASSIGNMENT',
  'MAINTENANCE_REPLACEMENT',
  'ACCIDENT_REPLACEMENT',
  'OTHER_APPROVED_REASON',
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'ACTIVE',
  'CLOSED',
  'CANCELLED',
]);

export const vehicleAssignments = pgTable('vehicle_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id')
    .notNull()
    .references(() => riderProfiles.id, { onDelete: 'restrict' }),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),
  assignmentStart: timestamp('assignment_start', { withTimezone: true })
    .defaultNow()
    .notNull(),
  assignmentEnd: timestamp('assignment_end', { withTimezone: true }),
  assignmentReason: assignmentReasonEnum('assignment_reason')
    .notNull()
    .default('INITIAL_ASSIGNMENT'),
  previousAssignmentId: uuid('previous_assignment_id'),
  startingOdometer: integer('starting_odometer').notNull(),
  endingOdometer: integer('ending_odometer'),
  status: assignmentStatusEnum('status').notNull().default('ACTIVE'),
  handoverInspectionId: uuid('handover_inspection_id'),
  returnInspectionId: uuid('return_inspection_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
