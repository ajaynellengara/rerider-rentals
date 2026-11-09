import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { hasRole, canAccessAdmin, canAccessRider, canModifyFinancials } from '@/lib/auth/roles';
import { signSessionToken, verifySessionToken, type AuthSessionPayload } from '@/lib/auth/jwt';
import { formatINR, formatKolkataDate } from '@/lib/utils';
import { checkDatabaseConnection } from '@/lib/db';

describe('Stage 1: Authentication & Password Security', () => {
  it('hashes and verifies passwords reliably with bcrypt', async () => {
    const password = 'SuperSecurePassword@2026';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});

describe('Stage 1: Role-Based Access Control (RBAC)', () => {
  it('enforces SUPER_ADMIN full access hierarchy', () => {
    expect(hasRole('SUPER_ADMIN', ['ADMIN'])).toBe(true);
    expect(canAccessAdmin('SUPER_ADMIN')).toBe(true);
    expect(canModifyFinancials('SUPER_ADMIN')).toBe(true);
  });

  it('correctly permits ADMIN and restricts RIDER from admin functions', () => {
    expect(canAccessAdmin('ADMIN')).toBe(true);
    expect(canAccessAdmin('STAFF')).toBe(true);
    expect(canAccessAdmin('RIDER')).toBe(false);

    expect(canAccessRider('RIDER')).toBe(true);
    expect(canAccessRider('ADMIN')).toBe(false);

    expect(canModifyFinancials('ADMIN')).toBe(true);
    expect(canModifyFinancials('STAFF')).toBe(false);
    expect(canModifyFinancials('RIDER')).toBe(false);
  });
});

describe('Stage 1: JWT Session Security (jose)', () => {
  it('generates and cryptographically verifies session tokens', async () => {
    const mockPayload: AuthSessionPayload = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@rideops.kochi',
      name: 'Operations Manager',
      role: 'ADMIN',
    };

    const token = await signSessionToken(mockPayload);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3); // Valid JWT structure

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(mockPayload.userId);
    expect(decoded?.email).toBe(mockPayload.email);
    expect(decoded?.role).toBe(mockPayload.role);
  });

  it('rejects tampered JWT tokens', async () => {
    const validToken = await signSessionToken({
      userId: '123',
      email: 'test@example.com',
      name: 'Test',
      role: 'RIDER',
    });

    const tamperedToken = validToken.slice(0, -6) + 'abc123';
    const decoded = await verifySessionToken(tamperedToken);
    expect(decoded).toBeNull();
  });
});

describe('Stage 1: Currency & Timezone Formatters', () => {
  it('formats Indian Rupee (INR) currency correctly', () => {
    expect(formatINR(6300)).toContain('6,300');
    expect(formatINR(4000)).toContain('4,000');
    expect(formatINR(0)).toContain('0.00');
    expect(formatINR(null)).toBe('₹0.00');
  });

  it('formats dates in Asia/Kolkata timezone', () => {
    const date = new Date('2026-11-09T16:00:00Z'); // 21:30 IST
    const formatted = formatKolkataDate(date);
    expect(formatted).toBeDefined();
    expect(formatted).not.toBe('-');
  });
});

describe('Stage 1: PostgreSQL Connection Pool Readiness', () => {
  it('reports database client pool status gracefully', async () => {
    const status = await checkDatabaseConnection();
    expect(status).toHaveProperty('connected');
    expect(typeof status.connected).toBe('boolean');
  });
});
