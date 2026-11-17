import { NextRequest, NextResponse } from 'next/server'
import { signSessionToken } from '@/lib/auth/jwt'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'RIDER'
  const next = searchParams.get('next') || (role === 'ADMIN' ? '/admin' : '/rider')
  const requestedEmail = searchParams.get('email')?.toLowerCase()

  let payload
  if (role === 'ADMIN') {
    payload = {
      userId: 'dev-admin-001',
      email: 'admin@rerider.com',
      name: 'Operations Manager',
      role: 'ADMIN' as const,
    }
  } else if (requestedEmail === 'anandhu.krishna@example.com') {
    payload = {
      userId: 'dev-rider-001',
      email: 'anandhu.krishna@example.com',
      name: 'Anandhu Krishna',
      role: 'RIDER' as const,
      riderProfileId: 'RID-001',
    }
  } else if (requestedEmail === 'demo.diya@example.test') {
    payload = {
      userId: 'dev-rider-002',
      email: 'demo.diya@example.test',
      name: 'DEMO - Diya Menon',
      role: 'RIDER' as const,
      riderProfileId: 'RDR002',
    }
  } else if (requestedEmail === 'demo.kabir@example.test') {
    payload = {
      userId: 'dev-rider-003',
      email: 'demo.kabir@example.test',
      name: 'DEMO - Kabir Thomas',
      role: 'RIDER' as const,
      riderProfileId: 'RDR003',
    }
  } else {
    // Default to the primary live Google Sheet rider (Aarav Nair - Active Honda Dio/Activa rental)
    payload = {
      userId: 'dev-rider-aarav',
      email: requestedEmail || 'demo.aarav@example.test',
      name: 'DEMO - Aarav Nair',
      role: 'RIDER' as const,
      riderProfileId: 'RDR001',
    }
  }

  const token = await signSessionToken(payload)

  const response = NextResponse.redirect(new URL(next, request.url))
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
