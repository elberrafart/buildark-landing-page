import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Booking, EventType } from './types'

// Lazy-initialize Resend so the build doesn't fail without RESEND_API_KEY
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  }
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? 'raz@buildark.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'raz@buildark.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bookings.buildark.dev'

function generateIcs(booking: Booking, eventType: EventType): string {
  const toIcsDate = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

  const now = toIcsDate(new Date().toISOString())
  const location = booking.meet_link ?? eventType.location_details ?? eventType.location_type

  const description = [
    `Booking with ${booking.booker_name} (${booking.booker_email})`,
    booking.booker_notes ? `Notes: ${booking.booker_notes}` : '',
    booking.meet_link ? `Zoho Meeting: ${booking.meet_link}` : '',
  ].filter(Boolean).join('\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BuildArk//BookingApp//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.id}@buildark.dev`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(booking.start_time)}`,
    `DTEND:${toIcsDate(booking.end_time)}`,
    `SUMMARY:${escapeIcs(`${eventType.name} — ${booking.booker_name}`)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    booking.meet_link ? `URL:${booking.meet_link}` : '',
    `ORGANIZER;CN=Raz:mailto:${ADMIN_EMAIL}`,
    `ATTENDEE;CN=${escapeIcs(booking.booker_name)};RSVP=TRUE:mailto:${booking.booker_email}`,
    `ATTENDEE;CN=Raz;RSVP=FALSE:mailto:${ADMIN_EMAIL}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

function locationLabel(locationType: EventType['location_type'], meetLink?: string): string {
  if (meetLink) return `Zoho Meeting — <a href="${meetLink}" style="color:#0077B6;">${meetLink}</a>`
  switch (locationType) {
    case 'zoho_meeting': return 'Zoho Meeting (link will be provided)'
    case 'google_meet': return 'Google Meet (link will be provided)'
    case 'zoom': return 'Zoom (link will be provided)'
    case 'phone': return 'Phone call'
    case 'in_person': return 'In person'
    default: return locationType
  }
}

function formatBookingTime(booking: Booking): string {
  const tz = booking.timezone || 'UTC'
  const startLocal = toZonedTime(parseISO(booking.start_time), tz)
  const endLocal = toZonedTime(parseISO(booking.end_time), tz)
  const dateStr = format(startLocal, 'EEEE, MMMM d, yyyy')
  const startStr = format(startLocal, 'h:mm a')
  const endStr = format(endLocal, 'h:mm a')
  return `${dateStr} · ${startStr}–${endStr} (${tz})`
}

function headerHtml(): string {
  return `
    <div style="background:#0D1B2A;padding:24px 32px;border-radius:8px 8px 0 0;">
      <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:700;color:#00B4D8;letter-spacing:2px;">BUILDARK</span>
    </div>
  `
}

function footerHtml(): string {
  return `
    <div style="background:#F8FAFC;padding:16px 32px;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#64748B;margin:0;">
        BuildArk · <a href="${APP_URL}" style="color:#0077B6;text-decoration:none;">bookings.buildark.dev</a>
      </p>
    </div>
  `
}

function detailsTable(booking: Booking, eventType: EventType): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;width:140px;vertical-align:top;">Event</td>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#0D1B2A;font-weight:600;">${eventType.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;vertical-align:top;">Date &amp; Time</td>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#0D1B2A;font-weight:600;">${formatBookingTime(booking)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;vertical-align:top;">Duration</td>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#0D1B2A;">${eventType.duration_minutes} minutes</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;vertical-align:top;">Location</td>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#0D1B2A;">${locationLabel(eventType.location_type, booking.meet_link)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;vertical-align:top;">Name</td>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#0D1B2A;">${booking.booker_name}</td>
      </tr>
      ${booking.booker_notes ? `
      <tr>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;vertical-align:top;">Notes</td>
        <td style="padding:8px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#0D1B2A;">${booking.booker_notes}</td>
      </tr>
      ` : ''}
    </table>
  `
}

export async function sendBookingConfirmation(booking: Booking, eventType: EventType): Promise<void> {
  const cancelUrl = `${APP_URL}/cancel/${booking.cancellation_token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:20px;background:#f1f5f9;">
      <div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${headerHtml()}
        <div style="background:#ffffff;padding:32px;">
          <h1 style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;color:#0D1B2A;margin:0 0 8px;">
            Your booking is confirmed!
          </h1>
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#64748B;margin:0 0 24px;">
            Hi ${booking.booker_name}, here are your booking details.
          </p>
          ${detailsTable(booking, eventType)}
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;margin:24px 0 8px;">
            Need to cancel? You can do so any time before the meeting:
          </p>
          <a href="${cancelUrl}" style="display:inline-block;background:#0D1B2A;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Cancel Booking
          </a>
        </div>
        ${footerHtml()}
      </div>
    </body>
    </html>
  `

  try {
    await getResend().emails.send({
      from: `BuildArk Bookings <${FROM}>`,
      to: booking.booker_email,
      subject: `Confirmed: ${eventType.name} with Raz`,
      html,
    })
  } catch (err) {
    console.error('[email] sendBookingConfirmation failed:', err)
  }
}

export async function sendBookingNotification(booking: Booking, eventType: EventType): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:20px;background:#f1f5f9;">
      <div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${headerHtml()}
        <div style="background:#ffffff;padding:32px;">
          <h1 style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;color:#0D1B2A;margin:0 0 8px;">
            New Booking Received
          </h1>
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#64748B;margin:0 0 24px;">
            ${booking.booker_name} (${booking.booker_email}) just booked a session.
          </p>
          ${detailsTable(booking, eventType)}
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#64748B;margin:16px 0 0;">
            Booking ID: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${booking.id}</code>
          </p>
        </div>
        ${footerHtml()}
      </div>
    </body>
    </html>
  `

  const icsContent = generateIcs(booking, eventType)

  try {
    await getResend().emails.send({
      from: `BuildArk Bookings <${FROM}>`,
      to: ADMIN_EMAIL,
      subject: `New Booking: ${eventType.name} — ${booking.booker_name}`,
      html,
      attachments: [
        {
          filename: 'invite.ics',
          content: Buffer.from(icsContent).toString('base64'),
          content_type: 'text/calendar; method=REQUEST; charset=UTF-8',
        },
      ],
    })
  } catch (err) {
    console.error('[email] sendBookingNotification failed:', err)
  }
}

export async function sendCancellationEmails(booking: Booking, eventType: EventType): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:20px;background:#f1f5f9;">
      <div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${headerHtml()}
        <div style="background:#ffffff;padding:32px;">
          <h1 style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;color:#0D1B2A;margin:0 0 8px;">
            Booking Cancelled
          </h1>
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#64748B;margin:0 0 24px;">
            Your booking has been successfully cancelled. We hope to connect soon!
          </p>
          ${detailsTable(booking, eventType)}
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748B;margin:24px 0 8px;">
            Want to book again?
          </p>
          <a href="${APP_URL}" style="display:inline-block;background:#00B4D8;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Schedule a new session
          </a>
        </div>
        ${footerHtml()}
      </div>
    </body>
    </html>
  `

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:20px;background:#f1f5f9;">
      <div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${headerHtml()}
        <div style="background:#ffffff;padding:32px;">
          <h1 style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;color:#0D1B2A;margin:0 0 8px;">
            Booking Cancelled by Client
          </h1>
          <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#64748B;margin:0 0 24px;">
            ${booking.booker_name} cancelled their booking.
          </p>
          ${detailsTable(booking, eventType)}
        </div>
        ${footerHtml()}
      </div>
    </body>
    </html>
  `

  try {
    await Promise.all([
      getResend().emails.send({
        from: `BuildArk Bookings <${FROM}>`,
        to: booking.booker_email,
        subject: `Cancelled: ${eventType.name}`,
        html,
      }),
      getResend().emails.send({
        from: `BuildArk Bookings <${FROM}>`,
        to: ADMIN_EMAIL,
        subject: `Booking Cancelled: ${eventType.name} — ${booking.booker_name}`,
        html: adminHtml,
      }),
    ])
  } catch (err) {
    console.error('[email] sendCancellationEmails failed:', err)
  }
}
