'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import {
  Bike,
  Gauge,
  IndianRupee,
  ShieldCheck,
  FileText,
  Clock,
  Wrench,
  Receipt,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  User,
  ShieldAlert,
  Edit,
  Save,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  VehicleDetailAggregate,
  VehicleOperationalStatus,
  VehiclePricingItem,
} from '@/services/vehicles';
import {
  updateVehicleStatusAction,
  upsertVehiclePricingAction,
  ActionState,
} from '@/features/vehicles/actions';

interface VehicleCommandCenterProps {
  data: VehicleDetailAggregate;
}

const tabs = [
  { id: 'overview', label: 'Overview & Specs', icon: Bike },
  { id: 'pricing', label: 'Rental Pricing Matrix', icon: IndianRupee },
  { id: 'documents', label: 'MVD & Documents', icon: FileText },
  { id: 'rental', label: 'Active Rental & Rider', icon: User },
  { id: 'history', label: 'Status History', icon: Clock },
  { id: 'maintenance', label: 'Maintenance & Safety', icon: Wrench },
  { id: 'expenses', label: 'Expense Ledger', icon: Receipt },
];

export function VehicleCommandCenter({ data }: VehicleCommandCenterProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { vehicle, pricing, documents, statusHistory, activeAssignment, maintenanceHistory, expenseSummary } = data;

  // Status Change Action Hook
  const [statusState, statusAction, isStatusPending] = useActionState<ActionState, FormData>(
    updateVehicleStatusAction.bind(null, vehicle.id),
    { success: false }
  );

  const getStatusBadge = (status: VehicleOperationalStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="available">● Available for Rental</Badge>;
      case 'RENTED':
        return <Badge variant="rented">● Active Rental</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="maintenance">● In Workshop / Service</Badge>;
      case 'ACCIDENT':
        return <Badge variant="accident">● Accident Safety Hold</Badge>;
      case 'RESERVED':
        return <Badge variant="warning">● Reserved for Handover</Badge>;
      case 'RETIRED':
        return <Badge variant="cancelled">● Retired Asset</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/vehicles"
            className="inline-flex items-center text-xs font-medium text-[#686b78] hover:text-[#282c3f] transition-colors mb-2"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Fleet Console
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-[#282c3f]">
              {vehicle.manufacturer} {vehicle.model}
            </h1>
            <span className="font-mono text-base font-bold text-[#282c3f] bg-[#f1f1f6] px-3 py-1 rounded-[6px] border border-[#e9e9eb]">
              {vehicle.registrationNumber}
            </span>
            {getStatusBadge(vehicle.operationalStatus)}
          </div>
          <p className="text-xs text-[#686b78] mt-1">
            {vehicle.variant || 'Standard'} • Year {vehicle.manufacturingYear} • {vehicle.fuelType} • Category {vehicle.vehicleCategory}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Swiggy-Style 7-Tab Navigation Bar */}
      <div className="border-b border-[#e9e9eb] bg-white rounded-t-[8px]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-2 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all select-none min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'border-[#fc8019] text-[#282c3f]'
                    : 'border-transparent text-[#686b78] hover:border-slate-300 hover:text-[#282c3f]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-[#fc8019]' : 'text-[#686b78]'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.id === 'documents' && (
                  <span className="rounded-full bg-[#f1f1f6] px-1.5 py-0.5 text-[10px] text-[#686b78]">
                    {documents.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SPECS */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Specifications Card */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-[#e9e9eb]">
              <CardHeader>
                <CardTitle>Asset Specifications</CardTitle>
                <CardDescription>
                  Registered technical and physical details in Kochi Hub
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Registration No.</span>
                    <div className="mt-1 font-mono font-bold text-sm text-[#282c3f]">
                      {vehicle.registrationNumber}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Brand & Model</span>
                    <div className="mt-1 font-bold text-sm text-[#282c3f]">
                      {vehicle.manufacturer} {vehicle.model}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Variant</span>
                    <div className="mt-1 font-bold text-sm text-[#282c3f]">
                      {vehicle.variant || 'N/A'}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Current Odometer</span>
                    <div className="mt-1 font-bold text-sm text-[#282c3f] flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-[#686b78]" />
                      {vehicle.currentOdometer.toLocaleString()} km
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Purchase Cost</span>
                    <div className="mt-1 font-bold text-sm text-[#282c3f]">
                      ₹{vehicle.purchaseCost.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Purchase Date</span>
                    <div className="mt-1 font-bold text-sm text-[#282c3f]">
                      {vehicle.purchaseDate}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3 sm:col-span-2">
                    <span className="text-[#686b78]">Chassis / VIN Number</span>
                    <div className="mt-1 font-mono font-bold text-xs text-[#282c3f]">
                      {vehicle.chassisNumber}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                    <span className="text-[#686b78]">Engine Number</span>
                    <div className="mt-1 font-mono font-bold text-xs text-[#282c3f]">
                      {vehicle.engineNumber}
                    </div>
                  </div>
                </div>

                {/* Compliance Box */}
                <div className="rounded-[8px] border border-[#e9e9eb] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-[#282c3f]">
                          Kerala MVD Compliance Verification
                        </div>
                        <div className="text-[11px] text-[#686b78]">
                          {vehicle.complianceStatus === 'VERIFIED_COMPLIANT'
                            ? 'Commercial Rent-a-Motorcycle Scheme Endorsed'
                            : 'Pending Documentation Review'}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        vehicle.complianceStatus === 'VERIFIED_COMPLIANT'
                          ? 'available'
                          : 'pending'
                      }
                    >
                      {vehicle.complianceStatus}
                    </Badge>
                  </div>
                  {vehicle.complianceNotes && (
                    <p className="mt-3 text-xs text-[#686b78] bg-[#f1f1f6]/70 p-2.5 rounded-[6px]">
                      {vehicle.complianceNotes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Operational Status Control */}
          <div className="space-y-6">
            <Card className="border-[#e9e9eb]">
              <CardHeader>
                <CardTitle className="text-sm">Change Operational Status</CardTitle>
                <CardDescription>
                  Server-side validated state transition with mandatory audit reason
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={statusAction} className="space-y-4">
                  {statusState.error && (
                    <div className="rounded-[6px] border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                      {statusState.error}
                    </div>
                  )}
                  {statusState.success && (
                    <div className="rounded-[6px] border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
                      Operational status updated successfully!
                    </div>
                  )}

                  <div>
                    <Label htmlFor="operationalStatus">New Operational Status</Label>
                    <select
                      id="operationalStatus"
                      name="operationalStatus"
                      defaultValue={vehicle.operationalStatus}
                      className="mt-1.5 flex h-10 w-full rounded-[8px] border border-[#e9e9eb] bg-white px-3 py-2 text-xs font-semibold text-[#282c3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc8019]"
                    >
                      <option value="AVAILABLE">AVAILABLE — Ready to Rent</option>
                      <option value="RESERVED">RESERVED — On Hold for Booking</option>
                      <option value="RENTED">RENTED — Active on Road</option>
                      <option value="MAINTENANCE">MAINTENANCE — In Workshop / Service</option>
                      <option value="ACCIDENT">ACCIDENT — Accident Safety Hold</option>
                      <option value="RETIRED">RETIRED — Decommissioned Asset</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reason">
                      Transition Reason (Required) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="reason"
                      name="reason"
                      placeholder="e.g. Completed 15k service; released to fleet"
                      required
                      minLength={5}
                      className="mt-1.5 text-xs"
                    />
                    <p className="text-[10px] text-[#686b78] mt-1">
                      Minimum 5 characters for compliance audit log
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isStatusPending}
                    className="w-full h-9 text-xs gap-1.5"
                  >
                    {isStatusPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating Status...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirm Transition</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Summary Pill Card */}
            <Card className="border-[#e9e9eb] bg-slate-50/50">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#686b78]">
                  <span>Total Capital Expended:</span>
                  <span className="font-bold text-[#282c3f]">
                    ₹{expenseSummary.totalLifetimeCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#686b78]">
                  <span>Maintenance Records:</span>
                  <span className="font-bold text-[#282c3f]">
                    {maintenanceHistory.length}
                  </span>
                </div>
                <div className="flex justify-between text-[#686b78]">
                  <span>Active Documents:</span>
                  <span className="font-bold text-[#282c3f]">
                    {documents.length} verified
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: RENTAL PRICING MATRIX */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Vehicle-Specific Rental Rates</CardTitle>
                  <CardDescription>
                    Configure rates per package. Vehicle rates remain independent from other fleet assets.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Snapshot Immutability Protected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-[8px] border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900">
                <strong>Business Rule Invariant:</strong> Existing confirmed bookings retain their
                frozen pricing snapshot in <code>booking_price_snapshots</code>. Updates made here apply only to
                future bookings created for this specific scooter.
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {pricing.map((p) => (
                  <PricingConfigCard
                    key={p.packageId}
                    vehicleId={vehicle.id}
                    pricing={p}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: MVD & DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>MVD Documents & Compliance Certificates</CardTitle>
                  <CardDescription>
                    RC, Commercial Insurance, Pollution (PUC), and Kerala MVD Rent-a-Motorcycle permits
                  </CardDescription>
                </div>
                <Badge variant="available">
                  All Mandatory Documents Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between rounded-[8px] border border-[#e9e9eb] bg-white p-4 transition-all hover:border-slate-300"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="rounded-full bg-[#f1f1f6] px-2.5 py-0.5 text-[11px] font-bold text-[#282c3f]">
                            {doc.documentType}
                          </span>
                          <h4 className="mt-2 text-sm font-bold text-[#282c3f]">
                            {doc.documentNumber}
                          </h4>
                        </div>
                        {doc.isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : doc.isExpiringSoon ? (
                          <Badge variant="warning">Expires in {doc.daysUntilExpiry}d</Badge>
                        ) : (
                          <Badge variant="available">Valid ({doc.daysUntilExpiry}d)</Badge>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#686b78]">
                        <div>
                          <span>Valid From:</span>
                          <div className="font-semibold text-[#282c3f]">{doc.validFrom}</div>
                        </div>
                        <div>
                          <span>Valid Until:</span>
                          <div className="font-semibold text-[#282c3f]">{doc.validUntil}</div>
                        </div>
                      </div>

                      {doc.notes && (
                        <p className="mt-3 text-[11px] text-[#686b78] bg-[#f1f1f6]/60 p-2 rounded-[6px]">
                          {doc.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#e9e9eb] pt-3 text-[11px]">
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {doc.verificationStatus}
                      </span>
                      <span className="font-mono text-[#686b78] truncate max-w-[150px]">
                        {doc.storageKey}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: ACTIVE RENTAL & RIDER */}
      {activeTab === 'rental' && (
        <div className="space-y-6">
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <CardTitle>Active Rental Assignment</CardTitle>
              <CardDescription>
                Physical assignment status and verified rider details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAssignment ? (
                <div className="rounded-[8px] border border-blue-200 bg-blue-50/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="rented">Active Assignment on Road</Badge>
                    <span className="text-xs text-[#686b78]">
                      Assigned: {new Date(activeAssignment.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-[#686b78]">Verified Rider</span>
                      <div className="font-bold text-sm text-[#282c3f] mt-0.5">
                        {activeAssignment.riderName}
                      </div>
                      <div className="text-xs text-[#686b78]">{activeAssignment.riderPhone}</div>
                    </div>
                    <div>
                      <span className="text-xs text-[#686b78]">Handover Odometer</span>
                      <div className="font-bold text-sm text-[#282c3f] mt-0.5">
                        {activeAssignment.startingOdometer.toLocaleString()} km
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-dashed border border-[#e9e9eb] rounded-[8px]">
                  <Bike className="mx-auto h-10 w-10 text-[#686b78]" />
                  <h3 className="mt-3 text-sm font-bold text-[#282c3f]">
                    No Active Rental Assignment
                  </h3>
                  <p className="mt-1 text-xs text-[#686b78]">
                    This scooter is currently{' '}
                    <strong className="text-emerald-700">{vehicle.operationalStatus}</strong> in the
                    Kochi Hub and available for rider allocation.
                  </p>
                  <div className="mt-4">
                    <Link href="/admin/assignments">
                      <Button size="sm" className="gap-2">
                        <span>Assign to Booking</span>
                        <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: STATUS HISTORY TIMELINE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <CardTitle>Operational Status Audit Trail</CardTitle>
              <CardDescription>
                Chronological log of all operational state transitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-[#e9e9eb] ml-4 space-y-6 pb-2">
                {statusHistory.map((h) => (
                  <div key={h.id} className="relative pl-6">
                    {/* Circle Node */}
                    <div className="absolute -left-2 top-0.5 h-4 w-4 rounded-full border-2 border-white bg-[#fc8019] shadow-sm" />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#282c3f]">
                          {h.fromStatus} → {h.toStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#686b78]">
                        {new Date(h.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#686b78] bg-[#f1f1f6]/60 p-2.5 rounded-[6px]">
                      {h.reason}
                    </p>
                    <div className="mt-1 text-[10px] text-[#93959f]">
                      Updated by: {h.changedByName || 'System / Admin'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: MAINTENANCE & SAFETY */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Maintenance & Workshop History</CardTitle>
                  <CardDescription>
                    Periodic oil changes, brake pads, detailing, and safety inspections
                  </CardDescription>
                </div>
                <Link href="/admin/maintenance">
                  <Button variant="outline" size="sm">
                    Log New Service
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceHistory.length === 0 ? (
                <p className="text-xs text-[#686b78] py-4 text-center">
                  No maintenance records logged for this vehicle yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {maintenanceHistory.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-[8px] border border-[#e9e9eb] bg-white p-4 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-[#282c3f]">{m.serviceType}</span>
                          <p className="text-[#686b78] mt-0.5">{m.description}</p>
                        </div>
                        <Badge variant="available">{m.repairStatus}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[#e9e9eb] pt-2 text-[#686b78]">
                        <span>Workshop: {m.workshopName}</span>
                        <span className="font-bold text-[#282c3f]">Cost: ₹{m.totalCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 7: EXPENSE LEDGER */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <Card className="border-[#e9e9eb]">
            <CardHeader>
              <CardTitle>Vehicle Expense Ledger</CardTitle>
              <CardDescription>
                Direct capital investments and operational costs allocated to this vehicle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                  <span className="text-xs text-[#686b78]">Purchase Capital</span>
                  <div className="text-lg font-bold text-[#282c3f] mt-1">
                    ₹{expenseSummary.purchaseCost.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-[8px] bg-[#f1f1f6]/60 p-3">
                  <span className="text-xs text-[#686b78]">Servicing & Repairs</span>
                  <div className="text-lg font-bold text-[#282c3f] mt-1">
                    ₹{expenseSummary.maintenanceCost.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-[8px] bg-orange-50/50 border border-orange-200 p-3 sm:col-span-1 col-span-2">
                  <span className="text-xs font-semibold text-orange-950">
                    Total Lifetime Capital
                  </span>
                  <div className="text-lg font-black text-[#282c3f] mt-1">
                    ₹{expenseSummary.totalLifetimeCost.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Form for updating pricing of an individual package
function PricingConfigCard({
  vehicleId,
  pricing,
}: {
  vehicleId: string;
  pricing: VehiclePricingItem;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    upsertVehiclePricingAction.bind(
      null,
      vehicleId,
      pricing.packageId,
      pricing.durationDays
    ),
    { success: false }
  );

  return (
    <Card className="border-[#e9e9eb] bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#282c3f]">
            {pricing.packageName} ({pricing.durationDays} Days)
          </CardTitle>
          <Badge variant="orange" className="font-mono">
            {pricing.packageCode}
          </Badge>
        </div>
        <CardDescription>
          Daily rate, token deduction, and deposit terms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-[6px] border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-[6px] border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
              Pricing saved successfully!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <Label htmlFor={`dailyRate-${pricing.packageId}`}>Daily Rate (₹)</Label>
              <Input
                id={`dailyRate-${pricing.packageId}`}
                name="dailyRate"
                type="number"
                step="0.01"
                min="1"
                defaultValue={pricing.dailyRate}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`kmLimitPerDay-${pricing.packageId}`}>Daily km Limit</Label>
              <Input
                id={`kmLimitPerDay-${pricing.packageId}`}
                name="kmLimitPerDay"
                type="number"
                min="0"
                defaultValue={pricing.kmLimitPerDay}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`bookingTokenAmount-${pricing.packageId}`}>Booking Token (₹)</Label>
              <Input
                id={`bookingTokenAmount-${pricing.packageId}`}
                name="bookingTokenAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={pricing.bookingTokenAmount}
                required
                className="mt-1"
              />
              <p className="text-[10px] text-[#686b78] mt-0.5">Deducted from rent</p>
            </div>

            <div>
              <Label htmlFor={`securityDepositAmount-${pricing.packageId}`}>
                Deposit Liability (₹)
              </Label>
              <Input
                id={`securityDepositAmount-${pricing.packageId}`}
                name="securityDepositAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={pricing.securityDepositAmount}
                required
                className="mt-1"
              />
              <p className="text-[10px] text-[#686b78] mt-0.5">Segregated liability</p>
            </div>

            <div className="col-span-2">
              <Label htmlFor={`extraKmCharge-${pricing.packageId}`}>
                Extra km Charge (₹/km)
              </Label>
              <Input
                id={`extraKmCharge-${pricing.packageId}`}
                name="extraKmCharge"
                type="number"
                step="0.01"
                min="0"
                defaultValue={pricing.extraKmCharge}
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            variant="outline"
            className="w-full h-9 text-xs gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Rates...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Package Rates</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
