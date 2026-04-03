import { addMinutes, parseISO, isAfter, isBefore, format } from 'date-fns'
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz'
import {
  getEventTypeById,
  getAvailability,
  isDateBlocked,
  getBookingsForDate,
} from './store'
import { getZohoBusyTimes } from './zoho'
import { getTokens } from './token-store'

// Availability windows are defined in this timezone
const AVAILABILITY_TZ = 'America/Los_Angeles'

export interface TimeSlot {
  start: string      // ISO8601 UTC
  end: string        // ISO8601 UTC
  startLocal: string // HH:MM in the user's requested timezone
}

export async function generateSlots(params: {
  eventTypeId: string
  date: string // YYYY-MM-DD
  timezone: string
}): Promise<TimeSlot[]> {
  const { eventTypeId, date, timezone } = params

  // 1. Load event type
  const eventType = await getEventTypeById(eventTypeId)
  if (!eventType) return []

  const { duration_minutes, buffer_before_minutes, buffer_after_minutes } = eventType

  // 2. Check if date is blocked
  const blocked = await isDateBlocked(date)
  if (blocked) return []

  // 3. Load availability for that day_of_week
  const availability = await getAvailability()
  // Parse date as local-naive to get day of week
  const [year, month, day] = date.split('-').map(Number)
  const dateLocal = new Date(year, month - 1, day)
  const dayOfWeek = dateLocal.getDay()

  const avail = availability.find((a) => a.day_of_week === dayOfWeek)
  if (!avail || !avail.is_active) return []

  // 4. Convert availability window from America/Los_Angeles to UTC
  const [startHour, startMin] = avail.start_time.split(':').map(Number)
  const [endHour, endMin] = avail.end_time.split(':').map(Number)

  // Build Date objects in the availability timezone
  const windowStartLocal = new Date(year, month - 1, day, startHour, startMin, 0)
  const windowEndLocal = new Date(year, month - 1, day, endHour, endMin, 0)

  // Convert to UTC
  const windowStartUTC = fromZonedTime(windowStartLocal, AVAILABILITY_TZ)
  const windowEndUTC = fromZonedTime(windowEndLocal, AVAILABILITY_TZ)

  // 5. Load existing bookings for that date (confirmed only)
  const bookings = await getBookingsForDate(date)
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')

  // Busy windows from bookings (expand by buffer)
  const busyWindows: Array<{ start: Date; end: Date }> = confirmedBookings.map((b) => ({
    start: addMinutes(parseISO(b.start_time), -buffer_before_minutes),
    end: addMinutes(parseISO(b.end_time), buffer_after_minutes),
  }))

  // 6. Try to load Zoho busy times
  try {
    const tokens = await getTokens()
    if (tokens?.calendar_id) {
      const zohoBusy = await getZohoBusyTimes(date, tokens.calendar_id)
      for (const busy of zohoBusy) {
        if (busy.start && busy.end) {
          busyWindows.push({
            start: addMinutes(parseISO(busy.start), -buffer_before_minutes),
            end: addMinutes(parseISO(busy.end), buffer_after_minutes),
          })
        }
      }
    }
  } catch (err) {
    console.error('[slots] Zoho busy times fetch failed (continuing):', err)
  }

  // 7. Generate candidate slots at duration_minutes intervals
  const slots: TimeSlot[] = []
  const now = new Date()
  let cursor = windowStartUTC

  while (isBefore(addMinutes(cursor, duration_minutes), windowEndUTC) ||
         addMinutes(cursor, duration_minutes).getTime() === windowEndUTC.getTime()) {
    const slotStart = cursor
    const slotEnd = addMinutes(cursor, duration_minutes)

    // 8. Check if slot overlaps any busy window
    // A slot is busy if: slot_start < busy_end && slot_end > busy_start
    const slotBusyStart = addMinutes(slotStart, -buffer_before_minutes)
    const slotBusyEnd = addMinutes(slotEnd, buffer_after_minutes)

    const overlaps = busyWindows.some(
      (bw) => isBefore(slotBusyStart, bw.end) && isAfter(slotBusyEnd, bw.start)
    )

    // 9. Filter out past slots if date is today
    const isPast = !isAfter(slotStart, now)

    if (!overlaps && !isPast) {
      // Convert start to the user's local timezone for display
      const startInUserTz = toZonedTime(slotStart, timezone)
      const startLocal = format(startInUserTz, 'HH:mm')

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        startLocal,
      })
    }

    cursor = addMinutes(cursor, duration_minutes)
  }

  return slots
}
