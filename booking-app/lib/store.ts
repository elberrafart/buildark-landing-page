/**
 * In-memory mock store.
 * Initialized from JSON seed files in /data/.
 * TODO: Replace with Supabase when ready.
 */

import { EventType, Availability, BlockedDate, Booking } from './types'

// ---------------------------------------------------------------------------
// Initialize in-memory Maps from seed JSON files
// ---------------------------------------------------------------------------

function loadSeedData<T>(filename: string): T[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(`../data/${filename}`)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const eventTypesMap = new Map<string, EventType>(
  loadSeedData<EventType>('event-types.json').map((et) => [et.id, et])
)

const availabilityMap = new Map<number, Availability>(
  loadSeedData<Availability>('availability.json').map((a) => [a.day_of_week, a])
)

const blockedDatesMap = new Map<string, BlockedDate>(
  loadSeedData<BlockedDate>('blocked-dates.json').map((bd) => [bd.id, bd])
)

const bookingsMap = new Map<string, Booking>(
  loadSeedData<Booking>('bookings.json').map((b) => [b.id, b])
)

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

// TODO: Replace with Supabase query
export async function getEventTypes(): Promise<EventType[]> {
  return Array.from(eventTypesMap.values())
}

// TODO: Replace with Supabase query
export async function getEventTypeBySlug(slug: string): Promise<EventType | null> {
  for (const et of eventTypesMap.values()) {
    if (et.slug === slug) return et
  }
  return null
}

// TODO: Replace with Supabase query
export async function getEventTypeById(id: string): Promise<EventType | null> {
  return eventTypesMap.get(id) ?? null
}

// TODO: Replace with Supabase query
export async function createEventType(
  data: Omit<EventType, 'id' | 'created_at'>
): Promise<EventType> {
  const et: EventType = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  eventTypesMap.set(et.id, et)
  return et
}

// TODO: Replace with Supabase query
export async function updateEventType(
  id: string,
  data: Partial<EventType>
): Promise<EventType | null> {
  const existing = eventTypesMap.get(id)
  if (!existing) return null
  const updated: EventType = { ...existing, ...data, id }
  eventTypesMap.set(id, updated)
  return updated
}

// TODO: Replace with Supabase query
export async function deleteEventType(id: string): Promise<boolean> {
  return eventTypesMap.delete(id)
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

// TODO: Replace with Supabase query
export async function getAvailability(): Promise<Availability[]> {
  return Array.from(availabilityMap.values()).sort((a, b) => a.day_of_week - b.day_of_week)
}

// TODO: Replace with Supabase query
export async function upsertAvailability(
  day_of_week: number,
  data: Partial<Availability>
): Promise<Availability> {
  const existing = availabilityMap.get(day_of_week)
  const updated: Availability = existing
    ? { ...existing, ...data, day_of_week }
    : {
        id: crypto.randomUUID(),
        day_of_week,
        start_time: '09:00',
        end_time: '17:00',
        is_active: false,
        ...data,
      }
  availabilityMap.set(day_of_week, updated)
  return updated
}

// ---------------------------------------------------------------------------
// Blocked Dates
// ---------------------------------------------------------------------------

// TODO: Replace with Supabase query
export async function getBlockedDates(): Promise<BlockedDate[]> {
  return Array.from(blockedDatesMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

// TODO: Replace with Supabase query
export async function addBlockedDate(date: string, reason?: string): Promise<BlockedDate> {
  const bd: BlockedDate = {
    id: crypto.randomUUID(),
    date,
    reason,
    created_at: new Date().toISOString(),
  }
  blockedDatesMap.set(bd.id, bd)
  return bd
}

// TODO: Replace with Supabase query
export async function removeBlockedDate(id: string): Promise<boolean> {
  return blockedDatesMap.delete(id)
}

// TODO: Replace with Supabase query
export async function isDateBlocked(date: string): Promise<boolean> {
  for (const bd of blockedDatesMap.values()) {
    if (bd.date === date) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

// TODO: Replace with Supabase query
export async function getBookings(status?: string): Promise<Booking[]> {
  const all = Array.from(bookingsMap.values())
  if (status) return all.filter((b) => b.status === status)
  return all
}

// TODO: Replace with Supabase query
export async function getBookingById(id: string): Promise<Booking | null> {
  return bookingsMap.get(id) ?? null
}

// TODO: Replace with Supabase query
export async function getBookingByToken(token: string): Promise<Booking | null> {
  for (const b of bookingsMap.values()) {
    if (b.cancellation_token === token) return b
  }
  return null
}

// TODO: Replace with Supabase query
export async function getBookingsForDate(date: string): Promise<Booking[]> {
  return Array.from(bookingsMap.values()).filter((b) => {
    // date is YYYY-MM-DD; start_time is ISO8601 UTC — compare date portion
    return b.start_time.startsWith(date)
  })
}

// TODO: Replace with Supabase query
export async function createBooking(
  data: Omit<Booking, 'id' | 'cancellation_token' | 'created_at'>
): Promise<Booking> {
  const booking: Booking = {
    ...data,
    id: crypto.randomUUID(),
    cancellation_token: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  bookingsMap.set(booking.id, booking)
  return booking
}

// TODO: Replace with Supabase query
export async function updateBooking(id: string, data: Partial<Booking>): Promise<Booking | null> {
  const existing = bookingsMap.get(id)
  if (!existing) return null
  const updated: Booking = { ...existing, ...data, id }
  bookingsMap.set(id, updated)
  return updated
}
