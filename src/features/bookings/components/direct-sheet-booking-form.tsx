'use client';

import React, { useActionState, useState } from 'react';
import { submitDirectSheetBookingAction, DirectBookingState } from '@/features/bookings/actions';
import { Button } from '@/components/ui/button';
import { Bike, Calendar, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { INITIAL_FLEET_VEHICLE } from '@/lib/config/fleet';

export function DirectSheetBookingForm() {
  const [state, formAction, pending] = useActionState<DirectBookingState, FormData>(
    submitDirectSheetBookingAction,
    { success: false }
  );

  const [selectedPackage, setSelectedPackage] = useState(INITIAL_FLEET_VEHICLE.packages[0].code);
  const pkg = INITIAL_FLEET_VEHICLE.packages.find((p) => p.code === selectedPackage) || INITIAL_FLEET_VEHICLE.packages[0];

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);

  const returnDate = new Date(`${startDate}T00:00:00.000Z`);
  returnDate.setUTCDate(returnDate.getUTCDate() + pkg.durationDays - 1);
  const returnDateLabel = Number.isNaN(returnDate.getTime())
    ? 'Select start date'
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(returnDate);

  if (state.success && state.bookingNumber) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-slate-900 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Request Sent to Owner</h3>
            <p className="text-xs text-slate-600 font-mono">Reference: <strong className="text-emerald-800">{state.bookingNumber}</strong></p>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          Your booking request has been added directly to the owner&apos;s operations Google Sheet. You can also send a direct confirmation on WhatsApp to secure your scooter right away.
        </p>

        <div className="rounded-xl border border-emerald-200 bg-white p-4 text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Vehicle</span>
            <strong className="text-slate-900">{INITIAL_FLEET_VEHICLE.name} ({INITIAL_FLEET_VEHICLE.registrationNumber})</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Rental Package</span>
            <strong className="text-slate-900">{pkg.name} ({pkg.durationDays} days)</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Advance Token Due</span>
            <strong className="text-orange-600">₹{pkg.bookingTokenAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Refundable Deposit</span>
            <strong className="text-blue-700">₹{pkg.securityDepositAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {state.whatsappUrl && (
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md transition"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Confirm on WhatsApp with Owner</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{INITIAL_FLEET_VEHICLE.name}</h3>
            <p className="text-xs text-slate-500">{INITIAL_FLEET_VEHICLE.registrationNumber} • {INITIAL_FLEET_VEHICLE.hubLocation}</p>
          </div>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
          Available
        </span>
      </div>

      {state.error && (
        <div className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      {/* Package Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Rental Package</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INITIAL_FLEET_VEHICLE.packages.map((p) => {
            const isSelected = p.code === selectedPackage;
            return (
              <label
                key={p.code}
                onClick={() => setSelectedPackage(p.code)}
                className={`cursor-pointer rounded-xl border p-4 text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#fc8019] bg-orange-50/40 shadow-xs ring-1 ring-[#fc8019]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{p.durationDays} Days Duration</p>
                  </div>
                  <input
                    type="radio"
                    name="packageCode"
                    value={p.code}
                    checked={isSelected}
                    onChange={() => setSelectedPackage(p.code)}
                    className="accent-orange-600"
                  />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium">₹{p.dailyRate} / day</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{p.totalRentalPrice.toLocaleString('en-IN')}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Pricing Breakdown Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
        <div>
          <span className="text-slate-500">Duration</span>
          <p className="font-bold text-slate-900">{pkg.durationDays} Days</p>
        </div>
        <div>
          <span className="text-slate-500">Rental Total</span>
          <p className="font-bold text-slate-900">₹{pkg.totalRentalPrice.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-slate-500">Advance Token</span>
          <p className="font-bold text-orange-600">₹{pkg.bookingTokenAmount.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-slate-500">Refundable Deposit</span>
          <p className="font-bold text-blue-700">₹{pkg.securityDepositAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Rider Information Inputs */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-700">Full Name *</label>
          <input
            name="riderName"
            type="text"
            required
            placeholder="e.g. Rahul Varma"
            className="mt-1 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Mobile / WhatsApp Number *</label>
            <input
              name="phone"
              type="tel"
              required
              placeholder="e.g. 9847012345"
              className="mt-1 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Driving Licence Number (Optional)</label>
            <input
              name="dlNumber"
              type="text"
              placeholder="e.g. KL0720210001234"
              className="mt-1 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Preferred Start Date *</label>
            <input
              name="startDate"
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700">Expected Return Date</span>
            <div className="mt-1 flex h-11 items-center rounded-lg bg-slate-50 px-3 text-sm font-bold text-slate-900 border border-slate-200">
              <Calendar className="mr-2 h-4 w-4 text-slate-500" />
              {returnDateLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-12 rounded-xl bg-[#fc8019] text-[#282c3f] hover:bg-[#e07014] font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          {pending ? (
            <span>Sending to Operations Sheet...</span>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Request Rental (Send to Google Sheet)</span>
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Submitting adds your request to the operations queue. No advance payment is taken online.
        </p>
      </div>
    </form>
  );
}
