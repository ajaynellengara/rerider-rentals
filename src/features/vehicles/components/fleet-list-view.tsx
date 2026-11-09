'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bike,
  Search,
  Plus,
  Gauge,
  IndianRupee,
  ShieldCheck,
  Wrench,
  AlertOctagon,
  ArrowRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VehicleListItem, VehicleOperationalStatus } from '@/services/vehicles';

interface FleetListViewProps {
  initialVehicles: VehicleListItem[];
}

const statusLanes: Array<{ label: string; value: string; countKey?: VehicleOperationalStatus }> = [
  { label: 'All Fleet', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE', countKey: 'AVAILABLE' },
  { label: 'Rented', value: 'RENTED', countKey: 'RENTED' },
  { label: 'Maintenance', value: 'MAINTENANCE', countKey: 'MAINTENANCE' },
  { label: 'Accident Hold', value: 'ACCIDENT', countKey: 'ACCIDENT' },
  { label: 'Reserved', value: 'RESERVED', countKey: 'RESERVED' },
  { label: 'Retired', value: 'RETIRED', countKey: 'RETIRED' },
];

export function FleetListView({ initialVehicles }: FleetListViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const counts = useMemo(() => {
    const total = initialVehicles.length;
    const available = initialVehicles.filter((v) => v.operationalStatus === 'AVAILABLE').length;
    const rented = initialVehicles.filter((v) => v.operationalStatus === 'RENTED').length;
    const maintenance = initialVehicles.filter((v) => v.operationalStatus === 'MAINTENANCE').length;
    const accident = initialVehicles.filter((v) => v.operationalStatus === 'ACCIDENT').length;
    const inShop = maintenance + accident;
    return { total, available, rented, inShop, maintenance, accident };
  }, [initialVehicles]);

  const filteredVehicles = useMemo(() => {
    return initialVehicles.filter((v) => {
      const matchesStatus =
        selectedStatus === 'ALL' || v.operationalStatus === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.manufacturer.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.variant && v.variant.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [initialVehicles, selectedStatus, searchQuery]);

  const getStatusBadge = (status: VehicleOperationalStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="available">● Available for Rental</Badge>;
      case 'RENTED':
        return <Badge variant="rented">● Active Rental</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="maintenance">● In Workshop / Service</Badge>;
      case 'ACCIDENT':
        return <Badge variant="accident">● Accident Hold</Badge>;
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
      {/* Header and Add Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#282c3f]">
            Fleet Operations Console
          </h1>
          <p className="text-sm text-[#686b78] mt-0.5">
            Kochi Hub • Operational asset tracking, rate cards, and compliance status
          </p>
        </div>
        <Link href="/admin/vehicles/new">
          <Button className="h-11 px-5 shadow-sm">
            <Plus className="mr-2 h-4 w-4 stroke-[2.5]" />
            Onboard New Vehicle
          </Button>
        </Link>
      </div>

      {/* Operational Metric Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Fleet */}
        <Card className="border-[#e9e9eb]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#686b78]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Fleet</span>
              <Bike className="h-4 w-4 text-[#fc8019]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#282c3f]">{counts.total}</div>
            <p className="text-[11px] text-[#686b78] mt-0.5">Commercial 2-wheelers</p>
          </CardContent>
        </Card>

        {/* Available */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-semibold uppercase tracking-wider">Ready to Rent</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-950">{counts.available}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Inspected & Available</p>
          </CardContent>
        </Card>

        {/* Rented */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-blue-800">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Rentals</span>
              <Bike className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-950">{counts.rented}</div>
            <p className="text-[11px] text-blue-700 mt-0.5">On road with riders</p>
          </CardContent>
        </Card>

        {/* In-Shop / Holds */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-semibold uppercase tracking-wider">In Workshop</span>
              <Wrench className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-950">{counts.inShop}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Service & Safety holds</p>
          </CardContent>
        </Card>
      </div>

      {/* Swiggy-Style Horizontal Category Filter Lanes */}
      <div className="relative border-b border-[#e9e9eb] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {statusLanes.map((lane) => {
            const isSelected = selectedStatus === lane.value;
            return (
              <button
                key={lane.value}
                onClick={() => setSelectedStatus(lane.value)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all select-none min-h-[44px] cursor-pointer ${
                  isSelected
                    ? 'bg-[#282c3f] text-white shadow-sm'
                    : 'bg-white text-[#686b78] border border-[#e9e9eb] hover:bg-[#f1f1f6] hover:text-[#282c3f]'
                }`}
              >
                <span>{lane.label}</span>
                {lane.countKey && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#f1f1f6] text-[#686b78]'
                    }`}
                  >
                    {counts[lane.countKey.toLowerCase() as keyof typeof counts] || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686b78]" />
        <Input
          placeholder="Search by registration (e.g. KL-00-AA-0000), model, or manufacturer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-10 pr-4 rounded-[8px] border-[#e9e9eb] bg-white text-sm placeholder:text-[#93959f] focus-visible:ring-[#fc8019]"
        />
      </div>

      {/* Vehicle Cards Grid */}
      {filteredVehicles.length === 0 ? (
        <Card className="border-dashed border-[#e9e9eb] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f1f6] text-[#686b78]">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#282c3f]">No vehicles match your criteria</h3>
          <p className="mt-1 text-xs text-[#686b78]">
            Try adjusting your search terms or status filter.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((v) => (
            <Card
              key={v.id}
              className="group flex flex-col justify-between overflow-hidden border-[#e9e9eb] bg-white transition-all hover:border-[#fc8019]/50 hover:shadow-md"
            >
              <div className="p-5">
                {/* Top Row: Reg Badge & Status */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-black tracking-wider text-[#282c3f] bg-[#f1f1f6] px-2.5 py-1 rounded-[6px] border border-[#e9e9eb]">
                    {v.registrationNumber}
                  </span>
                  {getStatusBadge(v.operationalStatus)}
                </div>

                {/* Vehicle Model & Specs */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-[#282c3f] group-hover:text-[#fc8019] transition-colors">
                    {v.manufacturer} {v.model}
                  </h3>
                  <p className="text-xs text-[#686b78] mt-0.5">
                    {v.variant || 'Standard'} • {v.manufacturingYear} • {v.fuelType}
                  </p>
                </div>

                {/* Key Metrics: Odometer & Compliance */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-[8px] bg-[#f1f1f6]/60 p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-[#282c3f]">
                    <Gauge className="h-3.5 w-3.5 text-[#686b78]" />
                    <span className="font-medium">{v.currentOdometer.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {v.complianceStatus === 'VERIFIED_COMPLIANT'
                        ? 'MVD Verified'
                        : 'Pending Review'}
                    </span>
                  </div>
                </div>

                {/* Pricing Terms Strip */}
                <div className="mt-4 border-t border-[#e9e9eb] pt-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#686b78]">14-Day Package:</span>
                      <div className="text-sm font-extrabold text-[#282c3f]">
                        ₹{v.dailyRate14d || 450}
                        <span className="text-xs font-normal text-[#686b78]"> / day</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#686b78] block">Deposit & Token</span>
                      <span className="text-xs font-semibold text-[#282c3f]">
                        ₹1k token + ₹4k dep
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center border-t border-[#e9e9eb] bg-slate-50/50 p-3">
                <Link href={`/admin/vehicles/${v.id}`} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full h-9 gap-1.5"
                  >
                    <span>Command Center</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/vehicles/${v.id}/edit`} className="ml-2">
                  <Button variant="outline" size="sm" className="h-9 px-3">
                    Edit
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

