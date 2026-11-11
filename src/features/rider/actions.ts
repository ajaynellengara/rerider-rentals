'use server'

import { eq, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin, requireRider, setSessionCookie } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/password'
import { canModifyFinancials } from '@/lib/auth/roles'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { calculateAge } from '@/services/kyc'
import { confirmReturnRequest, createExtensionRequest, createReturnRequest, createRiderSupportTicket, reviewExtensionRequest } from '@/services/rider-portal'
import { recordBookingPayment } from '@/services/bookings'

export type RiderActionState = { success: boolean; message?: string; error?: string }

const registrationSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^\\+?[0-9\\s()-]{10,20}$/),
  email: z.string().trim().email().max(255),
  password: z.string().min(12).max(72),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  addressLine1: z.string().trim().min(4).max(500),
  addressLine2: z.string().trim().max(500).optional(),
  city: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/),
  emergencyContactName: z.string().trim().min(2).max(150),
  emergencyContactPhone: z.string().trim().regex(/^\\+?[0-9\\s()-]{10,20}$/),
  emergencyContactRelation: z.string().trim().min(2).max(50),
})

export async function registerRiderAction(_previous: RiderActionState, formData: FormData): Promise<RiderActionState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { success: false, error: 'Check the details and make sure the password has at least 12 characters.' }
  const data = parsed.data
  const birthDate = new Date(`${data.dateOfBirth}T00:00:00`)
  if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== data.dateOfBirth) {
    return { success: false, error: 'Enter a valid date of birth.' }
  }
  if (calculateAge(data.dateOfBirth) < 20) return { success: false, error: 'Riders must be at least 20 years old to register.' }

  try {
    const email = data.email.toLowerCase()
    const phone = data.phone.replace(/[\s()-]/g, '')
    const passwordHash = await hashPassword(data.password)
    const created = await db.transaction(async (tx) => {
      const existing = await tx.select({ id: schema.users.id }).from(schema.users)
        .where(or(eq(schema.users.email, email), eq(schema.users.phone, phone))).limit(1)
      if (existing.length) throw new Error('ACCOUNT_EXISTS')
      const [user] = await tx.insert(schema.users).values({
        email,
        phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'RIDER',
        isActive: true,
      }).returning()
      const [profile] = await tx.insert(schema.riderProfiles).values({
        userId: user.id,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        dateOfBirth: data.dateOfBirth,
        phone,
        email,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: 'Kerala',
        pincode: data.pincode,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone.replace(/[\s()-]/g, ''),
        emergencyContactRelation: data.emergencyContactRelation,
        verificationStatus: 'UNVERIFIED',
        accountStatus: 'ACTIVE',
      }).returning()
      return { user, profile }
    })
    await setSessionCookie({
      userId: created.user.id,
      riderProfileId: created.profile.id,
      email: created.user.email,
      name: created.profile.fullName,
      role: 'RIDER',
    })
    revalidatePath('/rider')
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error
    if (error instanceof Error && error.message === 'ACCOUNT_EXISTS') {
      return { success: false, error: 'An account already uses that email or mobile number. Sign in or contact support.' }
    }
    return { success: false, error: 'We could not create your account right now. Please try again.' }
  }
  redirect('/rider')
}

const returnRequestSchema = z.object({
  bookingId: z.string().uuid(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  preferredLocation: z.string().trim().min(3).max(255),
  odometerReading: z.string().optional(),
  conditionDeclaration: z.string().trim().min(5).max(2000),
  riderNotes: z.string().trim().max(1000).optional(),
})

export async function requestReturnAction(_previous: RiderActionState, formData: FormData): Promise<RiderActionState> {
  try {
    const session = await requireRider()
    const parsed = returnRequestSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) return { success: false, error: 'Complete the return date, time, location and condition declaration.' }
    const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles)
      .where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
    if (!profile) return { success: false, error: 'Your rider profile is not linked to this account.' }
    const preferredReturnAt = new Date(`${parsed.data.preferredDate}T${parsed.data.preferredTime}:00+05:30`)
    const odometer = parsed.data.odometerReading ? Number(parsed.data.odometerReading) : undefined
    if (odometer !== undefined && (!Number.isSafeInteger(odometer) || odometer < 0)) return { success: false, error: 'Enter a valid odometer reading.' }
    await createReturnRequest({
      bookingId: parsed.data.bookingId,
      riderId: profile.id,
      preferredReturnAt,
      preferredLocation: parsed.data.preferredLocation,
      odometerReading: odometer,
      conditionDeclaration: parsed.data.conditionDeclaration,
      riderNotes: parsed.data.riderNotes || undefined,
    })
    revalidatePath('/rider/returns')
    revalidatePath('/admin/returns')
    return { success: true, message: 'Return appointment request sent. Operations will confirm the time and location.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not submit your return request.' }
  }
}

export async function confirmReturnAction(formData: FormData) {
  const session = await requireAdmin()
  const parsed = z.object({
    requestId: z.string().uuid(),
    confirmedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    confirmedTime: z.string().regex(/^\d{2}:\d{2}$/),
    confirmedLocation: z.string().trim().min(3).max(255),
    adminNotes: z.string().trim().max(1000).optional(),
  }).safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) throw new Error('Complete the confirmed return appointment details.')
  await confirmReturnRequest({
    requestId: parsed.data.requestId,
    adminId: session.userId,
    confirmedReturnAt: new Date(`${parsed.data.confirmedDate}T${parsed.data.confirmedTime}:00+05:30`),
    confirmedLocation: parsed.data.confirmedLocation,
    adminNotes: parsed.data.adminNotes,
  })
  revalidatePath('/admin/returns')
  revalidatePath('/rider/returns')
  revalidatePath('/rider/my-rental')
}

export async function createSupportTicketAction(_previous: RiderActionState, formData: FormData): Promise<RiderActionState> {
  try {
    const session = await requireRider()
    const parsed = z.object({
      category: z.enum(['VEHICLE_ISSUE', 'PAYMENT', 'RETURN', 'ACCOUNT', 'OTHER']),
      subject: z.string().trim().min(4).max(200),
      message: z.string().trim().min(10).max(3000),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      bookingId: z.string().uuid().optional().or(z.literal('')),
    }).safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) return { success: false, error: 'Add a subject and at least 10 characters describing the issue.' }
    const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles)
      .where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
    if (!profile) return { success: false, error: 'Your rider profile is not linked to this account.' }
    await createRiderSupportTicket({
      riderId: profile.id,
      userId: session.userId,
      bookingId: parsed.data.bookingId || undefined,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
      priority: parsed.data.priority,
    })
    revalidatePath('/rider/support')
    return { success: true, message: 'Your support request was sent to operations.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not submit your support request.' }
  }
}


export async function requestExtensionAction(_previous: RiderActionState, formData: FormData): Promise<RiderActionState> {
  try {
    const session = await requireRider()
    const parsed = z.object({ bookingId: z.string().uuid(), additionalDays: z.coerce.number().int().min(1).max(30) })
      .safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) return { success: false, error: 'Choose between 1 and 30 additional days.' }
    const [profile] = await db.select({ id: schema.riderProfiles.id }).from(schema.riderProfiles)
      .where(eq(schema.riderProfiles.userId, session.userId)).limit(1)
    if (!profile) return { success: false, error: 'Your rider profile is not linked to this account.' }
    const request = await createExtensionRequest({ ...parsed.data, riderId: profile.id, requestedBy: session.userId })
    revalidatePath('/rider/my-rental')
    revalidatePath('/admin/extensions')
    return { success: true, message: `Extension request ${request.id.slice(0, 8).toUpperCase()} sent to operations. Your current return date remains unchanged until approval and payment.` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not submit the extension request.' }
  }
}

export async function reviewExtensionAction(decision: 'APPROVE' | 'DECLINE', formData: FormData) {
  const session = await requireAdmin()
  if (!canModifyFinancials(session.role)) throw new Error('Only an administrator can approve or decline rental extensions.')
  const extensionId = z.string().uuid().safeParse(formData.get('extensionId'))
  if (!extensionId.success) throw new Error('Invalid extension request.')
  await reviewExtensionRequest({ extensionId: extensionId.data, adminId: session.userId, decision })
  revalidatePath('/admin/extensions')
  revalidatePath('/rider/my-rental')
}

