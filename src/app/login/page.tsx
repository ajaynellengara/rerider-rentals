'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bike, Building, ShieldCheck } from 'lucide-react'
import { loginAction, type BookingActionState } from '@/features/bookings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [state, action, pending] = useActionState<BookingActionState, FormData>(loginAction, { success: false })
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
    <div className="w-full max-w-md space-y-5">
      <header className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fc8019] text-xl font-black text-[#282c3f]">RR</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Sign in to ReRider Rentals</h1>
        <p className="mt-1 text-sm text-slate-500">Kochi fleet and rider portal</p>
      </header>
      <Card>
        <CardHeader><CardTitle>Account sign in</CardTitle><CardDescription>Use the email and password provided for your account.</CardDescription></CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="username" required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
            {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
            <Button type="submit" disabled={pending} className="w-full">{pending ? 'Signing in…' : 'Sign in'}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 rounded-lg border bg-white p-3"><Building className="h-4 w-4 text-slate-500" /> Admin console</div>
        <div className="flex items-center gap-2 rounded-lg border bg-white p-3"><Bike className="h-4 w-4 text-slate-500" /> Rider portal</div>
      </div>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Rental requests require verified rider details and operations approval.</p>
      <p className="text-center text-sm text-slate-600">New to ReRider? <Link href="/register" className="font-semibold text-orange-700 hover:underline">Create a rider account</Link></p>
      <p className="text-center text-sm"><Link href="/" className="text-slate-600 hover:text-slate-900">← Back to home</Link></p>
    </div>
  </main>
}

