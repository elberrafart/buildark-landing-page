import { NextRequest, NextResponse } from 'next/server'
import { getBookingById, updateBooking, getEventTypeById } from '@/lib/store'
import { deleteZohoEvent } from '@/lib/zoho'
import { getTokens } from '@/lib/token-store'
import { sendCancellationEmails } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { token } = body
  if (!token) {
    return NextResponse.json({ error: 'Missing cancellation token' }, { status: 400 })
  }

  const booking = await getBookingById(id)
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.cancellation_token !== token) {
    return NextResponse.json({ error: 'Invalid cancellation token' }, { status: 403 })
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
  }

  const cancelled = await updateBooking(id, { status: 'cancelled' })
  if (!cancelled) {
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }

  const eventType = await getEventTypeById(booking.event_type_id)

  // Try to delete Zoho event (non-blocking)
  if (booking.zoho_event_id) {
    try {
      const tokens = await getTokens()
      if (tokens?.calendar_id) {
        await deleteZohoEvent(tokens.calendar_id, booking.zoho_event_id)
      }
    } catch (err) {
      console.error('[api/cancel] Zoho event deletion failed (continuing):', err)
    }
  }

  // Try to send cancellation emails (non-blocking)
  if (eventType) {
    try {
      await sendCancellationEmails(cancelled, eventType)
    } catch (err) {
      console.error('[api/cancel] Cancellation emails failed (continuing):', err)
    }
  }

  return NextResponse.json({ success: true, booking: cancelled })
}
