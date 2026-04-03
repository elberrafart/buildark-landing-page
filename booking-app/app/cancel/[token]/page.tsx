'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Booking, EventType } from '@/lib/types'

export default function CancelPage() {
  const params = useParams()
  const token = params.token as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/bookings/by-token/${token}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const b: Booking = await res.json()
        setBooking(b)

        if (b.event_type_id) {
          const etRes = await fetch(`/api/public/event-types?id=${b.event_type_id}`)
          if (etRes.ok) setEventType(await etRes.json())
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const handleCancel = async () => {
    if (!booking) return
    setCancelling(true)
    setError('')

    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to cancel. Please try again.')
        return
      }

      setCancelled(true)
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setCancelling(false)
    }
  }

  const formatTime = (b: Booking) => {
    try {
      const startLocal = toZonedTime(parseISO(b.start_time), b.timezone)
      const endLocal = toZonedTime(parseISO(b.end_time), b.timezone)
      const dateStr = format(startLocal, 'EEEE, MMMM d, yyyy')
      const startStr = format(startLocal, 'h:mm a')
      const endStr = format(endLocal, 'h:mm a')
      return `${dateStr} · ${startStr}–${endStr}`
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

      <main className="max-w-xl mx-auto px-4 py-12">
        {cancelled ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-syne text-3xl font-bold text-navy mb-3">Booking Cancelled</h1>
            <p className="text-muted mb-8">
              Your booking has been cancelled. A confirmation has been sent to your email.
            </p>
            <a
              href="/"
              className="inline-block px-8 py-3 bg-teal text-white font-syne font-bold rounded-lg hover:bg-teal-dark transition-colors"
            >
              Schedule a new session
            </a>
          </div>
        ) : notFound || !booking ? (
          <div className="text-center">
            <h1 className="font-syne text-3xl font-bold text-navy mb-3">
              {!booking && !notFound ? 'Already Cancelled' : 'Booking Not Found'}
            </h1>
            <p className="text-muted mb-8">
              {booking?.status === 'cancelled'
                ? 'This booking has already been cancelled.'
                : 'This cancellation link is invalid or has expired.'}
            </p>
            <a href="/" className="text-teal-dark hover:underline font-semibold">← Back to home</a>
          </div>
        ) : booking.status === 'cancelled' ? (
          <div className="text-center">
            <h1 className="font-syne text-3xl font-bold text-navy mb-3">Already Cancelled</h1>
            <p className="text-muted mb-8">This booking has already been cancelled.</p>
            <a href="/" className="text-teal-dark hover:underline font-semibold">← Back to home</a>
          </div>
        ) : (
          <>
            <h1 className="font-syne text-3xl font-bold text-navy mb-2">Cancel your booking</h1>
            <p className="text-muted mb-8">
              Are you sure you want to cancel? This action cannot be undone.
            </p>

            {/* Booking details */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
              {eventType && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventType.color }} />
                  <h2 className="font-syne font-bold text-navy">{eventType.name}</h2>
                </div>
              )}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-navy font-medium">{formatTime(booking)}</span>
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-syne font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Booking'
                )}
              </button>
              <a
                href="/"
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-navy font-syne font-bold rounded-lg hover:border-gray-300 transition-colors text-center"
              >
                Keep my booking
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
