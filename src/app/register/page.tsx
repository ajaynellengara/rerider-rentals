import type { Metadata } from 'next'
import Link from 'next/link'
import { Bike } from 'lucide-react'
import RegistrationForm from '@/features/rider/components/registration-form'

export const metadata: Metadata = { title: 'Create a rider account | ReRider Rentals' }

export default function RegisterPage() {
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"><div className="mx-auto max-w-3xl">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fc8019] text-[#282c3f]"><Bike className="h-5 w-5" /></span>ReRider Rentals</Link>
    <div className="mb-6 mt-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">Rider portal</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your account</h1><p className="mt-2 text-sm text-slate-600">Start with your profile. You can browse packages while operations verifies your documents.</p></div>
    <RegistrationForm />
  </div></main>
}
