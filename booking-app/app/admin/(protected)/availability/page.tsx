'use client'

import { useEffect, useState } from 'react'
import { Availability, BlockedDate } from '@/lib/types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function TimeInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
    />
  )
}

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [newBlockDate, setNewBlockDate] = useState('')
  const [newBlockReason, setNewBlockReason] = useState('')
  const [addingBlock, setAddingBlock] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [availRes, blockedRes] = await Promise.all([
        fetch('/api/admin/availability'),
        fetch('/api/admin/blocked-dates'),
      ])
      if (availRes.ok) setAvailability(await availRes.json())
      if (blockedRes.ok) setBlockedDates(await blockedRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveAvailability = async (day_of_week: number, data: Partial<Availability>) => {
    setSaving(day_of_week)
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week, ...data }),
      })
      if (res.ok) {
        const updated: Availability = await res.json()
        setAvailability((prev) => prev.map((a) => a.day_of_week === day_of_week ? updated : a))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  const addBlockedDate = async () => {
    if (!newBlockDate) return
    setAddingBlock(true)
    try {
      const res = await fetch('/api/admin/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newBlockDate, reason: newBlockReason || undefined }),
      })
      if (res.ok) {
        const bd: BlockedDate = await res.json()
        setBlockedDates((prev) => [...prev, bd].sort((a, b) => a.date.localeCompare(b.date)))
        setNewBlockDate('')
        setNewBlockReason('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAddingBlock(false)
    }
  }

  const removeBlockedDate = async (id: string) => {
    setRemovingId(id)
    try {
      const res = await fetch(`/api/admin/blocked-dates?id=${id}`, { method: 'DELETE' })
      if (res.ok) setBlockedDates((prev) => prev.filter((bd) => bd.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingId(null)
    }
  }

  const getAvail = (dow: number): Availability => {
    return availability.find((a) => a.day_of_week === dow) ?? {
      id: '',
      day_of_week: dow,
      start_time: '09:00',
      end_time: '17:00',
      is_active: false,
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-syne text-2xl font-bold text-navy">Availability</h1>
        <p className="text-muted text-sm mt-1">Set your weekly hours and block specific dates. Hours are in America/Los_Angeles (PST/PDT).</p>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-syne font-bold text-navy">Weekly Hours</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
            const avail = getAvail(dow)
            return (
              <div key={dow} className="flex items-center gap-4 px-6 py-4">
                {/* Toggle */}
                <button
                  onClick={() => saveAvailability(dow, { is_active: !avail.is_active, start_time: avail.start_time, end_time: avail.end_time })}
                  disabled={saving === dow}
                  className={[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                    avail.is_active ? 'bg-teal' : 'bg-gray-300',
                    saving === dow ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <span className={[
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    avail.is_active ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')} />
                </button>

                {/* Day name */}
                <span className={[
                  'w-28 text-sm font-medium',
                  avail.is_active ? 'text-navy' : 'text-muted',
                ].join(' ')}>
                  {DAY_NAMES[dow]}
                </span>

                {/* Time range */}
                {avail.is_active ? (
                  <div className="flex items-center gap-2">
                    <TimeInput
                      value={avail.start_time}
                      onChange={(v) => saveAvailability(dow, { ...avail, start_time: v })}
                    />
                    <span className="text-muted text-sm">to</span>
                    <TimeInput
                      value={avail.end_time}
                      onChange={(v) => saveAvailability(dow, { ...avail, end_time: v })}
                    />
                    {saving === dow && (
                      <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                ) : (
                  <span className="text-muted text-sm">Unavailable</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Blocked dates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-syne font-bold text-navy">Blocked Dates</h2>
          <p className="text-muted text-xs mt-1">Block specific dates (holidays, vacations, etc.)</p>
        </div>

        {/* Add blocked date */}
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Date</label>
              <input
                type="date"
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
              />
            </div>
            <div className="flex-1 min-w-36">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Reason (optional)</label>
              <input
                type="text"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                placeholder="e.g. Holiday"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
              />
            </div>
            <button
              onClick={addBlockedDate}
              disabled={!newBlockDate || addingBlock}
              className="px-4 py-2 bg-teal text-white font-semibold text-sm rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingBlock ? 'Adding...' : 'Block Date'}
            </button>
          </div>
        </div>

        {/* List of blocked dates */}
        <div className="divide-y divide-gray-50">
          {blockedDates.length === 0 ? (
            <p className="px-6 py-4 text-muted text-sm">No blocked dates.</p>
          ) : (
            blockedDates.map((bd) => (
              <div key={bd.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <span className="text-sm font-medium text-navy">
                    {new Date(bd.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {bd.reason && (
                    <span className="ml-2 text-xs text-muted">— {bd.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => removeBlockedDate(bd.id)}
                  disabled={removingId === bd.id}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {removingId === bd.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
