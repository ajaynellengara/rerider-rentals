import { and, desc, eq, gte, inArray, lte, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const OPEN_RETURN_STATUSES = ['REQUESTED', 'CONFIRMED'] as const

export async function createReturnRequest(input: {
  bookingId: string
  riderId: string
  preferredReturnAt: Date
  preferredLocation: string
  odometerReading?: number
  conditionDeclaration: string
  riderNotes?: string
}) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings)
      .where(and(eq(schema.bookings.id, input.bookingId), eq(schema.bookings.riderId, input.riderId)))
      .for('update').limit(1)
    if (!booking || !['ACTIVE', 'OVERDUE'].includes(booking.bookingStatus)) throw new Error('A return request is available only for your active rental.')
    if (input.preferredReturnAt <= new Date()) throw new Error('Choose a future return appointment.')
    const [existing] = await tx.select({ id: schema.rentalReturnRequests.id })
      .from(schema.rentalReturnRequests)
      .where(and(eq(schema.rentalReturnRequests.bookingId, booking.id), inArray(schema.rentalReturnRequests.status, [...OPEN_RETURN_STATUSES])))
      .limit(1)
    if (existing) throw new Error('You already have a return appointment request for this rental.')
    const [openExtension] = await tx.select({ id: schema.bookingExtensions.id }).from(schema.bookingExtensions)
      .where(and(eq(schema.bookingExtensions.bookingId, booking.id), inArray(schema.bookingExtensions.status, ['PENDING', 'APPROVED_AWAITING_PAYMENT'])))
      .limit(1)
    if (openExtension) throw new Error('Resolve your extension request before scheduling a return appointment.')
    if (input.odometerReading !== undefined) {
      const [assignment] = await tx.select({ startingOdometer: schema.vehicleAssignments.startingOdometer })
        .from(schema.vehicleAssignments).where(and(eq(schema.vehicleAssignments.bookingId, booking.id), eq(schema.vehicleAssignments.status, 'ACTIVE'))).limit(1)
      if (assignment && input.odometerReading < assignment.startingOdometer) throw new Error('The preliminary odometer must not be lower than the handover reading.')
    }
    const [request] = await tx.insert(schema.rentalReturnRequests).values(input).returning({ id: schema.rentalReturnRequests.id })
    return request
  })
}

export async function getRiderReturnRequests(riderId: string) {
  return db.select({
    request: schema.rentalReturnRequests,
    bookingNumber: schema.bookings.bookingNumber,
    vehicleName: schema.vehicles.model,
    manufacturer: schema.vehicles.manufacturer,
  }).from(schema.rentalReturnRequests)
    .innerJoin(schema.bookings, eq(schema.bookings.id, schema.rentalReturnRequests.bookingId))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .where(eq(schema.rentalReturnRequests.riderId, riderId))
    .orderBy(desc(schema.rentalReturnRequests.createdAt))
}

export async function getAdminReturnRequests() {
  return db.select({
    request: schema.rentalReturnRequests,
    booking: schema.bookings,
    rider: schema.riderProfiles,
    user: schema.users,
    vehicle: schema.vehicles,
  }).from(schema.rentalReturnRequests)
    .innerJoin(schema.bookings, eq(schema.bookings.id, schema.rentalReturnRequests.bookingId))
    .innerJoin(schema.riderProfiles, eq(schema.riderProfiles.id, schema.rentalReturnRequests.riderId))
    .innerJoin(schema.users, eq(schema.users.id, schema.riderProfiles.userId))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .orderBy(desc(schema.rentalReturnRequests.createdAt))
}

export async function confirmReturnRequest(input: {
  requestId: string
  adminId: string
  confirmedReturnAt: Date
  confirmedLocation: string
  adminNotes?: string
}) {
  return db.transaction(async (tx) => {
    const [request] = await tx.select().from(schema.rentalReturnRequests)
      .where(eq(schema.rentalReturnRequests.id, input.requestId)).for('update').limit(1)
    if (!request || request.status !== 'REQUESTED') throw new Error('This return request is no longer awaiting review.')
    if (input.confirmedReturnAt <= new Date()) throw new Error('Choose a future confirmed return appointment.')
    const [booking] = await tx.select({ id: schema.bookings.id, bookingStatus: schema.bookings.bookingStatus })
      .from(schema.bookings).where(eq(schema.bookings.id, request.bookingId)).for('update').limit(1)
    if (!booking || !['ACTIVE', 'OVERDUE'].includes(booking.bookingStatus)) throw new Error('The rental is no longer active.')
    await tx.update(schema.rentalReturnRequests).set({
      status: 'CONFIRMED',
      confirmedReturnAt: input.confirmedReturnAt,
      confirmedLocation: input.confirmedLocation,
      adminNotes: input.adminNotes?.trim() || null,
      confirmedBy: input.adminId,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(schema.rentalReturnRequests.id, request.id))
  })
}

export async function getRiderProfileDetails(userId: string) {
  const [result] = await db.select({ user: schema.users, profile: schema.riderProfiles })
    .from(schema.riderProfiles).innerJoin(schema.users, eq(schema.users.id, schema.riderProfiles.userId))
    .where(eq(schema.riderProfiles.userId, userId)).limit(1)
  if (!result) return null
  const documents = await db.select().from(schema.riderDocuments)
    .where(eq(schema.riderDocuments.riderId, result.profile.id))
    .orderBy(desc(schema.riderDocuments.createdAt))
  return { ...result, documents }
}

export async function getRiderSupportTickets(riderId: string) {
  return db.select({ ticket: schema.supportTickets, bookingNumber: schema.bookings.bookingNumber })
    .from(schema.supportTickets)
    .leftJoin(schema.bookings, eq(schema.bookings.id, schema.supportTickets.bookingId))
    .where(eq(schema.supportTickets.riderId, riderId))
    .orderBy(desc(schema.supportTickets.createdAt))
}

export async function getRiderActiveVehicleDetails(riderId: string) {
  const [row] = await db.select({
    assignment: schema.vehicleAssignments,
    booking: schema.bookings,
    vehicle: schema.vehicles,
    package: schema.rentalPackages,
    inspection: schema.vehicleInspections,
  })
    .from(schema.vehicleAssignments)
    .innerJoin(schema.bookings, and(
      eq(schema.bookings.id, schema.vehicleAssignments.bookingId),
      inArray(schema.bookings.bookingStatus, ['ACTIVE', 'EXTENSION_PENDING', 'OVERDUE']),
    ))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.vehicleAssignments.vehicleId))
    .innerJoin(schema.rentalPackages, eq(schema.rentalPackages.id, schema.bookings.packageId))
    .leftJoin(schema.vehicleInspections, eq(schema.vehicleInspections.id, schema.vehicleAssignments.handoverInspectionId))
    .where(and(
      eq(schema.vehicleAssignments.riderId, riderId),
      eq(schema.vehicleAssignments.status, 'ACTIVE'),
    ))
    .orderBy(desc(schema.vehicleAssignments.assignmentStart))
    .limit(1)

  if (!row) return null

  const photos = row.inspection
    ? await db.select().from(schema.inspectionPhotos).where(eq(schema.inspectionPhotos.inspectionId, row.inspection.id))
    : []

  return { ...row, photos }
}

export async function createRiderSupportTicket(input: {
  riderId: string
  userId: string
  bookingId?: string
  vehicleId?: string
  category: string
  subject: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
}) {
  return db.transaction(async (tx) => {
    if (input.bookingId) {
      const [booking] = await tx.select({ id: schema.bookings.id, vehicleId: schema.bookings.vehicleId })
        .from(schema.bookings).where(and(eq(schema.bookings.id, input.bookingId), eq(schema.bookings.riderId, input.riderId))).limit(1)
      if (!booking) throw new Error('That rental could not be found in your account.')
    }
    const ticketNumber = `SUP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const [ticket] = await tx.insert(schema.supportTickets).values({
      ticketNumber,
      riderId: input.riderId,
      bookingId: input.bookingId ?? null,
      vehicleId: input.vehicleId ?? null,
      category: input.category,
      subject: input.subject.trim(),
      priority: input.priority,
    }).returning({ id: schema.supportTickets.id, ticketNumber: schema.supportTickets.ticketNumber })
    await tx.insert(schema.supportMessages).values({
      ticketId: ticket.id,
      senderId: input.userId,
      senderRole: 'RIDER',
      message: input.message.trim(),
    })
    return ticket
  })
}

export async function createExtensionRequest(input: {
  bookingId: string
  riderId: string
  requestedBy: string
  additionalDays: number
}) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings)
      .where(and(eq(schema.bookings.id, input.bookingId), eq(schema.bookings.riderId, input.riderId)))
      .for('update').limit(1)
    if (!booking || booking.bookingStatus !== 'ACTIVE') throw new Error('Extensions are available only for your active rental.')
    if (!Number.isInteger(input.additionalDays) || input.additionalDays < 1 || input.additionalDays > 30) throw new Error('Request between 1 and 30 additional days.')
    const [openRequest] = await tx.select({ id: schema.bookingExtensions.id }).from(schema.bookingExtensions)
      .where(and(eq(schema.bookingExtensions.bookingId, booking.id), inArray(schema.bookingExtensions.status, ['PENDING', 'APPROVED_AWAITING_PAYMENT'])))
      .limit(1)
    if (openRequest) throw new Error('You already have an extension request awaiting a decision or payment.')
    const [openReturn] = await tx.select({ id: schema.rentalReturnRequests.id }).from(schema.rentalReturnRequests)
      .where(and(eq(schema.rentalReturnRequests.bookingId, booking.id), inArray(schema.rentalReturnRequests.status, ['REQUESTED', 'CONFIRMED'])))
      .limit(1)
    if (openReturn) throw new Error('Resolve your return appointment before requesting an extension.')
    const [snapshot] = await tx.select().from(schema.bookingPriceSnapshots)
      .where(eq(schema.bookingPriceSnapshots.bookingId, booking.id)).limit(1)
    if (!snapshot) throw new Error('The rental has no agreed price record.')
    const previousEnd = new Date(`${booking.endDate}T00:00:00Z`)
    const newEnd = new Date(previousEnd)
    newEnd.setUTCDate(newEnd.getUTCDate() + input.additionalDays)
    const dailyRate = Number(snapshot.dailyRate)
    const amount = Math.round(dailyRate * input.additionalDays * 100) / 100
    const [extension] = await tx.insert(schema.bookingExtensions).values({
      bookingId: booking.id,
      additionalDays: input.additionalDays,
      previousEndDate: booking.endDate,
      newEndDate: newEnd.toISOString().slice(0, 10),
      dailyRateApplied: String(dailyRate),
      additionalRentalAmount: String(amount),
      requestedBy: input.requestedBy,
      status: 'PENDING',
    }).returning({ id: schema.bookingExtensions.id })
    return extension
  })
}

export async function getRiderExtensionRequests(riderId: string) {
  return db.select({ extension: schema.bookingExtensions, bookingNumber: schema.bookings.bookingNumber })
    .from(schema.bookingExtensions).innerJoin(schema.bookings, eq(schema.bookings.id, schema.bookingExtensions.bookingId))
    .where(eq(schema.bookings.riderId, riderId)).orderBy(desc(schema.bookingExtensions.createdAt))
}

export async function getAdminExtensionQueue() {
  return db.select({
    extension: schema.bookingExtensions,
    booking: schema.bookings,
    rider: schema.riderProfiles,
    user: schema.users,
    vehicle: schema.vehicles,
  }).from(schema.bookingExtensions)
    .innerJoin(schema.bookings, eq(schema.bookings.id, schema.bookingExtensions.bookingId))
    .innerJoin(schema.riderProfiles, eq(schema.riderProfiles.id, schema.bookings.riderId))
    .innerJoin(schema.users, eq(schema.users.id, schema.riderProfiles.userId))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .orderBy(desc(schema.bookingExtensions.createdAt))
}

export async function reviewExtensionRequest(input: { extensionId: string; adminId: string; decision: 'APPROVE' | 'DECLINE' }) {
  return db.transaction(async (tx) => {
    const [extension] = await tx.select().from(schema.bookingExtensions)
      .where(eq(schema.bookingExtensions.id, input.extensionId)).for('update').limit(1)
    if (!extension || extension.status !== 'PENDING') throw new Error('This extension request is no longer awaiting review.')
    const [booking] = await tx.select().from(schema.bookings)
      .where(eq(schema.bookings.id, extension.bookingId)).for('update').limit(1)
    if (!booking || !['ACTIVE', 'OVERDUE'].includes(booking.bookingStatus)) throw new Error('The rental is no longer active.')
    if (input.decision === 'APPROVE') {
      const [conflict] = await tx.select({ id: schema.bookings.id }).from(schema.bookings).where(and(
        eq(schema.bookings.vehicleId, booking.vehicleId),
        ne(schema.bookings.id, booking.id),
        inArray(schema.bookings.bookingStatus, ['PENDING', 'CONFIRMED', 'ACTIVE', 'OVERDUE']),
        lte(schema.bookings.startDate, extension.newEndDate),
        gte(schema.bookings.endDate, extension.previousEndDate),
      )).limit(1)
      if (conflict) throw new Error('The vehicle has another booking during the requested extension. Decline this request or resolve the booking conflict first.')
    }
    await tx.update(schema.bookingExtensions).set({
      status: input.decision === 'APPROVE' ? 'APPROVED_AWAITING_PAYMENT' : 'DECLINED',
      approvedBy: input.decision === 'APPROVE' ? input.adminId : null,
      approvedAt: input.decision === 'APPROVE' ? new Date() : null,
    }).where(eq(schema.bookingExtensions.id, extension.id))
  })
}





