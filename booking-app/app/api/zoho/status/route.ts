import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/token-store'
import { listCalendars } from '@/lib/zoho'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tokens = await getTokens()

    if (!tokens) {
      return NextResponse.json({ connected: false, calendarId: null, calendars: null })
    }

    // Try to fetch calendars to verify token is valid
    let calendars: Array<{ id: string; name: string }> | null = null
    try {
      calendars = await listCalendars()
    } catch (err) {
      console.error('[zoho/status] Failed to list calendars:', err)
      // Token might be expired or invalid
      return NextResponse.json({ connected: false, calendarId: null, calendars: null })
    }

    return NextResponse.json({
      connected: true,
      calendarId: tokens.calendar_id ?? null,
      calendars,
    })
  } catch (err) {
    console.error('[zoho/status] Error:', err)
    return NextResponse.json({ connected: false, calendarId: null, calendars: null })
  }
}
