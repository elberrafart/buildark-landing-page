import { NextResponse } from 'next/server'
import { getTokens } from '@/lib/token-store'
import { createZohoEvent, listCalendars } from '@/lib/zoho'

export async function GET() {
  const diag: Record<string, unknown> = {}

  // Test getTokens
  let calendarId: string | undefined
  try {
    const tokens = await getTokens()
    diag.hasTokens = !!tokens
    diag.expiresAt = tokens?.expires_at
    diag.isExpired = tokens ? new Date(tokens.expires_at).getTime() < Date.now() : null
    diag.calendarId = tokens?.calendar_id
    calendarId = tokens?.calendar_id
  } catch (err) {
    diag.getTokensError = String(err)
  }

  // Test listCalendars (triggers token refresh if expired)
  try {
    const calendars = await listCalendars()
    diag.calendarsOk = true
    diag.calendarNames = calendars.map(c => c.name)
  } catch (err) {
    diag.listCalendarsError = String(err)
  }

  // Test createZohoEvent
  if (calendarId) {
    try {
      const tomorrow = new Date(Date.now() + 86400000)
      const start = new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString()
      const end = new Date(tomorrow.setHours(14, 30, 0, 0)).toISOString()
      const { eventId } = await createZohoEvent({
        calendarId,
        title: 'Debug Test Event',
        start,
        end,
        description: 'Auto-test from debug endpoint',
        attendeeEmail: 'raz@buildark.dev',
        timezone: 'America/Los_Angeles',
      })
      diag.createEventOk = true
      diag.eventId = eventId
    } catch (err) {
      diag.createEventError = String(err)
    }
  }

  return NextResponse.json(diag)
}
