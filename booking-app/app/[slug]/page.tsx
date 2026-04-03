'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { EventType, Availability, BlockedDate } from '@/lib/types'

interface TimeSlot {
  start: string
  end: string
  startLocal: string
}

function locationLabel(type: EventType['location_type']): string {
  switch (type) {
    case 'zoho_meeting': return 'Zoho Meeting'
    case 'google_meet': return 'Google Meet'
    case 'zoom': return 'Zoom'
    case 'phone': return 'Phone call'
    case 'in_person': return 'In person'
    default: return type
  }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [availability, setAvailability] = useState<Availability[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])

  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'America/Los_Angeles'
    }
  })

  // Fetch event type
  useEffect(() => {
    async function fetchEventType() {
      try {
        // Use public availability endpoint + find event type
        const res = await fetch(`/api/public/availability`)
        // We need event type data - fetch all event types via a public-ish route
        // Since there's no public event-type-by-slug route, we hit the booking page server-side
        // For now, use a search param approach: fetch from a dedicated public endpoint
        // Let's fetch from our own page's data by requesting the event type list
        // Actually, we'll create a simple approach: fetch from the admin list won't work (requires auth)
        // Solution: fetch availability then use window.location to get slug, but we already have it
        // The cleanest solution: add a public /api/public/event-types route -- but we didn't spec one.
        // Instead: we'll do a server-side fetch in the initial load. But this is a client component.
        // Best approach for now: fetch from /api/slots which internally needs event type.
        // Let's do it the right way: call a public endpoint we'll create inline.
        const etRes = await fetch(`/api/public/event-types?slug=${slug}`)
        if (!etRes.ok) {
          setNotFound(true)
          return
        }
        const data = await etRes.json()
        setEventType(data)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchEventType()
  }, [slug])

  // Fetch availability and blocked dates once
  useEffect(() => {
    async function fetchPublicData() {
      try {
        const [availRes, blockedRes] = await Promise.all([
          fetch('/api/public/availability'),
          fetch('/api/public/blocked-dates'),
        ])
        if (availRes.ok) setAvailability(await availRes.json())
        if (blockedRes.ok) setBlockedDates(await blockedRes.json())
      } catch (err) {
        console.error('Failed to fetch public data:', err)
      }
    }
    fetchPublicData()
  }, [])

  // Fetch slots when date or timezone changes
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !eventType) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await fetch(
        `/api/slots?eventTypeId=${eventType.id}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`
      )
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots ?? [])
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err)
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [selectedDate, eventType, timezone])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const isDateDisabled = (date: Date): boolean => {
    if (isBefore(date, startOfDay(new Date()))) return true

    const dow = date.getDay()
    const avail = availability.find((a) => a.day_of_week === dow)
    if (!avail || !avail.is_active) return true

    const dateStr = format(date, 'yyyy-MM-dd')
    if (blockedDates.some((bd) => bd.date === dateStr)) return true

    return false
  }

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Pad start of month
  const startPad = startOfMonth(currentMonth).getDay()
  const paddingDays = Array.from({ length: startPad })

  const handleNext = () => {
    if (!selectedDate || !selectedSlot || !eventType) return
    const params = new URLSearchParams({
      start: selectedSlot.start,
      end: selectedSlot.end,
      tz: timezone,
    })
    router.push(`/${slug}/confirm?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !eventType) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-syne text-3xl font-bold text-navy mb-3">Not Found</h1>
        <p className="text-muted mb-6">This booking type doesn&apos;t exist or is no longer active.</p>
        <a href="/" className="text-teal-dark hover:underline font-semibold">← Back to all sessions</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="bg-navy py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <a href="/" className="font-syne text-lg font-bold tracking-widest text-teal uppercase">
            BuildArk
          </a>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Event type header */}
        <div className="flex items-start gap-3 mb-8">
          <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: eventType.color }} />
          <div>
            <h1 className="font-syne text-2xl md:text-3xl font-bold text-navy">{eventType.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {eventType.duration_minutes} min
              </span>
              <span className="text-muted text-sm">·</span>
              <span className="text-sm text-muted">{locationLabel(eventType.location_type)}</span>
            </div>
            <p className="text-muted text-sm mt-2 max-w-lg">{eventType.description}</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left: Calendar */}
            <div className="md:w-[55%] p-6 border-b md:border-b-0 md:border-r border-gray-100">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(new Date()))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="font-syne font-bold text-navy">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {paddingDays.map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {monthDays.map((day) => {
                  const disabled = isDateDisabled(day)
                  const selected = selectedDate ? isSameDay(day, selectedDate) : false
                  const today = isToday(day)
                  const inMonth = isSameMonth(day, currentMonth)

                  return (
                    <button
                      key={day.toISOString()}
                      disabled={disabled || !inMonth}
                      onClick={() => {
                        setSelectedDate(day)
                        setSlots([])
                      }}
                      className={[
                        'w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all',
                        !inMonth ? 'opacity-0 pointer-events-none' : '',
                        disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                        selected
                          ? 'bg-teal text-white font-bold shadow-md'
                          : today && !disabled
                            ? 'bg-teal-light text-teal-dark font-bold'
                            : !disabled
                              ? 'text-navy hover:bg-teal-light hover:text-teal-dark'
                              : '',
                      ].join(' ')}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              {/* Timezone */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                  ))}
                  {!TIMEZONES.includes(timezone) && (
                    <option value={timezone}>{timezone.replace(/_/g, ' ')}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Right: Time slots */}
            <div className="md:w-[45%] p-6">
              {!selectedDate ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-muted text-sm">Select a date to see available times</p>
                </div>
              ) : (
                <>
                  <h3 className="font-syne font-bold text-navy mb-4">
                    {format(selectedDate, 'EEEE, MMM d')}
                  </h3>

                  {slotsLoading ? (
                    <div className="space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted text-sm">No available times on this day.</p>
                      <p className="text-muted text-xs mt-1">Try selecting a different date.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-80">
                      {slots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={[
                            'w-full py-2.5 px-4 rounded-lg text-sm font-semibold border-2 transition-all text-center',
                            selectedSlot?.start === slot.start
                              ? 'bg-teal border-teal text-white shadow-md'
                              : 'bg-white border-gray-200 text-navy hover:border-teal hover:text-teal-dark',
                          ].join(' ')}
                        >
                          {slot.startLocal}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="p-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedDate || !selectedSlot}
              className="px-6 py-2.5 bg-amber text-navy font-syne font-bold rounded-lg hover:bg-amber-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-4">
          <a href="/" className="hover:text-teal-dark transition-colors">← Back to all sessions</a>
        </p>
      </main>
    </div>
  )
}
