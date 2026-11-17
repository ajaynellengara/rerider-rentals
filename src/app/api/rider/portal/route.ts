import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getRiderPortalData } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const session = await getSession()

  if (!session || session.role !== 'RIDER') {
    return NextResponse.json(
      { error: 'Unauthorized. An active rider session is required.' },
      { status: 401 }
    )
  }

  try {
    const portalData = await getRiderPortalData(session.email)

    if (!portalData) {
      return NextResponse.json(
        {
          error: `Rider profile with email '${session.email}' was not found in the operations Google Sheet.`,
          sessionEmail: session.email,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: portalData,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err) {
    console.error('[API /api/rider/portal] Error fetching data:', err)
    return NextResponse.json(
      { error: 'Failed to retrieve rider operations data.' },
      { status: 500 }
    )
  }
}
