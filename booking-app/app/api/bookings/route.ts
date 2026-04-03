export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createBooking, getEventTypeById, updateBooking } from '@/lib/store'
import { createZohoEvent, createZohoMeeting } from '@/lib/zoho'
import { getTokens } from '@/lib/token-store'
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  let body: {
    eventTypeId?: string
    bookerName?: string
    bookerEmail?: string
    bookerNotes?: string
    startTime?: string
    endTime?: string
    timezone?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { eventTypeId, bookerName, bookerEmail, bookerNotes, startTime, endTime, timezone } = body

  if (!eventTypeId || !bookerName || !bookerEmail || !startTime || !endTime || !timezone) {
    return NextResponse.json(
      { error: 'Missing required fields: eventTypeId, bookerName, bookerEmail, startTime, endTime, timezone' },
      { status: 400 }
    )
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookerEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const eventType = await getEventTypeById(eventTypeId)
  if (!eventType) {
    return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
  }

  if (!eventType.is_active) {
    return NextResponse.json({ error: 'Event type is not active' }, { status: 400 })
  }

  // If event type is Zoho Meeting, use location_details as the meet link
  const meetLinkFromEventType =
    eventType.location_type === 'zoho_meeting' && eventType.location_details
      ? eventType.location_details
      : undefined

  // Create booking in store
  let booking = await createBooking({
    event_type_id: eventTypeId,
    booker_name: bookerName,
    booker_email: bookerEmail,
    booker_notes: bookerNotes,
    start_time: startTime,
    end_time: endTime,
    timezone,
    status: 'confirmed',
    ...(meetLinkFromEventType ? { meet_link: meetLinkFromEventType } : {}),
  })

  // Try to create Zoho Meeting + calendar event (non-blocking)
  try {
    const tokens = await getTokens()
    if (tokens?.calendar_id) {
      // Auto-generate a Zoho Meeting link
      const autoMeetLink = await createZohoMeeting({
        title: `${eventType.name} — ${bookerName}`,
        start: startTime,
        end: endTime,
        timezone,
      })

      const meetLink = autoMeetLink ?? meetLinkFromEventType

      // Update booking with meet link if we got one
      if (meetLink && !booking.meet_link) {
        const withLink = await updateBooking(booking.id, { meet_link: meetLink })
        if (withLink) booking = withLink
      }

      const description = [
        `Booking with ${bookerName} (${bookerEmail})`,
        bookerNotes ? `Notes: ${bookerNotes}` : '',
        meetLink ? `Zoho Meeting: ${meetLink}` : '',
      ].filter(Boolean).join('\n')

      const { eventId: zohoEventId } = await createZohoEvent({
        calendarId: tokens.calendar_id,
        title: `${eventType.name} — ${bookerName}`,
        start: startTime,
        end: endTime,
        description,
        attendeeEmail: bookerEmail,
        timezone,
      })
      if (zohoEventId) {
        const updated = await updateBooking(booking.id, { zoho_event_id: zohoEventId })
        if (updated) booking = updated
      }
    }
  } catch (err) {
    console.error('[api/bookings] Zoho event/meeting creation failed (continuing):', err)
  }

  // Try to send emails (non-blocking)
  try {
    await sendBookingConfirmation(booking, eventType)
    await sendBookingNotification(booking, eventType)
  } catch (err) {
    console.error('[api/bookings] Email send failed (continuing):', err)
  }

  return NextResponse.json(booking, { status: 201 })
}
