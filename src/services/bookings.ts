import { and, desc, eq, gte, inArray, lte, ne, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const openStatuses = ['PENDING', 'CONFIRMED', 'ACTIVE', 'EXTENSION_PENDING', 'OVERDUE'] as const

export type RentalSummary = {
  bookingId: string
  bookingNumber: string
  status: string
  startDate: string
  endDate: string
  durationDays: number
  vehicleId: string
  vehicleName: string
  manufacturingYear: number
  registrationNumber: string
  packageName: string
  dailyRate: number
  totalRentalPrice: number
  tokenAmount: number
  remainingBalance: number
  depositAmount: number
  assignmentId: string | null
  assignmentStart: Date | null
  startingOdometer: number | null
  endingOdometer: number | null
}

export async function getRiderRentals(riderId: string): Promise<RentalSummary[]> {
  const rows = await db
    .select({
      booking: schema.bookings,
      snapshot: schema.bookingPriceSnapshots,
      vehicle: schema.vehicles,
      pkg: schema.rentalPackages,
      assignment: schema.vehicleAssignments,
    })
    .from(schema.bookings)
    .innerJoin(schema.bookingPriceSnapshots, eq(schema.bookingPriceSnapshots.bookingId, schema.bookings.id))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .innerJoin(schema.rentalPackages, eq(schema.rentalPackages.id, schema.bookings.packageId))
    .leftJoin(schema.vehicleAssignments, and(
      eq(schema.vehicleAssignments.bookingId, schema.bookings.id),
      eq(schema.vehicleAssignments.status, 'ACTIVE'),
    ))
    .where(eq(schema.bookings.riderId, riderId))
    .orderBy(desc(schema.bookings.createdAt))

  const payments = await db.select({ bookingId: schema.payments.bookingId, type: schema.payments.paymentType, amount: schema.payments.amount })
    .from(schema.payments).where(eq(schema.payments.paymentStatus, 'SUCCESS'))
  const paymentTotals = new Map<string, number>()
  const extensionTotals = new Map<string, number>()
  for (const payment of payments) {
    if (payment.type === 'RENTAL_BALANCE') paymentTotals.set(payment.bookingId, (paymentTotals.get(payment.bookingId) ?? 0) + Number(payment.amount))
    if (payment.type === 'EXTENSION') extensionTotals.set(payment.bookingId, (extensionTotals.get(payment.bookingId) ?? 0) + Number(payment.amount))
  }  const depositRows = await db.select({ bookingId: schema.depositTransactions.bookingId, type: schema.depositTransactions.transactionType, amount: schema.depositTransactions.amount })
    .from(schema.depositTransactions)
  const depositBalances = new Map<string, number>()
  for (const row of depositRows) {
    const change = row.type === 'RECEIVED' ? Number(row.amount) : -Number(row.amount)
    depositBalances.set(row.bookingId, (depositBalances.get(row.bookingId) ?? 0) + change)
  }
  return rows.map(({ booking, snapshot, vehicle, pkg, assignment }) => ({
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.bookingStatus,
    startDate: booking.startDate,
    endDate: booking.endDate,
    durationDays: booking.totalDurationDays,
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.manufacturer} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''}`,
    registrationPreview: `${vehicle.registrationNumber.slice(0, 2)} ••• ••• ${vehicle.registrationNumber.slice(-2)}`,
    registrationNumber: vehicle.registrationNumber,
    manufacturingYear: vehicle.manufacturingYear,
    fuelType: vehicle.fuelType,
    vehicleCategory: vehicle.vehicleCategory,
    packageName: pkg.name,
    dailyRate: Number(snapshot.dailyRate),
    totalRentalPrice: Number(snapshot.totalRentalPrice) + (extensionTotals.get(booking.id) ?? 0),
    tokenAmount: Number(snapshot.bookingTokenAmount),
    remainingBalance: Math.max(0, Number(snapshot.remainingRentalBalance) - (paymentTotals.get(booking.id) ?? 0)),
    depositAmount: depositBalances.get(booking.id) ?? 0,
    assignmentId: assignment?.id ?? null,
    assignmentStart: assignment?.assignmentStart ?? null,
    startingOdometer: assignment?.startingOdometer ?? null,
    endingOdometer: assignment?.endingOdometer ?? null,
  }))
}

export async function getAvailableRentalOptions() {
  const rows = await db
    .select({ vehicle: schema.vehicles, pricing: schema.vehiclePricing, pkg: schema.rentalPackages })
    .from(schema.vehicles)
    .innerJoin(schema.vehiclePricing, eq(schema.vehiclePricing.vehicleId, schema.vehicles.id))
    .innerJoin(schema.rentalPackages, eq(schema.rentalPackages.id, schema.vehiclePricing.packageId))
    .where(and(
      eq(schema.vehicles.operationalStatus, 'AVAILABLE'),
      eq(schema.vehicles.complianceStatus, 'VERIFIED_COMPLIANT'),
      eq(schema.vehicles.isDeleted, false),
      eq(schema.vehiclePricing.isActive, true),
      eq(schema.rentalPackages.isActive, true),
    ))

  return rows.map(({ vehicle, pricing, pkg }) => ({
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.manufacturer} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''}`,
    registrationPreview: `${vehicle.registrationNumber.slice(0, 2)} ••• ••• ${vehicle.registrationNumber.slice(-2)}`,
    manufacturingYear: vehicle.manufacturingYear,
    fuelType: vehicle.fuelType,
    vehicleCategory: vehicle.vehicleCategory,
    packageId: pkg.id,
    packageName: pkg.name,
    packageCode: pkg.code,
    durationDays: pkg.durationDays,
    dailyRate: Number(pricing.dailyRate),
    totalRentalPrice: Number(pricing.packageTotalRate),
    tokenAmount: Number(pricing.bookingTokenAmount),
    depositAmount: Number(pricing.securityDepositAmount),
  }))
}

export async function createRentalRequest(input: {
  riderId: string
  vehicleId: string
  packageId: string
  startDate: string
}) {
  return db.transaction(async (tx) => {
    const [rider] = await tx.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.id, input.riderId)).for('update').limit(1)
    if (!rider || rider.accountStatus !== 'ACTIVE' || rider.verificationStatus !== 'VERIFIED') {
      throw new Error('Your rider profile must be active and verified before requesting a rental.')
    }

    const [vehicle] = await tx.select().from(schema.vehicles).where(and(
      eq(schema.vehicles.id, input.vehicleId),
      eq(schema.vehicles.operationalStatus, 'AVAILABLE'),
      eq(schema.vehicles.complianceStatus, 'VERIFIED_COMPLIANT'),
      eq(schema.vehicles.isDeleted, false),
    )).for('update').limit(1)
    if (!vehicle) throw new Error('This vehicle is no longer available to rent.')

    const [pricing] = await tx.select({ pricing: schema.vehiclePricing, pkg: schema.rentalPackages })
      .from(schema.vehiclePricing)
      .innerJoin(schema.rentalPackages, eq(schema.rentalPackages.id, schema.vehiclePricing.packageId))
      .where(and(
        eq(schema.vehiclePricing.vehicleId, input.vehicleId),
        eq(schema.vehiclePricing.packageId, input.packageId),
        eq(schema.vehiclePricing.isActive, true),
        eq(schema.rentalPackages.isActive, true),
      )).limit(1)
    if (!pricing) throw new Error('That rental package is not available for this vehicle.')

    const start = new Date(`${input.startDate}T00:00:00.000Z`)
    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    if (Number.isNaN(start.getTime()) || start < today) throw new Error('Choose today or a future start date.')
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + pricing.pkg.durationDays - 1)
    const startDate = start.toISOString().slice(0, 10)
    const endDate = end.toISOString().slice(0, 10)

    const conflicts = await tx.select({ id: schema.bookings.id }).from(schema.bookings).where(and(
      inArray(schema.bookings.bookingStatus, [...openStatuses]),
      or(eq(schema.bookings.riderId, input.riderId), eq(schema.bookings.vehicleId, input.vehicleId)),
      lte(schema.bookings.startDate, endDate),
      gte(schema.bookings.endDate, startDate),
    )).limit(1)
    if (conflicts.length) throw new Error('This rider or vehicle already has a booking during those dates.')

    const [booking] = await tx.insert(schema.bookings).values({
      bookingNumber: `RR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      riderId: input.riderId,
      vehicleId: input.vehicleId,
      packageId: input.packageId,
      startDate,
      endDate,
      totalDurationDays: pricing.pkg.durationDays,
      bookingStatus: 'PENDING',
    }).returning()

    const total = Number(pricing.pricing.packageTotalRate)
    await tx.insert(schema.bookingPriceSnapshots).values({
      bookingId: booking.id,
      packageCode: pricing.pkg.code,
      durationDays: pricing.pkg.durationDays,
      dailyRate: pricing.pricing.dailyRate,
      totalRentalPrice: pricing.pricing.packageTotalRate,
      bookingTokenAmount: pricing.pricing.bookingTokenAmount,
      remainingRentalBalance: String(Math.max(0, total - Number(pricing.pricing.bookingTokenAmount))),
      securityDepositAmount: pricing.pricing.securityDepositAmount,
      kmLimitTotal: pricing.pricing.kmLimitPerDay * pricing.pkg.durationDays,
      extraKmCharge: pricing.pricing.extraKmCharge,
    })
    return { bookingId: booking.id, bookingNumber: booking.bookingNumber }
  })
}

export async function getAdminBookingQueue() {
  const rows = await db.select({ booking: schema.bookings, rider: schema.riderProfiles, vehicle: schema.vehicles, pkg: schema.rentalPackages, snapshot: schema.bookingPriceSnapshots })
    .from(schema.bookings)
    .innerJoin(schema.riderProfiles, eq(schema.riderProfiles.id, schema.bookings.riderId))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bookings.vehicleId))
    .innerJoin(schema.rentalPackages, eq(schema.rentalPackages.id, schema.bookings.packageId))
    .leftJoin(schema.bookingPriceSnapshots, eq(schema.bookingPriceSnapshots.bookingId, schema.bookings.id))
    .orderBy(desc(schema.bookings.createdAt))
  const payments = await db.select({ bookingId: schema.payments.bookingId, type: schema.payments.paymentType, amount: schema.payments.amount })
    .from(schema.payments).where(eq(schema.payments.paymentStatus, 'SUCCESS'))
  const paidByBooking = new Map<string, Record<string, number>>()
  for (const payment of payments) {
    const summary = paidByBooking.get(payment.bookingId) ?? {}
    summary[payment.type] = (summary[payment.type] ?? 0) + Number(payment.amount)
    paidByBooking.set(payment.bookingId, summary)
  }
  const depositRows = await db.select({ bookingId: schema.depositTransactions.bookingId, type: schema.depositTransactions.transactionType, amount: schema.depositTransactions.amount })
    .from(schema.depositTransactions)
  const depositBalances = new Map<string, number>()
  for (const row of depositRows) {
    const change = row.type === 'RECEIVED' ? Number(row.amount) : -Number(row.amount)
    depositBalances.set(row.bookingId, (depositBalances.get(row.bookingId) ?? 0) + change)
  }
  return rows.map(({ booking, rider, vehicle, pkg, snapshot }) => ({
    id: booking.id, bookingNumber: booking.bookingNumber, status: booking.bookingStatus,
    startDate: booking.startDate, endDate: booking.endDate, durationDays: booking.totalDurationDays,
    riderId: rider.id, riderName: rider.fullName, riderPhone: rider.phone, riderStatus: rider.verificationStatus,
    vehicleId: vehicle.id, vehicleName: `${vehicle.manufacturer} ${vehicle.model}`, registrationNumber: vehicle.registrationNumber,
    vehicleStatus: vehicle.operationalStatus, packageName: pkg.name,
    total: Number(snapshot?.totalRentalPrice ?? 0), token: Number(snapshot?.bookingTokenAmount ?? 0),
    deposit: Number(snapshot?.securityDepositAmount ?? 0),
    depositBalance: depositBalances.get(booking.id) ?? 0,
    paid: paidByBooking.get(booking.id) ?? {},
  }))
}

export async function updateBookingStatus(bookingId: string, adminId: string, decision: 'CONFIRMED' | 'CANCELLED') {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId)).for('update').limit(1)
    if (!booking || booking.bookingStatus !== 'PENDING') throw new Error('Only pending booking requests can be reviewed.')
    if (decision === 'CONFIRMED') {
      const [rider] = await tx.select().from(schema.riderProfiles).where(eq(schema.riderProfiles.id, booking.riderId)).limit(1)
      if (!rider || rider.accountStatus !== 'ACTIVE' || rider.verificationStatus !== 'VERIFIED') {
        throw new Error('The rider must still have an active, verified profile to confirm this booking.')
      }
      const [vehicle] = await tx.select().from(schema.vehicles).where(eq(schema.vehicles.id, booking.vehicleId)).limit(1)
      if (!vehicle || vehicle.operationalStatus !== 'AVAILABLE' || vehicle.complianceStatus !== 'VERIFIED_COMPLIANT') {
        throw new Error('The vehicle is no longer compliant and available for this booking.')
      }
      const conflicts = await tx.select({ id: schema.bookings.id }).from(schema.bookings).where(and(
        ne(schema.bookings.id, bookingId), inArray(schema.bookings.bookingStatus, [...openStatuses]),
        or(eq(schema.bookings.riderId, booking.riderId), eq(schema.bookings.vehicleId, booking.vehicleId)),
        lte(schema.bookings.startDate, booking.endDate), gte(schema.bookings.endDate, booking.startDate),
      )).limit(1)
      if (conflicts.length) throw new Error('A conflicting rider or vehicle booking has already been confirmed.')
    }
    await tx.update(schema.bookings).set({
      bookingStatus: decision,
      cancellationReason: decision === 'CANCELLED' ? 'Declined by operations' : null,
      cancelledBy: decision === 'CANCELLED' ? adminId : null,
      cancelledAt: decision === 'CANCELLED' ? new Date() : null,
      approvedBy: decision === 'CONFIRMED' ? adminId : null,
      approvedAt: decision === 'CONFIRMED' ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(schema.bookings.id, bookingId))
  })
}

export async function recordBookingPayment(input: {
  bookingId: string
  adminId: string
  type: 'BOOKING_TOKEN' | 'RENTAL_BALANCE' | 'SECURITY_DEPOSIT' | 'EXTENSION'
  method: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD'
  reference?: string
}) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings).where(eq(schema.bookings.id, input.bookingId)).for('update').limit(1)
    if (!booking || !['CONFIRMED', 'ACTIVE'].includes(booking.bookingStatus)) throw new Error('Payments can only be recorded for a confirmed booking.')
    const [snapshot] = await tx.select().from(schema.bookingPriceSnapshots).where(eq(schema.bookingPriceSnapshots.bookingId, input.bookingId)).limit(1)
    if (!snapshot) throw new Error('The booking has no frozen price snapshot.')
    const [approvedExtension] = input.type === 'EXTENSION'
      ? await tx.select().from(schema.bookingExtensions).where(and(
        eq(schema.bookingExtensions.bookingId, input.bookingId),
        eq(schema.bookingExtensions.status, 'APPROVED_AWAITING_PAYMENT'),
      )).for('update').limit(1)
      : []
    if (input.type === 'EXTENSION' && !approvedExtension) throw new Error('There is no approved extension awaiting payment.')
    const expected = input.type === 'BOOKING_TOKEN'
      ? Number(snapshot.bookingTokenAmount)
      : input.type === 'RENTAL_BALANCE'
        ? Number(snapshot.remainingRentalBalance)
        : input.type === 'SECURITY_DEPOSIT' ? Number(snapshot.securityDepositAmount) : Number(approvedExtension?.additionalRentalAmount ?? 0)
    if (input.type !== 'EXTENSION') {
      const alreadyPaid = await tx.select({ id: schema.payments.id }).from(schema.payments).where(and(
        eq(schema.payments.bookingId, input.bookingId), eq(schema.payments.paymentType, input.type), eq(schema.payments.paymentStatus, 'SUCCESS'),
      )).limit(1)
      if (alreadyPaid.length) throw new Error(`${input.type.replaceAll('_', ' ')} has already been recorded.`)
    }    if (expected <= 0) throw new Error('There is no amount due for this payment type.')
    const [payment] = await tx.insert(schema.payments).values({
      paymentNumber: `PAY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      bookingId: input.bookingId,
      riderId: booking.riderId,
      amount: String(expected),
      paymentType: input.type,
      paymentMethod: input.method,
      transactionReference: input.reference || null,
      paymentStatus: 'SUCCESS',
      paidAt: new Date(),
      recordedBy: input.adminId,
      notes: 'Recorded by operations as received',
    }).returning()
    await tx.insert(schema.paymentAllocations).values({
      paymentId: payment.id,
      allocationType: input.type === 'SECURITY_DEPOSIT' ? 'SECURITY_DEPOSIT_LIABILITY' : 'RENTAL_REVENUE',
      amount: String(expected),
    })
    if (input.type === 'EXTENSION' && approvedExtension) {
      await tx.update(schema.bookingExtensions).set({ status: 'PAID', paymentId: payment.id }).where(eq(schema.bookingExtensions.id, approvedExtension.id))
      await tx.update(schema.bookings).set({
        endDate: approvedExtension.newEndDate,
        totalDurationDays: booking.totalDurationDays + approvedExtension.additionalDays,
        updatedAt: new Date(),
      }).where(eq(schema.bookings.id, booking.id))
    }
    if (input.type === 'SECURITY_DEPOSIT') await tx.insert(schema.depositTransactions).values({
      bookingId: input.bookingId,
      riderId: booking.riderId,
      transactionType: 'RECEIVED',
      amount: String(expected),
      runningBalance: String(expected),
      paymentId: payment.id,
      settlementNotes: 'Refundable deposit received; held as a liability',
      recordedBy: input.adminId,
    })
  })
}

export async function startConfirmedRental(input: { bookingId: string; adminId: string; startingOdometer: number }) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings).where(eq(schema.bookings.id, input.bookingId)).for('update').limit(1)
    if (!booking || booking.bookingStatus !== 'CONFIRMED') throw new Error('Only confirmed bookings can be handed over.')
    const [vehicle] = await tx.select().from(schema.vehicles).where(eq(schema.vehicles.id, booking.vehicleId)).for('update').limit(1)
    if (!vehicle || vehicle.operationalStatus !== 'AVAILABLE' || vehicle.complianceStatus !== 'VERIFIED_COMPLIANT') throw new Error('The vehicle must be compliant and available for handover.')
    if (input.startingOdometer < vehicle.currentOdometer) throw new Error('Handover odometer cannot be below the vehicle’s current odometer.')
    const payments = await tx.select({ type: schema.payments.paymentType }).from(schema.payments).where(and(
      eq(schema.payments.bookingId, booking.id), eq(schema.payments.paymentStatus, 'SUCCESS'),
    ))
    const [snapshot] = await tx.select().from(schema.bookingPriceSnapshots).where(eq(schema.bookingPriceSnapshots.bookingId, booking.id)).limit(1)
    if (!snapshot) throw new Error('The booking has no frozen price snapshot.')
    const requiredPayments = ['BOOKING_TOKEN', 'SECURITY_DEPOSIT', ...(Number(snapshot.remainingRentalBalance) > 0 ? ['RENTAL_BALANCE'] : [])]
    for (const type of requiredPayments) {
      if (!payments.some((payment) => payment.type === type)) throw new Error(`Record the ${type.replaceAll('_', ' ').toLowerCase()} before handover.`)
    }
    const [assignment] = await tx.insert(schema.vehicleAssignments).values({
      bookingId: booking.id,
      riderId: booking.riderId,
      vehicleId: booking.vehicleId,
      startingOdometer: input.startingOdometer,
      assignmentReason: 'INITIAL_ASSIGNMENT',
      status: 'ACTIVE',
    }).returning()
    await tx.update(schema.bookings).set({ bookingStatus: 'ACTIVE', updatedAt: new Date() }).where(eq(schema.bookings.id, booking.id))
    await tx.update(schema.vehicles).set({ operationalStatus: 'RENTED', currentOdometer: input.startingOdometer, updatedAt: new Date() }).where(eq(schema.vehicles.id, vehicle.id))
    const [inspection] = await tx.insert(schema.vehicleInspections).values({
      inspectionNumber: `INSP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      vehicleId: vehicle.id,
      assignmentId: assignment.id,
      inspectionType: 'HANDOVER',
      odometerReading: input.startingOdometer,
      fuelPercentage: 100,
      inspectorId: input.adminId,
      damagesNoted: 'Handover condition recorded by operations',
    }).returning()
    await tx.update(schema.vehicleAssignments).set({ handoverInspectionId: inspection.id }).where(eq(schema.vehicleAssignments.id, assignment.id))
  })
}

export async function completeRentalReturn(input: {
  bookingId: string; adminId: string; endingOdometer: number; fuelPercentage: number; damagesNoted?: string
}) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings).where(eq(schema.bookings.id, input.bookingId)).for('update').limit(1)
    if (!booking || !['ACTIVE', 'OVERDUE'].includes(booking.bookingStatus)) throw new Error('Only active rentals can be returned.')
    const [assignment] = await tx.select().from(schema.vehicleAssignments).where(and(
      eq(schema.vehicleAssignments.bookingId, booking.id), eq(schema.vehicleAssignments.status, 'ACTIVE'),
    )).for('update').limit(1)
    if (!assignment || input.endingOdometer < assignment.startingOdometer) throw new Error('Enter a valid return odometer at or above the handover reading.')
    const [vehicle] = await tx.select().from(schema.vehicles).where(eq(schema.vehicles.id, assignment.vehicleId)).for('update').limit(1)
    if (!vehicle) throw new Error('Assigned vehicle could not be found.')
    const [inspection] = await tx.insert(schema.vehicleInspections).values({
      inspectionNumber: `INSP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      vehicleId: vehicle.id,
      assignmentId: assignment.id,
      inspectionType: 'RETURN',
      odometerReading: input.endingOdometer,
      fuelPercentage: input.fuelPercentage,
      damagesNoted: input.damagesNoted || null,
      inspectorId: input.adminId,
    }).returning()
    await tx.update(schema.vehicleAssignments).set({ status: 'CLOSED', endingOdometer: input.endingOdometer, assignmentEnd: new Date(), returnInspectionId: inspection.id, updatedAt: new Date() }).where(eq(schema.vehicleAssignments.id, assignment.id))
    await tx.update(schema.bookings).set({ bookingStatus: 'COMPLETED', updatedAt: new Date() }).where(eq(schema.bookings.id, booking.id))
    await tx.update(schema.rentalReturnRequests).set({ status: 'COMPLETED', updatedAt: new Date() }).where(and(eq(schema.rentalReturnRequests.bookingId, booking.id), inArray(schema.rentalReturnRequests.status, ['REQUESTED', 'CONFIRMED'])))
    const nextStatus = vehicle.complianceStatus === 'VERIFIED_COMPLIANT' ? 'AVAILABLE' : 'UNAVAILABLE'
    await tx.update(schema.vehicles).set({ operationalStatus: nextStatus, currentOdometer: input.endingOdometer, updatedAt: new Date() }).where(eq(schema.vehicles.id, vehicle.id))
    await tx.insert(schema.vehicleStatusHistory).values({ vehicleId: vehicle.id, fromStatus: vehicle.operationalStatus, toStatus: nextStatus, reason: 'Rental return inspection completed', changedBy: input.adminId })
  })
}

export async function settleSecurityDeposit(input: {
  bookingId: string
  adminId: string
  refundAmount: number
  damageDeduction: number
  penaltyDeduction: number
  refundMethod: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD'
  notes: string
}) {
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(schema.bookings).where(eq(schema.bookings.id, input.bookingId)).for('update').limit(1)
    if (!booking || booking.bookingStatus !== 'COMPLETED') throw new Error('Deposit settlement is available after a rental is completed.')
    const transactions = await tx.select().from(schema.depositTransactions).where(eq(schema.depositTransactions.bookingId, booking.id))
    const balance = transactions.reduce((total, row) => total + (row.transactionType === 'RECEIVED' ? Number(row.amount) : -Number(row.amount)), 0)
    const disposition = input.refundAmount + input.damageDeduction + input.penaltyDeduction
    if (balance <= 0) throw new Error('There is no refundable deposit balance remaining.')
    if (disposition <= 0 || disposition > balance) throw new Error('Refund and deductions must settle a positive amount up to the remaining deposit balance.')
    if ((input.damageDeduction > 0 || input.penaltyDeduction > 0) && input.notes.trim().length < 5) throw new Error('Add a clear reason for the deposit deduction.')

    let runningBalance = balance
    const addTransaction = async (transactionType: 'FORFEITED_DAMAGE' | 'FORFEITED_PENALTY' | 'REFUNDED', amount: number) => {
      if (amount <= 0) return
      runningBalance = Math.round((runningBalance - amount) * 100) / 100
      await tx.insert(schema.depositTransactions).values({
        bookingId: booking.id,
        riderId: booking.riderId,
        transactionType,
        amount: String(amount),
        runningBalance: String(runningBalance),
        settlementNotes: input.notes.trim() || 'Deposit refunded after return inspection',
        recordedBy: input.adminId,
      })
    }
    await addTransaction('FORFEITED_DAMAGE', input.damageDeduction)
    await addTransaction('FORFEITED_PENALTY', input.penaltyDeduction)
    if (input.refundAmount > 0) {
      const [refund] = await tx.insert(schema.refunds).values({
        refundNumber: `REF-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        bookingId: booking.id,
        riderId: booking.riderId,
        amount: String(input.refundAmount),
        refundReason: input.notes.trim() || 'Security deposit settlement',
        refundMethod: input.refundMethod,
        status: 'COMPLETED',
        processedBy: input.adminId,
        processedAt: new Date(),
      }).returning()
      const [payment] = await tx.insert(schema.payments).values({
        paymentNumber: `PAY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        bookingId: booking.id,
        riderId: booking.riderId,
        amount: String(input.refundAmount),
        paymentType: 'REFUND',
        paymentMethod: input.refundMethod,
        paymentStatus: 'SUCCESS',
        paidAt: new Date(),
        recordedBy: input.adminId,
        notes: `Deposit refund ${refund.refundNumber}`,
      }).returning()
      await tx.update(schema.refunds).set({ paymentId: payment.id }).where(eq(schema.refunds.id, refund.id))
      await addTransaction('REFUNDED', input.refundAmount)
    }
  })
}









