'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { EventType, Availability, BlockedDate } from '@/lib/types'

interface TimeSlot {
  start: string
  end: string
  startLocal: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export default function EmbedPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [etRes, availRes, blockedRes] = await Promise.all([
          fetch(`/api/public/event-types?slug=${slug}`),
          fetch('/api/public/availability'),
          fetch('/api/public/blocked-dates'),
        ])
        if (etRes.ok) setEventType(await etRes.json())
        if (availRes.ok) setAvailability(await availRes.json())
        if (blockedRes.ok) setBlockedDates(await blockedRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

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
    } catch {
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
    return blockedDates.some((bd) => bd.date === dateStr)
  }

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startPad = startOfMonth(currentMonth).getDay()
  const paddingDays = Array.from({ length: startPad })

  const handleNext = () => {
    if (!selectedDate || !selectedSlot || !eventType) return
    const p = new URLSearchParams({
      start: selectedSlot.start,
      end: selectedSlot.end,
      tz: timezone,
    })
    router.push(`/${slug}/confirm?${p.toString()}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!eventType) {
    return <div className="p-4 text-sm text-muted">Event type not found.</div>
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eventType.color }} />
          <h1 className="font-syne font-bold text-navy text-lg">{eventType.name}</h1>
          <span className="text-xs text-muted ml-1">({eventType.duration_minutes} min)</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(new Date()))}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-syne font-bold text-sm text-navy">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {monthDays.map((day) => {
              const disabled = isDateDisabled(day)
              const selected = selectedDate ? isSameDay(day, selectedDate) : false
              const today = isToday(day)
              const inMonth = isSameMonth(day, currentMonth)

              return (
                <button
                  key={day.toISOString()}
                  disabled={disabled || !inMonth}
                  onClick={() => { setSelectedDate(day); setSlots([]) }}
                  className={[
                    'w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all',
                    !inMonth ? 'opacity-0 pointer-events-none' : '',
                    disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                    selected ? 'bg-teal text-white font-bold' :
                    today && !disabled ? 'bg-teal-light text-teal-dark font-bold' :
                    !disabled ? 'text-navy hover:bg-teal-light hover:text-teal-dark' : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          <div className="mt-3">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 text-navy"
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

        {/* Slots */}
        <div className="flex-1">
          {!selectedDate ? (
            <p className="text-muted text-sm text-center py-8">Select a date</p>
          ) : slotsLoading ? (
            <div className="space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No times available</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-muted mb-2">{format(selectedDate, 'EEE, MMM d')}</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot)}
                    className={[
                      'w-full py-2 px-3 rounded text-xs font-semibold border-2 transition-all text-center',
                      selectedSlot?.start === slot.start
                        ? 'bg-teal border-teal text-white'
                        : 'border-gray-200 text-navy hover:border-teal',
                    ].join(' ')}
                  >
                    {slot.startLocal}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedDate || !selectedSlot}
          className="px-5 py-2 bg-amber text-navy font-syne font-bold text-sm rounded-lg hover:bg-amber-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
