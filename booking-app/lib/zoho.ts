import { getTokens, saveTokens } from './token-store'
import { ZohoTokens } from './types'

const ZOHO_API_BASE = 'https://calendar.zoho.com/api/v1'
const ZOHO_TOKEN_ENDPOINT = 'https://accounts.zoho.com/oauth/v2/token'

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

export async function getAccessToken(): Promise<string> {
  const tokens = await getTokens()
  if (!tokens) throw new Error('Zoho not connected')

  const expiresAt = new Date(tokens.expires_at).getTime()
  const fiveMinutes = 5 * 60 * 1000

  if (Date.now() + fiveMinutes >= expiresAt) {
    await refreshToken()
    const refreshed = await getTokens()
    if (!refreshed) throw new Error('Failed to refresh Zoho token')
    return refreshed.access_token
  }

  return tokens.access_token
}

export async function refreshToken(): Promise<void> {
  const tokens = await getTokens()
  if (!tokens) throw new Error('Zoho not connected')

  const params = new URLSearchParams({
    refresh_token: tokens.refresh_token,
    client_id: process.env.ZOHO_CLIENT_ID ?? '',
    client_secret: process.env.ZOHO_CLIENT_SECRET ?? '',
    grant_type: 'refresh_token',
  })

  const res = await fetch(`${ZOHO_TOKEN_ENDPOINT}?${params.toString()}`, {
    method: 'POST',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoho token refresh failed: ${text}`)
  }

  const data = await res.json()

  const updated: ZohoTokens = {
    ...tokens,
    access_token: data.access_token,
    expires_at: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }

  await saveTokens(updated)
}

// ---------------------------------------------------------------------------
// Calendar API calls
// ---------------------------------------------------------------------------

export async function getZohoBusyTimes(
  date: string,
  calendarId: string
): Promise<Array<{ start: string; end: string }>> {
  try {
    const accessToken = await getAccessToken()

    // Build epoch range for the full day
    const startOfDay = new Date(`${date}T00:00:00Z`)
    const endOfDay = new Date(`${date}T23:59:59Z`)
    const startEpoch = Math.floor(startOfDay.getTime() / 1000)
    const endEpoch = Math.floor(endOfDay.getTime() / 1000)

    const url = `${ZOHO_API_BASE}/calendars/${calendarId}/events?range=${startEpoch},${endEpoch}`

    const res = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.error('[zoho] Failed to fetch busy times:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    const events = data.events ?? []

    return events.map((event: { dateandtime?: { start: string; end: string }; start?: string; end?: string }) => ({
      start: event.dateandtime?.start ?? event.start ?? '',
      end: event.dateandtime?.end ?? event.end ?? '',
    })).filter((e: { start: string; end: string }) => e.start && e.end)
  } catch (err) {
    console.error('[zoho] getZohoBusyTimes error:', err)
    return []
  }
}

export async function createZohoEvent(params: {
  calendarId: string
  title: string
  start: string
  end: string
  description: string
  attendeeEmail: string
  timezone: string
}): Promise<{ eventId: string; meetLink?: string }> {
  const accessToken = await getAccessToken()

  // Zoho requires format: 20260405T170000Z (no dashes or colons)
  const toZohoDate = (iso: string) =>
    iso.replace(/\.\d{3}Z$/, 'Z').replace(/-/g, '').replace(/:/g, '')

  const eventData = {
    title: params.title,
    dateandtime: {
      start: toZohoDate(params.start),
      end: toZohoDate(params.end),
      timezone: params.timezone,
    },
    description: params.description,
    attendees: [{ email: params.attendeeEmail }],
  }

  // Zoho Calendar API requires form-encoded body with eventdata as a JSON string
  const formBody = new URLSearchParams()
  formBody.append('eventdata', JSON.stringify(eventData))

  const res = await fetch(`${ZOHO_API_BASE}/calendars/${params.calendarId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoho createEvent failed: ${text}`)
  }

  const data = await res.json()
  console.log('[zoho] createEvent response:', JSON.stringify(data).slice(0, 500))
  const event = data.events?.[0] ?? data
  const eventId = event.uid ?? ''
  // Zoho may return meeting URL under various field names
  const meetLink =
    event.online_meeting?.url ??
    event.online_meeting?.joinUrl ??
    event.onlinemeeting?.url ??
    event.onlinemeeting?.joinUrl ??
    event.meeting_url ??
    undefined

  return { eventId, meetLink }
}

export async function createZohoMeeting(params: {
  title: string
  start: string // ISO8601
  end: string   // ISO8601
  timezone: string
}): Promise<string | undefined> {
  try {
    const accessToken = await getAccessToken()

    // Zoho Meeting API uses epoch milliseconds
    const startMs = new Date(params.start).getTime()
    const endMs = new Date(params.end).getTime()
    const durationMs = endMs - startMs
    const durationMins = Math.round(durationMs / 60000)

    const body = JSON.stringify({
      topic: params.title,
      agenda: params.title,
      duration: durationMins,
      startTime: startMs,
      timezone: params.timezone,
      type: 1, // scheduled meeting
    })

    const res = await fetch('https://meeting.zoho.com/api/v1/sessions.json', {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[zoho] createMeeting failed:', res.status, text.slice(0, 200))
      return undefined
    }

    const data = await res.json()
    console.log('[zoho] createMeeting response:', JSON.stringify(data).slice(0, 300))

    // Extract join URL from response
    const meeting = data.sessions?.[0] ?? data.session ?? data
    return meeting?.joinUrl ?? meeting?.join_url ?? meeting?.meetingKey
      ? `https://meeting.zoho.com/meeting/join/${meeting.meetingKey ?? meeting.id}`
      : undefined
  } catch (err) {
    console.error('[zoho] createZohoMeeting error:', err)
    return undefined
  }
}

export async function deleteZohoEvent(calendarId: string, eventId: string): Promise<void> {
  try {
    const accessToken = await getAccessToken()

    const res = await fetch(`${ZOHO_API_BASE}/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    })

    if (!res.ok) {
      console.error('[zoho] Failed to delete event:', res.status, await res.text())
    }
  } catch (err) {
    console.error('[zoho] deleteZohoEvent error:', err)
  }
}

export async function listCalendars(): Promise<Array<{ id: string; name: string }>> {
  const accessToken = await getAccessToken()

  const res = await fetch(`${ZOHO_API_BASE}/calendars`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoho listCalendars failed: ${text}`)
  }

  const data = await res.json()
  const calendars = data.calendars ?? []

  return calendars.map((c: { uid: string; calendarName: string; name?: string }) => ({
    id: c.uid,
    name: c.calendarName ?? c.name ?? c.uid,
  }))
}

export async function buildZohoAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOHO_CLIENT_ID ?? '',
    scope: 'ZohoCalendar.event.ALL,ZohoCalendar.calendar.READ,ZohoMeeting.meeting.CREATE,ZohoMeeting.meeting.READ',
    redirect_uri: process.env.ZOHO_REDIRECT_URI ?? '',
    access_type: 'offline',
    prompt: 'consent', // forces Zoho to always return a refresh_token
  })
  return `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`
}
