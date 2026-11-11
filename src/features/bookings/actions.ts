'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { clearSessionCookie, requireAdmin, requireRider, setSessionCookie } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import { canModifyFinancials } from '@/lib/auth/roles'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { completeRentalReturn, createRentalRequest, recordBookingPayment, settleSecurityDeposit, startConfirmedRental, updateBookingStatus } from '@/services/bookings'

const rentalRequestSchema = z.object({
  vehicleId: z.string().uuid(),
  packageId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type BookingActionState = { success: boolean; message?: string; error?: string }

export async function requestRentalAction(_previous: BookingActionState, formData: FormData): Promise<BookingActionState> {
  try {
    const session = await requireRider()
    const parsed = rentalRequestSchema.safeParse({
      vehicleId: formData.get('vehicleId'),
      packageId: formData.get('packageId'),
      startDate: formData.get('startDate'),
    })
    if (!parsed.success) return { success: false, error: 'Choose a vehicle, package, and valid start date.' }

    const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
    if (!profile) return { success: false, error: 'Complete your rider profile before requesting a rental.' }
    const result = await createRentalRequest({ riderId: profile.id, ...parsed.data })
    revalidatePath('/rider')
    revalidatePath('/rider/my-rental')
    revalidatePath('/admin/bookings')
    return { success: true, message: `Request ${result.bookingNumber} sent to operations for review.` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not submit your rental request.' }
  }
}

export async function reviewBookingAction(decision: 'CONFIRMED' | 'CANCELLED', formData: FormData) {
  const session = await requireAdmin()
  if (!canModifyFinancials(session.role)) throw new Error('Only an administrator can approve or decline bookings.')
  const bookingId = z.string().uuid().safeParse(formData.get('bookingId'))
  if (!bookingId.success) throw new Error('Invalid booking request.')
  await updateBookingStatus(bookingId.data, session.userId, decision)
  revalidatePath('/admin/bookings')
  revalidatePath('/rider/my-rental')
}

export async function recordBookingPaymentAction(formData: FormData) {
  const session = await requireAdmin()
  if (!canModifyFinancials(session.role)) throw new Error('Only an administrator can record rental payments.')
  const parsed = z.object({
    bookingId: z.string().uuid(),
    type: z.enum(['BOOKING_TOKEN', 'RENTAL_BALANCE', 'SECURITY_DEPOSIT', 'EXTENSION']),
    method: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CARD']),
    reference: z.string().trim().max(150).optional(),
  }).safeParse({
    bookingId: formData.get('bookingId'), type: formData.get('type'), method: formData.get('method'),
    reference: formData.get('reference') || undefined,
  })
  if (!parsed.success) throw new Error('Check the payment details and try again.')
  await recordBookingPayment({ ...parsed.data, adminId: session.userId })
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/extensions')
  revalidatePath('/rider/my-rental')
}

export async function startRentalAction(formData: FormData) {
  const session = await requireAdmin()
  const parsed = z.object({ bookingId: z.string().uuid(), startingOdometer: z.coerce.number().int().nonnegative() }).safeParse({
    bookingId: formData.get('bookingId'), startingOdometer: formData.get('startingOdometer'),
  })
  if (!parsed.success) throw new Error('Enter a valid handover odometer.')
  await startConfirmedRental({ ...parsed.data, adminId: session.userId })
  revalidatePath('/admin/bookings')
  revalidatePath('/rider')
  revalidatePath('/rider/my-rental')
  revalidatePath('/admin/vehicles')
}

export async function completeRentalAction(formData: FormData) {
  const session = await requireAdmin()
  const parsed = z.object({
    bookingId: z.string().uuid(),
    endingOdometer: z.coerce.number().int().nonnegative(),
    fuelPercentage: z.coerce.number().int().min(0).max(100),
    damagesNoted: z.string().trim().max(2000).optional(),
  }).safeParse({
    bookingId: formData.get('bookingId'), endingOdometer: formData.get('endingOdometer'),
    fuelPercentage: formData.get('fuelPercentage'), damagesNoted: formData.get('damagesNoted') || undefined,
  })
  if (!parsed.success) throw new Error('Check the return inspection details and try again.')
  await completeRentalReturn({ ...parsed.data, adminId: session.userId })
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/vehicles')
  revalidatePath('/rider')
  revalidatePath('/rider/my-rental')
}

export async function settleDepositAction(formData: FormData) {
  const session = await requireAdmin()
  if (!canModifyFinancials(session.role)) throw new Error('Only an administrator can settle a security deposit.')
  const parsed = z.object({
    bookingId: z.string().uuid(),
    refundAmount: z.coerce.number().nonnegative(),
    damageDeduction: z.coerce.number().nonnegative(),
    penaltyDeduction: z.coerce.number().nonnegative(),
    refundMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CARD']),
    notes: z.string().trim().max(1000).default(''),
  }).safeParse({
    bookingId: formData.get('bookingId'), refundAmount: formData.get('refundAmount'),
    damageDeduction: formData.get('damageDeduction'), penaltyDeduction: formData.get('penaltyDeduction'),
    refundMethod: formData.get('refundMethod'), notes: formData.get('notes') || '',
  })
  if (!parsed.success) throw new Error('Check the security deposit settlement amounts and try again.')
  await settleSecurityDeposit({ ...parsed.data, adminId: session.userId })
  revalidatePath('/admin/bookings')
  revalidatePath('/rider/my-rental')
}

export async function loginAction(_previous: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const parsed = z.object({ email: z.string().trim().email(), password: z.string().min(1) }).safeParse({
    email: formData.get('email'), password: formData.get('password'),
  })
  if (!parsed.success) return { success: false, error: 'Enter a valid email and password.' }

  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email.toLowerCase())).limit(1)
    if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { success: false, error: 'Email or password is incorrect.' }
    }

    let riderProfileId: string | undefined
    if (user.role === 'RIDER') {
      const [profile] = await db.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.userId, user.id)).limit(1)
      if (!profile || profile.accountStatus !== 'ACTIVE') return { success: false, error: 'Rider account is not active.' }
      riderProfileId = profile.id
    }
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'RIDER',
      riderProfileId,
    })
    redirect(user.role === 'RIDER' ? '/rider' : '/admin')
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error
    return { success: false, error: 'Sign in is temporarily unavailable because the account database could not be reached.' }
  }
}

export async function logoutAction() {
  await clearSessionCookie()
  redirect('/login')
}





