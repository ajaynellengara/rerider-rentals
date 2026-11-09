import { z } from 'zod';

/**
 * Standard Indian vehicle registration format regex
 * Supports formats like: KL-00-AA-0000, KL07BW1234, KL 07 BW 1234, DL-01-A-0001
 */
export const registrationNumberRegex = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4}$/i;

/**
 * Formats a raw vehicle number into standard hyphenated uppercase string (e.g. KL-00-AA-0000)
 */
export function formatRegistrationNumber(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = cleaned.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/);
  if (!match) return raw.toUpperCase().trim();
  const [, state, district, series, num] = match;
  const paddedDistrict = district.padStart(2, '0');
  return `${state}-${paddedDistrict}-${series}-${num}`;
}

export const vehicleOperationalStatusSchema = z.enum([
  'AVAILABLE',
  'RESERVED',
  'RENTED',
  'MAINTENANCE',
  'ACCIDENT',
  'UNAVAILABLE',
  'RETIRED',
]);

export const vehicleComplianceStatusSchema = z.enum([
  'PENDING_REVIEW',
  'VERIFIED_COMPLIANT',
  'RESTRICTED_USE',
  'EXPIRED_DOCS',
  'NON_COMPLIANT',
]);

export const vehicleDocumentTypeSchema = z.enum([
  'RC',
  'INSURANCE',
  'PUC',
  'ROAD_TAX',
  'FITNESS',
  'PERMIT',
  'OTHER',
]);

export const currentYear = new Date().getFullYear();

/**
 * Schema for vehicle creation (Onboarding Wizard)
 */
export const vehicleCreateSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(5, 'Registration number is required')
    .max(30, 'Registration number too long')
    .regex(
      registrationNumberRegex,
      'Invalid registration format (e.g. KL-00-AA-0000)'
    )
    .transform(formatRegistrationNumber),
  manufacturer: z
    .string()
    .trim()
    .min(2, 'Manufacturer name must be at least 2 characters')
    .max(100),
  model: z
    .string()
    .trim()
    .min(1, 'Vehicle model is required')
    .max(100),
  variant: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),
  manufacturingYear: z
    .coerce
    .number()
    .int('Manufacturing year must be an integer')
    .min(1990, 'Year must be 1990 or later')
    .max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`),
  fuelType: z
    .enum(['PETROL', 'ELECTRIC', 'HYBRID', 'OTHER'])
    .default('PETROL'),
  vehicleCategory: z
    .string()
    .trim()
    .min(2)
    .default('SCOOTER'),
  chassisNumber: z
    .string()
    .trim()
    .min(5, 'Chassis / VIN number must be at least 5 characters')
    .max(100)
    .toUpperCase(),
  engineNumber: z
    .string()
    .trim()
    .min(5, 'Engine number must be at least 5 characters')
    .max(100)
    .toUpperCase(),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Purchase date must be in YYYY-MM-DD format'),
  purchaseCost: z
    .coerce
    .number()
    .positive('Purchase cost must be a positive number'),
  currentOdometer: z
    .coerce
    .number()
    .int('Odometer reading must be an integer')
    .nonnegative('Odometer reading cannot be negative'),
  complianceStatus: vehicleComplianceStatusSchema.default('PENDING_REVIEW'),
  complianceNotes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;

/**
 * Schema for updating vehicle specifications and general fields
 */
export const vehicleUpdateSchema = z.object({
  manufacturer: z.string().trim().min(2).max(100).optional(),
  model: z.string().trim().min(1).max(100).optional(),
  variant: z.string().trim().max(50).optional().nullable(),
  manufacturingYear: z
    .coerce
    .number()
    .int()
    .min(1990)
    .max(currentYear + 1)
    .optional(),
  currentOdometer: z
    .coerce
    .number()
    .int()
    .nonnegative('Odometer cannot be negative')
    .optional(),
  complianceStatus: vehicleComplianceStatusSchema.optional(),
  complianceNotes: z.string().trim().max(1000).optional().nullable(),
});

export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;

/**
 * Schema for updating operational status (with mandatory audit reason)
 */
export const vehicleStatusChangeSchema = z.object({
  operationalStatus: vehicleOperationalStatusSchema,
  reason: z
    .string()
    .trim()
    .min(5, 'Mandatory reason required (minimum 5 characters explaining status change)')
    .max(255, 'Reason cannot exceed 255 characters'),
});

export type VehicleStatusChangeInput = z.infer<typeof vehicleStatusChangeSchema>;

/**
 * Schema for vehicle-specific package pricing
 */
export const vehiclePricingSchema = z.object({
  packageId: z.string().uuid('Valid package ID is required'),
  dailyRate: z
    .coerce
    .number()
    .positive('Daily rental rate must be greater than ₹0'),
  bookingTokenAmount: z
    .coerce
    .number()
    .nonnegative('Booking token amount cannot be negative')
    .default(1000),
  securityDepositAmount: z
    .coerce
    .number()
    .nonnegative('Security deposit cannot be negative')
    .default(4000),
  kmLimitPerDay: z
    .coerce
    .number()
    .int()
    .nonnegative('Daily kilometre limit cannot be negative')
    .default(100),
  extraKmCharge: z
    .coerce
    .number()
    .nonnegative('Extra kilometre charge cannot be negative')
    .default(4.0),
});

export type VehiclePricingInput = z.infer<typeof vehiclePricingSchema>;

/**
 * Schema for vehicle document uploads & compliance verification
 */
export const vehicleDocumentSchema = z
  .object({
    documentType: vehicleDocumentTypeSchema,
    documentNumber: z.string().trim().min(3, 'Document number is required').max(100),
    storageKey: z.string().trim().min(1, 'Document storage key or file is required'),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid From must be YYYY-MM-DD'),
    validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Until must be YYYY-MM-DD'),
    isCommercialPermit: z.boolean().default(false),
    verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']).default('PENDING'),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) => new Date(data.validUntil) >= new Date(data.validFrom),
    {
      message: 'Valid Until date must be on or after Valid From date',
      path: ['validUntil'],
    }
  );

export type VehicleDocumentInput = z.infer<typeof vehicleDocumentSchema>;

/**
 * Schema for vehicle replacement mid-rental workflow
 */
export const vehicleReplacementSchema = z.object({
  bookingId: z.string().uuid('Valid booking ID is required'),
  currentAssignmentId: z.string().uuid('Valid current assignment ID is required'),
  breakdownOdometer: z
    .coerce
    .number()
    .int('Odometer must be an integer')
    .nonnegative('Breakdown odometer cannot be negative'),
  replacementVehicleId: z.string().uuid('Valid replacement vehicle ID is required'),
  reason: z.enum(['MAINTENANCE_REPLACEMENT', 'ACCIDENT_REPLACEMENT']),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type VehicleReplacementInput = z.infer<typeof vehicleReplacementSchema>;

