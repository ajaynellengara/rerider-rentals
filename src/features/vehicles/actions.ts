'use server';

import { revalidatePath } from 'next/cache';
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  vehicleStatusChangeSchema,
  vehiclePricingSchema,
  vehicleReplacementSchema,
} from '@/lib/validations/vehicle';
import {
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  upsertVehiclePricing,
  replaceVehicleAssignment,
  VehicleOperationalStatus,
} from '@/services/vehicles';

export type ActionState<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Server Action: Create new vehicle onboarding record
 */
export async function createVehicleAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<{ vehicleId: string }>> {
  const rawData = {
    registrationNumber: formData.get('registrationNumber'),
    manufacturer: formData.get('manufacturer'),
    model: formData.get('model'),
    variant: formData.get('variant') || null,
    manufacturingYear: formData.get('manufacturingYear'),
    fuelType: formData.get('fuelType') || 'PETROL',
    vehicleCategory: formData.get('vehicleCategory') || 'SCOOTER',
    chassisNumber: formData.get('chassisNumber'),
    engineNumber: formData.get('engineNumber'),
    purchaseDate: formData.get('purchaseDate'),
    purchaseCost: formData.get('purchaseCost'),
    currentOdometer: formData.get('currentOdometer') || 0,
    complianceStatus: formData.get('complianceStatus') || 'PENDING_REVIEW',
    complianceNotes: formData.get('complianceNotes') || null,
  };

  const parsed = vehicleCreateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors in the form before submitting',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await createVehicle(parsed.data);
  if (!result.success || !result.vehicleId) {
    return {
      success: false,
      error: result.error || 'Failed to onboard vehicle',
    };
  }

  revalidatePath('/admin/vehicles');
  return {
    success: true,
    data: { vehicleId: result.vehicleId },
  };
}

/**
 * Server Action: Update vehicle specifications & general fields
 */
export async function updateVehicleAction(
  id: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    manufacturer: formData.get('manufacturer') || undefined,
    model: formData.get('model') || undefined,
    variant: formData.get('variant') || null,
    manufacturingYear: formData.get('manufacturingYear') || undefined,
    currentOdometer: formData.get('currentOdometer') !== null ? formData.get('currentOdometer') : undefined,
    complianceStatus: formData.get('complianceStatus') || undefined,
    complianceNotes: formData.get('complianceNotes') || null,
  };

  const parsed = vehicleUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await updateVehicle(id, parsed.data);
  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to update vehicle',
    };
  }

  revalidatePath('/admin/vehicles');
  revalidatePath(`/admin/vehicles/${id}`);
  return { success: true };
}

/**
 * Server Action: Change operational status (AVAILABLE, RENTED, MAINTENANCE, etc.)
 */
export async function updateVehicleStatusAction(
  id: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    operationalStatus: formData.get('operationalStatus'),
    reason: formData.get('reason'),
  };

  const parsed = vehicleStatusChangeSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please provide a valid status and reason (min 5 characters)',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await updateVehicleStatus(
    id,
    parsed.data.operationalStatus as VehicleOperationalStatus,
    parsed.data.reason
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to update vehicle operational status',
    };
  }

  revalidatePath('/admin/vehicles');
  revalidatePath(`/admin/vehicles/${id}`);
  return { success: true };
}

/**
 * Server Action: Configure vehicle-specific package rental pricing
 */
export async function upsertVehiclePricingAction(
  vehicleId: string,
  packageId: string,
  durationDays: number,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    packageId,
    dailyRate: formData.get('dailyRate'),
    bookingTokenAmount: formData.get('bookingTokenAmount'),
    securityDepositAmount: formData.get('securityDepositAmount'),
    kmLimitPerDay: formData.get('kmLimitPerDay'),
    extraKmCharge: formData.get('extraKmCharge'),
  };

  const parsed = vehiclePricingSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid pricing parameters',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await upsertVehiclePricing(
    vehicleId,
    packageId,
    parsed.data,
    durationDays
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to save vehicle pricing',
    };
  }

  revalidatePath(`/admin/vehicles/${vehicleId}`);
  revalidatePath('/admin/vehicles');
  return { success: true };
}

/**
 * Server Action: Execute mid-rental vehicle replacement
 */
export async function replaceVehicleAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    bookingId: formData.get('bookingId'),
    currentAssignmentId: formData.get('currentAssignmentId'),
    breakdownOdometer: formData.get('breakdownOdometer'),
    replacementVehicleId: formData.get('replacementVehicleId'),
    reason: formData.get('reason'),
    notes: formData.get('notes') || null,
  };

  const parsed = vehicleReplacementSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid vehicle replacement parameters',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await replaceVehicleAssignment({
    bookingId: parsed.data.bookingId,
    currentAssignmentId: parsed.data.currentAssignmentId,
    breakdownOdometer: parsed.data.breakdownOdometer,
    replacementVehicleId: parsed.data.replacementVehicleId,
    reason: parsed.data.reason,
    adminNotes: parsed.data.notes || undefined,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to execute vehicle replacement',
    };
  }

  revalidatePath('/admin/vehicles');
  revalidatePath(`/admin/vehicles/${parsed.data.replacementVehicleId}`);
  revalidatePath('/admin/assignments');
  return { success: true, data: result };
}

