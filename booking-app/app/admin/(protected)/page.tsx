'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Booking } from '@/lib/types'

type Tab = 'upcoming' | 'past' | 'cancelled'

function formatTime(booking: Booking): string {
  try {
    const tz = booking.timezone || 'UTC'
    const startLocal = toZonedTime(parseISO(booking.start_time), tz)
    return format(startLocal, 'MMM d, yyyy · h:mm a')
  } catch {
    return booking.start_time
  }
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const colors = {
    confirmed: 'bg-teal-light text-teal-dark',
    cancelled: 'bg-red-50 text-red-600',
    rescheduled: 'bg-amber/20 text-amber-dark',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings')
      if (res.ok) {
        setBookings(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (booking: Booking) => {
    if (!confirm(`Cancel booking for ${booking.booker_name}?`)) return
    setCancellingId(booking.id)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: booking.cancellation_token }),
      })
      if (res.ok) {
        await fetchBookings()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCancellingId(null)
    }
  }

  const now = new Date()

  const filteredBookings = bookings.filter((b) => {
    const start = new Date(b.start_time)
    if (activeTab === 'upcoming') return b.status === 'confirmed' && start >= now
    if (activeTab === 'past') return b.status === 'confirmed' && start < now
    if (activeTab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const upcomingCount = bookings.filter((b) => b.status === 'confirmed' && new Date(b.start_time) >= now).length

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Manage your upcoming and past bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Upcoming</p>
          <p className="font-syne text-3xl font-bold text-navy mt-1">{upcomingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Total</p>
          <p className="font-syne text-3xl font-bold text-navy mt-1">
            {bookings.filter((b) => b.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Cancelled</p>
          <p className="font-syne text-3xl font-bold text-navy mt-1">
            {bookings.filter((b) => b.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-teal text-teal-dark'
                : 'border-transparent text-muted hover:text-navy',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>No bookings here yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Notes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                      {formatTime(b)}
                    </td>
                    <td className="px-4 py-3 text-navy">{b.booker_name}</td>
                    <td className="px-4 py-3 text-muted">
                      <a href={`mailto:${b.booker_email}`} className="hover:text-teal-dark transition-colors">
                        {b.booker_email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted max-w-xs truncate">
                      {b.booker_notes ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      {b.status === 'confirmed' && new Date(b.start_time) >= now && (
                        <button
                          onClick={() => handleCancel(b)}
                          disabled={cancellingId === b.id}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
                        >
                          {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
