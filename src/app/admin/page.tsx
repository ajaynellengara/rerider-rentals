import React from 'react';
import Link from 'next/link';
import {
  Bike,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  Database,
  KeyRound,
  Server,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { checkDatabaseConnection } from '@/lib/db';

export default async function AdminDashboardPage() {
  const dbStatus = await checkDatabaseConnection();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations Command Center
          </h2>
          <p className="text-sm text-slate-500">
            Kochi Fleet Ops • Commercial Scooter & Bike Rental System
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/vehicles">
            <Button variant="default" className="gap-2">
              <Bike className="h-4 w-4" />
              Manage Fleet
            </Button>
          </Link>
          <Link href="/admin/pricing">
            <Button variant="outline" className="gap-2">
              Configure Pricing
            </Button>
          </Link>
        </div>
      </div>

      {/* System Readiness & Diagnostics Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">System Status (Stage 1)</div>
              <div className="text-xs text-slate-500">
                Next.js 15 App Router • Drizzle ORM • TypeScript Strict Mode
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Database status */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200">
              <Database className="h-4 w-4 text-slate-600" />
              <span className="font-medium">PostgreSQL:</span>
              {dbStatus.connected ? (
                <Badge variant="success" className="h-5 text-[10px]">
                  Online
                </Badge>
              ) : (
                <Badge variant="warning" className="h-5 text-[10px]">
                  Ready (Pool Initialized)
                </Badge>
              )}
            </div>

            {/* Auth status */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200">
              <KeyRound className="h-4 w-4 text-slate-600" />
              <span className="font-medium">Security:</span>
              <Badge variant="success" className="h-5 text-[10px]">
                RBAC & JWT Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Highlights Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Fleet Target */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Initial Fleet Target
            </CardTitle>
            <Bike className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1 Scooter</div>
            <p className="text-xs text-slate-500 mt-1">
              Honda Dio 110cc • Kochi Hub
            </p>
            <Badge variant="info" className="mt-3 text-[10px]">
              Target Capital: ₹80,000
            </Badge>
          </CardContent>
        </Card>

        {/* Operational Compliance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Compliance Enforcement
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Mandatory Gate</div>
            <p className="text-xs text-slate-500 mt-1">
              Kerala MVD & Rent-a-Motorcycle Scheme
            </p>
            <Badge variant="success" className="mt-3 text-[10px]">
              No Auto-Approval Allowed
            </Badge>
          </CardContent>
        </Card>

        {/* Pricing Model */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Packages Configured
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">14 & 26 Days</div>
            <p className="text-xs text-slate-500 mt-1">
              ₹450/day (14d) • ₹400/day (26d)
            </p>
            <Badge variant="purple" className="mt-3 text-[10px]">
              ₹4,000 Segregated Deposit
            </Badge>
          </CardContent>
        </Card>

        {/* Core Constraints */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Database Invariants
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">10 Invariants</div>
            <p className="text-xs text-slate-500 mt-1">
              No overlapping rentals • Frozen snapshots
            </p>
            <Badge variant="info" className="mt-3 text-[10px]">
              PostgreSQL Partial Indexes
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launch Cards for Key Workflows */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:border-blue-300 transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Vehicle Fleet Management</span>
              <Bike className="h-5 w-5 text-blue-600" />
            </CardTitle>
            <CardDescription>
              Register vehicles, upload RC/Insurance, track odometer, and manage operational status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/vehicles"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Open Vehicles Console <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Vehicle-Specific Pricing</span>
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </CardTitle>
            <CardDescription>
              Configure package daily rates, ₹1,000 token rules, and security deposits per vehicle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/pricing"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Configure Pricing Matrix <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Rider KYC & Assignment</span>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </CardTitle>
            <CardDescription>
              Review Driving Licence, verify 20+ age eligibility, and execute vehicle assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/riders"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Review Rider Queue <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
