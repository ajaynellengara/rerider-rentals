import { SignJWT, jwtVerify } from 'jose';

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'rideops_dev_secret_jwt_key_secure_32_characters_minimum';
  return new TextEncoder().encode(secret);
}

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'RIDER';
  riderProfileId?: string;
  [key: string]: unknown;
}

export async function signSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}
