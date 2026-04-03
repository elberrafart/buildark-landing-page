'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Booking, EventType } from '@/lib/types'

function buildGoogleCalendarUrl(booking: Booking, eventType: EventType): string {
  const startLocal = toZonedTime(parseISO(booking.start_time), booking.timezone)
  const endLocal = toZonedTime(parseISO(booking.end_time), booking.timezone)

  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss")

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventType.name,
    dates: `${fmt(startLocal)}/${fmt(endLocal)}`,
    details: eventType.description,
    ctz: booking.timezone,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function SuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const bookingId = searchParams.get('bookingId') ?? ''

  const [booking, setBooking] = useState<Booking | null>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [etRes] = await Promise.all([
          fetch(`/api/public/event-types?slug=${slug}`),
        ])

        if (etRes.ok) {
          const et = await etRes.json()
          setEventType(et)
        }

        // We need to get the booking — since we don't have a public booking endpoint,
        // we'll use the cancellation token approach. For the success page, we just fetch
        // the booking by id using a public endpoint.
        if (bookingId) {
          const bookingRes = await fetch(`/api/public/bookings/${bookingId}`)
          if (bookingRes.ok) {
            setBooking(await bookingRes.json())
          }
        }
      } catch (err) {
        console.error('Failed to fetch booking details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug, bookingId])

  const formatBookingTime = (b: Booking) => {
    try {
      const startLocal = toZonedTime(parseISO(b.start_time), b.timezone)
      const endLocal = toZonedTime(parseISO(b.end_time), b.timezone)
      const dateStr = format(startLocal, 'EEEE, MMMM d, yyyy')
      const startStr = format(startLocal, 'h:mm a')
      const endStr = format(endLocal, 'h:mm a')
      return `${dateStr} · ${startStr}–${endStr} (${b.timezone.replace(/_/g, ' ')})`
    } catch {
      return b.start_time
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="bg-navy py-4 px-6">
        <div className="max-w-xl mx-auto">
          <a href="/" className="font-syne text-lg font-bold tracking-widest text-teal uppercase">
            BuildArk
          </a>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-12 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-syne text-3xl md:text-4xl font-bold text-navy mb-3">
          You&apos;re booked!
        </h1>
        <p className="text-muted mb-8 text-lg">
          A confirmation email is on its way to you.
        </p>

        {/* Booking details card */}
        {booking && eventType ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-left mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventType.color }} />
              <h2 className="font-syne font-bold text-navy text-lg">{eventType.name}</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-navy font-medium">{formatBookingTime(booking)}</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-navy">{booking.booker_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-navy">{booking.booker_email}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-muted text-sm">Check your email for booking confirmation details.</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {booking?.meet_link && (
            <a
              href={booking.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-teal text-white font-syne font-bold rounded-lg hover:bg-teal-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Join Zoho Meeting
            </a>
          )}
          {booking && eventType && (
            <a
              href={buildGoogleCalendarUrl(booking, eventType)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-gray-200 hover:border-teal text-navy font-semibold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add to Google Calendar
            </a>
          )}

          {booking && (
            <a
              href={`${APP_URL}/cancel/${booking.cancellation_token}`}
              className="block w-full py-3 text-sm text-muted hover:text-red-500 transition-colors"
            >
              Need to cancel? Click here
            </a>
          )}

          <a
            href="/"
            className="block w-full py-3 bg-navy text-white font-syne font-bold rounded-lg hover:bg-navy/90 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </main>
    </div>
  )
}
