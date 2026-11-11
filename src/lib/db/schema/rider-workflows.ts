import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from 'drizzle-orm/pg-core'
import { bookings } from './bookings'
import { riderProfiles } from './riders'
import { users } from './users'

export const returnRequestStatusEnum = pgEnum('return_request_status', [
  'REQUESTED',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
])

export const rentalReturnRequests = pgTable('rental_return_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'restrict' }),
  riderId: uuid('rider_id').notNull().references(() => riderProfiles.id, { onDelete: 'restrict' }),
  preferredReturnAt: timestamp('preferred_return_at', { withTimezone: true }).notNull(),
  preferredLocation: varchar('preferred_location', { length: 255 }).notNull(),
  odometerReading: integer('odometer_reading'),
  conditionDeclaration: text('condition_declaration').notNull(),
  riderNotes: text('rider_notes'),
  status: returnRequestStatusEnum('status').notNull().default('REQUESTED'),
  confirmedReturnAt: timestamp('confirmed_return_at', { withTimezone: true }),
  confirmedLocation: varchar('confirmed_location', { length: 255 }),
  adminNotes: text('admin_notes'),
  confirmedBy: uuid('confirmed_by').references(() => users.id),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
