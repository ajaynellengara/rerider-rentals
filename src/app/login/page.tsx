'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bike, Building, ShieldCheck, Zap } from 'lucide-react'
import { loginAction, type BookingActionState } from '@/features/bookings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [state, action, pending] = useActionState<BookingActionState, FormData>(loginAction, { success: false })

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-5">
        <header className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fc8019] text-xl font-black text-[#282c3f]">
            RR
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Sign in to ReRider Rentals</h1>
          <p className="mt-1 text-sm text-slate-500">Kochi fleet and rider portal</p>
        </header>

        {/* 1-Click Developer Quick Access & Login Bypass */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Developer Quick Access
            </span>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              1-Click Bypass Ready
            </span>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed">
            Directly enter any portal without entering passwords:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="/api/dev/login?role=rider"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-[0.98]"
            >
              <Bike className="h-4 w-4" />
              <span>Enter Rider Portal</span>
            </a>
            <a
              href="/api/dev/login?role=admin"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition active:scale-[0.98]"
            >
              <Building className="h-4 w-4" />
              <span>Enter Admin Console</span>
            </a>
          </div>
          <div className="text-[11px] text-blue-900/80 pt-2 border-t border-blue-200/60 space-y-0.5 font-mono">
            <p><strong>Live Sheet Rider:</strong> demo.aarav@example.test / password123</p>
            <p><strong>Test Admin:</strong> admin@rerider.com / password123</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account sign in</CardTitle>
            <CardDescription>Use your email and password, or test credentials above.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue="demo.aarav@example.test"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="password123"
                  autoComplete="current-password"
                  required
                />
              </div>
              {state.error && (
                <p role="alert" className="text-sm text-red-700">
                  {state.error}
                </p>
              )}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? 'Signing in…' : 'Sign in'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Rental requests require verified rider details and operations approval.
        </p>
        <p className="text-center text-sm text-slate-600">
          New to ReRider?{' '}
          <Link href="/register" className="font-semibold text-orange-700 hover:underline">
            Create a rider account
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
