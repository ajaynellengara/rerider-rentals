import { fetchTabRecords, SHEET_TABS, SheetRowRecord } from './client'
import { PaymentMethod, PaymentStatus, PaymentType, SheetPayment } from './types'

export function parsePaymentRecord(row: SheetRowRecord): SheetPayment | null {
  const paymentId = row['payment_id'] || row['paymentid'] || row['id']
  const rentalId = row['rental_id'] || row['rentalid']
  const riderId = row['rider_id'] || row['riderid']

  if (!paymentId || !riderId) {
    return null
  }

  let cleanType = (row['payment_type'] || row['type'] || 'RENTAL_CHARGE')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

  if (cleanType === 'BOOKING_TOKEN' || cleanType === 'TOKEN') {
    cleanType = 'TOKEN_ADVANCE'
  } else if (cleanType === 'ADVANCE' || cleanType === 'RENTAL_BALANCE' || cleanType === 'RENT') {
    cleanType = 'RENTAL_CHARGE'
  } else if (cleanType === 'SECURITY_DEPOSIT_REFUND' || cleanType === 'REFUND') {
    cleanType = 'DEPOSIT_REFUND'
  } else if (cleanType === 'DEPOSIT') {
    cleanType = 'SECURITY_DEPOSIT'
  }

  const validTypes: PaymentType[] = [
    'TOKEN_ADVANCE',
    'RENTAL_CHARGE',
    'SECURITY_DEPOSIT',
    'DEPOSIT_REFUND',
    'DAMAGE_DEDUCTION',
    'LATE_FEE',
  ]
  const paymentType: PaymentType = validTypes.includes(cleanType as PaymentType)
    ? (cleanType as PaymentType)
    : 'RENTAL_CHARGE'

  const cleanMethod = (row['payment_method'] || row['method'] || 'UPI')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  const validMethods: PaymentMethod[] = ['UPI', 'BANK_TRANSFER', 'CASH', 'CARD']
  const paymentMethod: PaymentMethod = validMethods.includes(cleanMethod as PaymentMethod)
    ? (cleanMethod as PaymentMethod)
    : 'UPI'

  const rawStatus = (row['payment_status'] || row['status'] || 'SUCCESS').trim().toUpperCase()
  const paymentStatus: PaymentStatus =
    rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS' || rawStatus === 'PAID'
      ? 'SUCCESS'
      : rawStatus === 'REFUNDED'
      ? 'REFUNDED'
      : rawStatus === 'FAILED'
      ? 'FAILED'
      : 'PENDING'

  const amount = parseFloat(row['amount'] || '0')

  return {
    paymentId,
    rentalId: rentalId || '',
    riderId,
    paymentType,
    amount: Number.isNaN(amount) ? 0 : amount,
    paymentDate: row['payment_date'] || row['date'] || new Date().toISOString().slice(0, 10),
    paymentMethod,
    paymentStatus,
    transactionReference: row['transaction_reference'] || row['reference'] || undefined,
    notes: row['notes'] || undefined,
  }
}

export async function getAllPayments(): Promise<{ payments: SheetPayment[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { records, source } = await fetchTabRecords(SHEET_TABS.PAYMENTS)
  const payments = records.map(parsePaymentRecord).filter((p): p is SheetPayment => p !== null)
  return { payments, source }
}

export async function getRiderPayments(
  riderId: string
): Promise<{ payments: SheetPayment[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { payments, source } = await getAllPayments()
  const filtered = payments.filter((p) => p.riderId === riderId)
  return { payments: filtered, source }
}

export async function getRentalPayments(
  rentalId: string
): Promise<{ payments: SheetPayment[]; source: 'GOOGLE_SHEETS' | 'FALLBACK_STORE' }> {
  const { payments, source } = await getAllPayments()
  const filtered = payments.filter((p) => p.rentalId === rentalId)
  return { payments: filtered, source }
}
