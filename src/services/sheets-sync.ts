import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import {
  completeRentalReturn,
  recordBookingPayment,
  startConfirmedRental,
  updateBookingStatus,
} from '@/services/bookings';

export interface BookingSheetPayload {
  bookingId: string;
  bookingNumber: string;
  riderName: string;
  phone: string;
  packageName: string;
  dates: string;
  totalRent: number;
  tokenAmount: number;
  depositAmount: number;
  status: string;
}

export interface SheetMutationInput {
  bookingNumber: string;
  action?: 'APPROVE' | 'DECLINE';
  tokenPaid?: boolean;
  depositPaid?: boolean;
  rentalBalancePaid?: boolean;
  paymentMethod?: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD';
  paymentReference?: string;
  startingOdometer?: number;
  returnOdometer?: number;
  fuelPercentage?: number;
  damagesNoted?: string;
  adminEmail?: string;
}

export interface SheetSyncResult {
  success: boolean;
  message: string;
  bookingNumber?: string;
  status?: string;
  error?: string;
}

/**
 * Verify HMAC signature on incoming webhooks from Google Sheets Apps Script
 */
export function verifySheetsWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return false;
  }

  try {
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const signatureBuffer = Buffer.from(signature.trim().toLowerCase());
    const computedBuffer = Buffer.from(computed.toLowerCase());

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  } catch {
    return false;
  }
}

/**
 * Append or notify Google Sheets about a newly created rental request from the rider portal
 */
export async function appendBookingToSheet(payload: BookingSheetPayload): Promise<{ sent: boolean; reason?: string }> {
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;

  // Option A: Direct Apps Script Webhook / Web App
  if (webAppUrl) {
    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReRider-Rentals-Sync/1.0',
        },
        body: JSON.stringify({
          action: 'NEW_BOOKING',
          timestamp: new Date().toISOString(),
          ...payload,
        }),
      });

      if (!response.ok) {
        return { sent: false, reason: `HTTP ${response.status}: ${await response.text()}` };
      }

      return { sent: true };
    } catch (err) {
      return { sent: false, reason: err instanceof Error ? err.message : 'Network error' };
    }
  }

  // Not configured in this environment (safe fallback)
  return { sent: false, reason: 'GOOGLE_SHEETS_WEBAPP_URL not configured' };
}

/**
 * Find an admin or staff user ID to attribute operations actions to
 */
async function getAuditAdminId(preferredEmail?: string): Promise<string> {
  if (preferredEmail) {
    const [adminUser] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, preferredEmail.toLowerCase()))
      .limit(1);

    if (adminUser) return adminUser.id;
  }

  // Fallback to first active SUPER_ADMIN or ADMIN
  const [defaultAdmin] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, 'SUPER_ADMIN'))
    .limit(1);

  if (defaultAdmin) return defaultAdmin.id;

  const [anyAdmin] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, 'ADMIN'))
    .limit(1);

  if (anyAdmin) return anyAdmin.id;

  throw new Error('No active administrator user found in database to authorize sheet operations.');
}

/**
 * Handle incoming operations actions performed by the owner inside Google Sheets
 */
export async function handleSheetMutation(input: SheetMutationInput): Promise<SheetSyncResult> {
  if (!input.bookingNumber || input.bookingNumber.trim().length === 0) {
    return { success: false, message: 'Missing bookingNumber in sheet payload.' };
  }

  try {
    const [booking] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.bookingNumber, input.bookingNumber.trim().toUpperCase()))
      .limit(1);

    if (!booking) {
      return {
        success: false,
        message: `Booking ${input.bookingNumber} was not found in the database.`,
        bookingNumber: input.bookingNumber,
      };
    }

    const adminId = await getAuditAdminId(input.adminEmail);
    const results: string[] = [];

    // 1. Process Approval or Decline Action
    if (input.action) {
      if (booking.bookingStatus === 'PENDING') {
        const decision = input.action === 'APPROVE' ? 'CONFIRMED' : 'CANCELLED';
        await updateBookingStatus(booking.id, adminId, decision);
        results.push(`Booking status updated to ${decision}.`);
      } else {
        results.push(`Skipped approval/decline: booking is already ${booking.bookingStatus}.`);
      }
    }

    // Refresh booking state after decision
    const [currentBooking] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, booking.id))
      .limit(1);

    if (!currentBooking) {
      return { success: false, message: 'Could not refresh booking record.' };
    }

    const method = input.paymentMethod || 'UPI';

    // 2. Process Booking Token Payment
    if (input.tokenPaid && ['CONFIRMED', 'ACTIVE'].includes(currentBooking.bookingStatus)) {
      try {
        await recordBookingPayment({
          bookingId: currentBooking.id,
          adminId,
          type: 'BOOKING_TOKEN',
          method,
          reference: input.paymentReference || 'Recorded via Google Sheet',
        });
        results.push('Booking token payment recorded (Allocated to Rental Revenue).');
      } catch (err) {
        // If already paid, report idempotently
        results.push(`Token: ${err instanceof Error ? err.message : 'Already recorded'}`);
      }
    }

    // 3. Process Rental Balance Payment
    if (input.rentalBalancePaid && ['CONFIRMED', 'ACTIVE'].includes(currentBooking.bookingStatus)) {
      try {
        await recordBookingPayment({
          bookingId: currentBooking.id,
          adminId,
          type: 'RENTAL_BALANCE',
          method,
          reference: input.paymentReference || 'Recorded via Google Sheet',
        });
        results.push('Remaining rental balance payment recorded (Allocated to Rental Revenue).');
      } catch (err) {
        results.push(`Rental Balance: ${err instanceof Error ? err.message : 'Already recorded'}`);
      }
    }

    // 4. Process Refundable Security Deposit Payment
    if (input.depositPaid && ['CONFIRMED', 'ACTIVE'].includes(currentBooking.bookingStatus)) {
      try {
        await recordBookingPayment({
          bookingId: currentBooking.id,
          adminId,
          type: 'SECURITY_DEPOSIT',
          method,
          reference: input.paymentReference || 'Recorded via Google Sheet',
        });
        results.push('Security deposit payment recorded (Segregated as Balance-Sheet Liability).');
      } catch (err) {
        results.push(`Deposit: ${err instanceof Error ? err.message : 'Already recorded'}`);
      }
    }

    // 5. Process Vehicle Handover & Start Rental
    if (typeof input.startingOdometer === 'number' && input.startingOdometer > 0 && currentBooking.bookingStatus === 'CONFIRMED') {
      try {
        await startConfirmedRental({
          bookingId: currentBooking.id,
          adminId,
          startingOdometer: input.startingOdometer,
        });
        results.push(`Handover completed at ${input.startingOdometer} km. Booking is now ACTIVE.`);
      } catch (err) {
        results.push(`Handover failed: ${err instanceof Error ? err.message : 'Validation error'}`);
      }
    }

    // 6. Process Rental Return & Assignment Closure
    if (
      typeof input.returnOdometer === 'number' &&
      input.returnOdometer > 0 &&
      typeof input.fuelPercentage === 'number' &&
      currentBooking.bookingStatus === 'ACTIVE'
    ) {
      try {
        await completeRentalReturn({
          bookingId: currentBooking.id,
          adminId,
          endingOdometer: input.returnOdometer,
          fuelPercentage: input.fuelPercentage,
          damagesNoted: input.damagesNoted,
        });
        results.push(`Return completed at ${input.returnOdometer} km. Booking is now COMPLETED.`);
      } catch (err) {
        results.push(`Return failed: ${err instanceof Error ? err.message : 'Validation error'}`);
      }
    }

    return {
      success: true,
      bookingNumber: currentBooking.bookingNumber,
      status: currentBooking.bookingStatus,
      message: results.length > 0 ? results.join(' ') : 'No operations pending for provided sheet columns.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Database error processing sheet mutation',
      bookingNumber: input.bookingNumber,
      error: 'DATABASE_ERROR',
    };
  }
}
