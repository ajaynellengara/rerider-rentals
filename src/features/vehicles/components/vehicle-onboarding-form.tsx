'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  FileCheck2,
  IndianRupee,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createVehicleAction, ActionState } from '@/features/vehicles/actions';

const steps = [
  { id: 1, name: 'Vehicle Specifications', icon: Bike },
  { id: 2, name: 'Purchase & Odometer', icon: IndianRupee },
  { id: 3, name: 'MVD Compliance', icon: FileCheck2 },
];

export function VehicleOnboardingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [state, formAction, isPending] = useActionState<ActionState<{ vehicleId: string }>, FormData>(
    createVehicleAction,
    { success: false }
  );

  useEffect(() => {
    if (state.success && state.data?.vehicleId) {
      router.push(`/admin/vehicles/${state.data.vehicleId}`);
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button and page title */}
      <div>
        <Link
          href="/admin/vehicles"
          className="inline-flex items-center text-xs font-medium text-[#686b78] hover:text-[#282c3f] transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Fleet Console
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#282c3f]">
          Onboard New Fleet Scooter
        </h1>
        <p className="text-sm text-[#686b78] mt-0.5">
          Step-by-step registration for commercial rental deployment in Kochi
        </p>
      </div>

      {/* 3-Step Stepper Header */}
      <div className="flex items-center justify-between border-b border-[#e9e9eb] bg-white p-4 rounded-[8px] border">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 text-xs font-semibold select-none cursor-pointer ${
                  isActive
                    ? 'text-[#fc8019]'
                    : isDone
                    ? 'text-[#282c3f]'
                    : 'text-[#93959f]'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#fc8019] text-[#282c3f]'
                      : isDone
                      ? 'bg-[#282c3f] text-white'
                      : 'bg-[#f1f1f6] text-[#686b78]'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.name}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className="h-[1px] flex-1 bg-[#e9e9eb] mx-3 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Error Banner */}
      {!state.success && state.error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">Form Submission Error</div>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      {/* Onboarding Form */}
      <form action={formAction}>
        {/* STEP 1: SPECIFICATIONS */}
        <div className={currentStep === 1 ? 'block space-y-4' : 'hidden'}>
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <CardTitle>1. Vehicle Specifications</CardTitle>
              <CardDescription>
                Physical identity and manufacturing details of the scooter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="registrationNumber">
                    Registration Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registrationNumber"
                    name="registrationNumber"
                    placeholder="e.g. KL-00-AA-0000"
                    defaultValue="KL-00-AA-0000"
                    required
                    className="mt-1.5 uppercase font-mono"
                  />
                  {state.fieldErrors?.registrationNumber && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.registrationNumber[0]}
                    </p>
                  )}
                  <p className="text-[11px] text-[#686b78] mt-1">
                    Kerala RTO format (e.g. KL-00-AA-0000)
                  </p>
                </div>

                <div>
                  <Label htmlFor="manufacturer">
                    Manufacturer <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    placeholder="e.g. Honda"
                    defaultValue="Honda"
                    required
                    className="mt-1.5"
                  />
                  {state.fieldErrors?.manufacturer && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.manufacturer[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="model">
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g. Dio"
                    defaultValue="Dio"
                    required
                    className="mt-1.5"
                  />
                  {state.fieldErrors?.model && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.model[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="variant">Variant / Trim</Label>
                  <Input
                    id="variant"
                    name="variant"
                    placeholder="e.g. 110cc Deluxe"
                    defaultValue="110cc Deluxe"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturingYear">
                    Manufacturing Year <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manufacturingYear"
                    name="manufacturingYear"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    defaultValue={2022}
                    required
                    className="mt-1.5"
                  />
                  {state.fieldErrors?.manufacturingYear && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.manufacturingYear[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    defaultValue="PETROL"
                    className="mt-1.5 flex h-10 w-full rounded-[8px] border border-[#e9e9eb] bg-white px-3 py-2 text-sm text-[#282c3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8019]"
                  >
                    <option value="PETROL">Petrol (Gasoline)</option>
                    <option value="ELECTRIC">Electric (EV)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="chassisNumber">
                    Chassis / VIN Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="chassisNumber"
                    name="chassisNumber"
                    placeholder="e.g. DEMO-CHASSIS-000001"
                    defaultValue="DEMO-CHASSIS-000001"
                    required
                    className="mt-1.5 uppercase font-mono"
                  />
                  {state.fieldErrors?.chassisNumber && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.chassisNumber[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="engineNumber">
                    Engine Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="engineNumber"
                    name="engineNumber"
                    placeholder="e.g. DEMO-ENGINE-000001"
                    defaultValue="DEMO-ENGINE-000001"
                    required
                    className="mt-1.5 uppercase font-mono"
                  />
                  {state.fieldErrors?.engineNumber && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.engineNumber[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2"
                >
                  <span>Proceed to Purchase & Odometer</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* STEP 2: FINANCIAL & ODOMETER */}
        <div className={currentStep === 2 ? 'block space-y-4' : 'hidden'}>
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <CardTitle>2. Purchase & Financial Information</CardTitle>
              <CardDescription>
                Asset acquisition cost and starting odometer reading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="purchaseCost">
                    Purchase Cost (₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#686b78]">
                      ₹
                    </span>
                    <Input
                      id="purchaseCost"
                      name="purchaseCost"
                      type="number"
                      step="0.01"
                      min="1"
                      defaultValue="70000.00"
                      required
                      className="pl-7"
                    />
                  </div>
                  {state.fieldErrors?.purchaseCost && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.purchaseCost[0]}
                    </p>
                  )}
                  <p className="text-[11px] text-[#686b78] mt-1">
                    Initial Honda Dio acquisition target: ₹70,000 (of ₹80,000 total capital)
                  </p>
                </div>

                <div>
                  <Label htmlFor="purchaseDate">
                    Purchase Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    defaultValue="2026-01-15"
                    required
                    className="mt-1.5"
                  />
                  {state.fieldErrors?.purchaseDate && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.purchaseDate[0]}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="currentOdometer">
                    Starting Odometer Reading (km) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="currentOdometer"
                    name="currentOdometer"
                    type="number"
                    min="0"
                    defaultValue="14250"
                    required
                    className="mt-1.5"
                  />
                  {state.fieldErrors?.currentOdometer && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {state.fieldErrors.currentOdometer[0]}
                    </p>
                  )}
                  <p className="text-[11px] text-[#686b78] mt-1">
                    Verified odometer reading at time of intake
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Specs</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="gap-2"
                >
                  <span>Proceed to MVD Compliance</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* STEP 3: MVD COMPLIANCE */}
        <div className={currentStep === 3 ? 'block space-y-4' : 'hidden'}>
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <CardTitle>3. Kerala MVD Compliance & Review Gate</CardTitle>
              <CardDescription>
                Regulatory compliance under Kerala Rent-a-Motorcycle Scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compliance Guard Alert */}
              <div className="rounded-[8px] border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <ShieldAlert className="h-4 w-4 text-amber-700" />
                  Kerala MVD Regulatory Verification Rule
                </div>
                <p className="mt-1 leading-relaxed text-amber-900">
                  By default, all onboarding vehicles are marked as{' '}
                  <strong>PENDING_REVIEW</strong>. Under Kerala Motor Vehicles Department rules,
                  commercial rental vehicles require a valid permit endorsement and commercial insurance.
                  Do not certify compliance until documents are physically inspected.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="complianceStatus">Initial Compliance Status</Label>
                  <select
                    id="complianceStatus"
                    name="complianceStatus"
                    defaultValue="PENDING_REVIEW"
                    className="mt-1.5 flex h-10 w-full rounded-[8px] border border-[#e9e9eb] bg-white px-3 py-2 text-sm text-[#282c3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8019]"
                  >
                    <option value="PENDING_REVIEW">
                      PENDING_REVIEW — Awaiting Admin Document Review
                    </option>
                    <option value="VERIFIED_COMPLIANT">
                      VERIFIED_COMPLIANT — Documents Inspected & Approved
                    </option>
                    <option value="RESTRICTED_USE">
                      RESTRICTED_USE — Restricted Commute Only
                    </option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="complianceNotes">Compliance Notes / RTO Endorsement</Label>
                  <textarea
                    id="complianceNotes"
                    name="complianceNotes"
                    rows={3}
                    placeholder="Enter details of Ernakulam RTO commercial permit, RC endorsement, or insurance inspection..."
                    defaultValue="Kerala MVD Rent-a-Motorcycle Scheme compliance verified with commercial endorsement"
                    className="mt-1.5 flex w-full rounded-[8px] border border-[#e9e9eb] bg-white p-3 text-sm text-[#282c3f] placeholder:text-[#93959f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8019]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Financials</span>
                </Button>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-6 shadow-sm gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Onboarding Scooter...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Complete Vehicle Onboarding</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}



