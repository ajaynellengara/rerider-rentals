import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import {
  verifySheetsWebhookSignature,
  appendBookingToSheet,
  handleSheetMutation,
} from '@/services/sheets-sync';
import { GET, POST } from '@/app/api/webhooks/sheets/route';
import { NextRequest } from 'next/server';

describe('Google Sheets Integration — Security & Sync Engine', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SHEETS_WEBHOOK_SECRET = 'test-secret-at-least-32-characters-long-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('HMAC Webhook Cryptographic Verification', () => {
    it('verifies valid HMAC-SHA256 signatures accurately', () => {
      const payload = JSON.stringify({ bookingNumber: 'RR-20261112-TEST', action: 'APPROVE' });
      const validSignature = crypto
        .createHmac('sha256', process.env.SHEETS_WEBHOOK_SECRET!)
        .update(payload)
        .digest('hex');

      expect(verifySheetsWebhookSignature(payload, validSignature)).toBe(true);
    });

    it('rejects tampered payloads', () => {
      const payload = JSON.stringify({ bookingNumber: 'RR-20261112-TEST', action: 'APPROVE' });
      const tamperedPayload = JSON.stringify({ bookingNumber: 'RR-20261112-TEST', action: 'DECLINE' });
      const signature = crypto
        .createHmac('sha256', process.env.SHEETS_WEBHOOK_SECRET!)
        .update(payload)
        .digest('hex');

      expect(verifySheetsWebhookSignature(tamperedPayload, signature)).toBe(false);
    });

    it('rejects invalid or mismatched signatures', () => {
      const payload = JSON.stringify({ bookingNumber: 'RR-20261112-TEST' });
      expect(verifySheetsWebhookSignature(payload, 'deadbeef1234567890abcdef')).toBe(false);
    });

    it('rejects requests when signature or secret is missing', () => {
      const payload = JSON.stringify({ bookingNumber: 'RR-20261112-TEST' });
      expect(verifySheetsWebhookSignature(payload, null)).toBe(false);
      expect(verifySheetsWebhookSignature(payload, '')).toBe(false);

      delete process.env.SHEETS_WEBHOOK_SECRET;
      expect(verifySheetsWebhookSignature(payload, 'any-signature')).toBe(false);
    });
  });

  describe('Outbound Google Sheets Sync', () => {
    it('handles unconfigured web app URL gracefully without crashing', async () => {
      delete process.env.GOOGLE_SHEETS_WEBAPP_URL;

      const result = await appendBookingToSheet({
        bookingId: 'test-uuid',
        bookingNumber: 'RR-TEST-001',
        riderName: 'Test Rider',
        phone: '+91 98470 12345',
        packageName: '14-Day Package',
        dates: '2026-11-12 (14d)',
        totalRent: 6300,
        tokenAmount: 1000,
        depositAmount: 4000,
        status: 'PENDING',
      });

      expect(result.sent).toBe(false);
      expect(result.reason).toContain('not configured');
    });
  });

  describe('Inbound Sheet Mutation Processor', () => {
    it('rejects mutations with missing booking number', async () => {
      const result = await handleSheetMutation({
        bookingNumber: '',
        action: 'APPROVE',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing bookingNumber');
    });

    it('handles non-existent or unreachable booking gracefully', async () => {
      const result = await handleSheetMutation({
        bookingNumber: 'RR-NONEXISTENT-99999',
        action: 'APPROVE',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Next.js API Route (/api/webhooks/sheets)', () => {
    it('returns 200 with service information on GET', async () => {
      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('active');
      expect(data.service).toContain('Google Sheets');
    });

    it('returns 401 when POST request has no signature', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhooks/sheets', {
        method: 'POST',
        body: JSON.stringify({ bookingNumber: 'RR-TEST' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('returns 401 when POST request has invalid signature', async () => {
      const body = JSON.stringify({ bookingNumber: 'RR-TEST' });
      const req = new NextRequest('http://localhost:3000/api/webhooks/sheets', {
        method: 'POST',
        headers: {
          'x-sheets-signature': 'invalid-signature-value',
        },
        body,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when body is invalid JSON', async () => {
      const rawBody = '{ bad json';
      const signature = crypto
        .createHmac('sha256', process.env.SHEETS_WEBHOOK_SECRET!)
        .update(rawBody)
        .digest('hex');

      const req = new NextRequest('http://localhost:3000/api/webhooks/sheets', {
        method: 'POST',
        headers: {
          'x-sheets-signature': signature,
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid JSON');
    });
  });
});
