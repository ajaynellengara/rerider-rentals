import { NextRequest, NextResponse } from 'next/server';
import { handleSheetMutation, verifySheetsWebhookSignature, SheetMutationInput } from '@/services/sheets-sync';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-sheets-signature') || request.headers.get('x-signature');

    // Security Gate: Verify HMAC signature
    if (!verifySheetsWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        {
          error: 'Unauthorized webhook request: missing or invalid HMAC signature.',
        },
        { status: 401 }
      );
    }

    let payload: SheetMutationInput;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload received from Google Sheet.' },
        { status: 400 }
      );
    }

    if (!payload.bookingNumber) {
      return NextResponse.json(
        { error: 'Invalid payload: bookingNumber is required.' },
        { status: 400 }
      );
    }

    const result = await handleSheetMutation(payload);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal webhook processing error';
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'active',
      service: 'ReRider Rentals Google Sheets Webhook Receiver',
      documentation: 'Send POST requests with HMAC-SHA256 signature in x-sheets-signature header.',
    },
    { status: 200 }
  );
}
