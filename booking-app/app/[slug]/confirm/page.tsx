'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { EventType } from '@/lib/types'

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

function LocationIcon({ type }: { type: EventType['location_type'] }) {
  if (type === 'google_meet' || type === 'zoom') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
  if (type === 'phone') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    </svg>
  )
}

export default function ConfirmPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string

  const start = searchParams.get('start') ?? ''
  const end = searchParams.get('end') ?? ''
  const tz = searchParams.get('tz') ?? 'UTC'

  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEventType() {
      try {
        const res = await fetch(`/api/public/event-types?slug=${slug}`)
        if (res.ok) setEventType(await res.json())
      } catch {
        // pass
      } finally {
        setLoading(false)
      }
    }
    fetchEventType()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventType || !name || !email || !start || !end) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          bookerName: name,
          bookerEmail: email,
          bookerNotes: notes || undefined,
          startTime: start,
          endTime: end,
          timezone: tz,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create booking. Please try again.')
        return
      }

      const booking = await res.json()
      router.push(`/${slug}/success?bookingId=${booking.id}`)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Format the booking time for display
  const formatTime = () => {
    if (!start || !end) return ''
    try {
      const startLocal = toZonedTime(parseISO(start), tz)
      const endLocal = toZonedTime(parseISO(end), tz)
      const dateStr = format(startLocal, 'EEEE, MMMM d, yyyy')
      const startStr = format(startLocal, 'h:mm a')
      const endStr = format(endLocal, 'h:mm a')
      return `${dateStr} · ${startStr}–${endStr}`
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!eventType || !start || !end) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-syne text-2xl font-bold text-navy mb-3">Invalid booking</h1>
        <p className="text-muted mb-6">Something went wrong. Please start over.</p>
        <a href={`/${slug}`} className="text-teal-dark hover:underline font-semibold">← Pick a new time</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="bg-navy py-4 px-6">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="font-syne text-lg font-bold tracking-widest text-teal uppercase">
            BuildArk
          </a>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-syne text-2xl md:text-3xl font-bold text-navy mb-2">Confirm your booking</h1>
        <p className="text-muted mb-8">Fill in your details below to complete the booking.</p>

        {/* Booking summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventType.color }} />
            <h2 className="font-syne font-bold text-navy">{eventType.name}</h2>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-navy font-medium">{formatTime()}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{eventType.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon type={eventType.location_type} />
              <span>{locationLabel(eventType.location_type)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              <span>{tz.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Notes <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell Raz a bit about your project or what you'd like to discuss..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name || !email}
            className="w-full py-3 bg-amber hover:bg-amber-dark text-navy font-syne font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              'Book It'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          <a href={`/${slug}`} className="hover:text-teal-dark transition-colors">← Pick a different time</a>
        </p>
      </main>
    </div>
  )
}
