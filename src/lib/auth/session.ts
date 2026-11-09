import { cookies } from 'next/headers';
import { verifySessionToken, signSessionToken, type AuthSessionPayload } from './jwt';
import { canAccessAdmin, canAccessRider } from './roles';

export const SESSION_COOKIE_NAME = 'rideops_session';

/**
 * Get current authenticated session from cookies in Server Components or Actions
 */
export async function getSession(): Promise<AuthSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Set session cookie upon successful login
 */
export async function setSessionCookie(payload: AuthSessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

/**
 * Clear session cookie upon logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Server guard: requires an active authenticated session
 */
export async function requireAuth(): Promise<AuthSessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }
  return session;
}

/**
 * Server guard: requires Admin or Staff privileges
 */
export async function requireAdmin(): Promise<AuthSessionPayload> {
  const session = await requireAuth();
  if (!canAccessAdmin(session.role)) {
    throw new Error('FORBIDDEN: Admin privileges required');
  }
  return session;
}

/**
 * Server guard: requires Rider privileges and returns rider's identity
 */
export async function requireRider(): Promise<AuthSessionPayload> {
  const session = await requireAuth();
  if (!canAccessRider(session.role)) {
    throw new Error('FORBIDDEN: Rider portal privileges required');
  }
  return session;
}
