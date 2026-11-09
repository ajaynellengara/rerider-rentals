import React from 'react';
import Link from 'next/link';
import {
  Bike,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
  Layers,
  MapPin,
  Calendar,
  IndianRupee,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md">
              RO
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">RideOps</span>
              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                Kochi Fleet
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Admin Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16 text-center md:py-24">
          <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700 shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <span>Kochi, Ernakulam, Kerala • Single-Owner Commercial Scooter Operations</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Commercial Fleet Management & <span className="text-blue-600">Rental Operations</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 md:text-lg">
            Purpose-built vehicle rental operations platform. Engineered for immutable financial ledgers,
            decoupled vehicle replacement workflows, verified rider KYC, and Kerala MVD compliance.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/admin">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-semibold gap-2 shadow-md">
                <span>Enter Admin Console</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/rider">
              <Button size="lg" variant="outline" className="font-semibold gap-2 border-slate-300">
                <Bike className="h-4 w-4 text-blue-600" />
                <span>Rider Self-Service Portal</span>
              </Button>
            </Link>
          </div>

          {/* Core Architectural Pillars */}
          <div className="mt-16 grid gap-6 text-left md:grid-cols-3">
            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Immutable Ledger Accounting
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Booking tokens (₹1,000) are recognized into rent, while security deposits (₹4,000) are
                  strictly segregated as balance-sheet liabilities. Zero commingling.
                </p>
                <Badge variant="success" className="text-[10px]">
                  Audit Triggers Active
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Decoupled Vehicle Assignments
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bookings represent customer contracts, while assignments represent physical assets.
                  Breakdowns swap vehicles seamlessly without modifying booking pricing.
                </p>
                <Badge variant="info" className="text-[10px]">
                  No Overlap Constraint
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Kerala Regulatory Safety Gate
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Prevents auto-approval of unverified vehicles or riders. Requires explicit verification of
                  commercial permits, insurance endorsements, and Driving Licences.
                </p>
                <Badge variant="purple" className="text-[10px]">
                  Rent-a-Motorcycle Gate
                </Badge>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row text-xs text-slate-500">
          <div>
            © 2026 RideOps. Single-Owner Commercial Fleet Operations • Kochi, Kerala.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              Stage 1 Initialized
            </span>
            <span>•</span>
            <span>Next.js 15 App Router</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
