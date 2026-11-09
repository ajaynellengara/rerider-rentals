'use client';

import React, { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleDetailAggregate } from '@/services/vehicles';
import { updateVehicleAction, ActionState } from '@/features/vehicles/actions';

interface VehicleEditFormProps {
  vehicle: VehicleDetailAggregate['vehicle'];
}

export function VehicleEditForm({ vehicle }: VehicleEditFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateVehicleAction.bind(null, vehicle.id),
    { success: false }
  );

  useEffect(() => {
    if (state.success) {
      router.push(`/admin/vehicles/${vehicle.id}`);
    }
  }, [state, router, vehicle.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/vehicles/${vehicle.id}`}
          className="inline-flex items-center text-xs font-medium text-[#686b78] hover:text-[#282c3f] transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Command Center
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#282c3f]">
          Edit Vehicle Details
        </h1>
        <p className="text-xs text-[#686b78] mt-0.5 font-mono">
          {vehicle.registrationNumber} • {vehicle.manufacturer} {vehicle.model}
        </p>
      </div>

      {state.error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">Update Failed</div>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      <form action={formAction}>
        <Card className="border-[#e9e9eb]">
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>
              Update odometer, model specifications, and compliance review notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Read-Only Asset Identifiers */}
            <div className="grid grid-cols-2 gap-4 rounded-[8px] bg-[#f1f1f6]/60 p-3 text-xs">
              <div>
                <span className="text-[#686b78]">Registration Number</span>
                <div className="font-mono font-bold text-sm text-[#282c3f] mt-0.5">
                  {vehicle.registrationNumber}
                </div>
              </div>
              <div>
                <span className="text-[#686b78]">Chassis / VIN</span>
                <div className="font-mono font-bold text-xs text-[#282c3f] mt-0.5">
                  {vehicle.chassisNumber}
                </div>
              </div>
              <div>
                <span className="text-[#686b78]">Engine Number</span>
                <div className="font-mono font-bold text-xs text-[#282c3f] mt-0.5">
                  {vehicle.engineNumber}
                </div>
              </div>
              <div>
                <span className="text-[#686b78]">Acquisition Cost</span>
                <div className="font-bold text-xs text-[#282c3f] mt-0.5">
                  ₹{vehicle.purchaseCost.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  defaultValue={vehicle.manufacturer}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  defaultValue={vehicle.model}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="variant">Variant / Trim</Label>
                <Input
                  id="variant"
                  name="variant"
                  defaultValue={vehicle.variant || ''}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="manufacturingYear">Manufacturing Year</Label>
                <Input
                  id="manufacturingYear"
                  name="manufacturingYear"
                  type="number"
                  defaultValue={vehicle.manufacturingYear}
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="currentOdometer">Current Odometer Reading (km)</Label>
                <Input
                  id="currentOdometer"
                  name="currentOdometer"
                  type="number"
                  min="0"
                  defaultValue={vehicle.currentOdometer}
                  required
                  className="mt-1.5"
                />
                <p className="text-[11px] text-[#686b78] mt-1">
                  Update with verified odometer reading after rides or servicing
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="complianceStatus">Kerala MVD Compliance Status</Label>
                <select
                  id="complianceStatus"
                  name="complianceStatus"
                  defaultValue={vehicle.complianceStatus}
                  className="mt-1.5 flex h-10 w-full rounded-[8px] border border-[#e9e9eb] bg-white px-3 py-2 text-sm text-[#282c3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8019]"
                >
                  <option value="PENDING_REVIEW">PENDING_REVIEW — Awaiting Review</option>
                  <option value="VERIFIED_COMPLIANT">VERIFIED_COMPLIANT — Approved</option>
                  <option value="RESTRICTED_USE">RESTRICTED_USE — Restricted</option>
                  <option value="EXPIRED_DOCS">EXPIRED_DOCS — Expired Documents</option>
                  <option value="NON_COMPLIANT">NON_COMPLIANT — Non Compliant</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="complianceNotes">Compliance Notes</Label>
                <textarea
                  id="complianceNotes"
                  name="complianceNotes"
                  rows={3}
                  defaultValue={vehicle.complianceNotes || ''}
                  className="mt-1.5 flex w-full rounded-[8px] border border-[#e9e9eb] bg-white p-3 text-sm text-[#282c3f] placeholder:text-[#93959f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8019]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between border-t border-[#e9e9eb]">
              <Link href={`/admin/vehicles/${vehicle.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
