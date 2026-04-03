'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EventType } from '@/lib/types'

function locationLabel(type: EventType['location_type']): string {
  switch (type) {
    case 'zoho_meeting': return 'Zoho Meeting'
    case 'google_meet': return 'Google Meet'
    case 'zoom': return 'Zoom'
    case 'phone': return 'Phone'
    case 'in_person': return 'In Person'
    default: return type
  }
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const fetchEventTypes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/event-types')
      if (res.ok) setEventTypes(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (et: EventType) => {
    if (!confirm(`Delete "${et.name}"? This cannot be undone.`)) return
    setDeletingId(et.id)
    try {
      const res = await fetch(`/api/admin/event-types/${et.id}`, { method: 'DELETE' })
      if (res.ok) await fetchEventTypes()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (et: EventType) => {
    try {
      const res = await fetch(`/api/admin/event-types/${et.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !et.is_active }),
      })
      if (res.ok) await fetchEventTypes()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne text-2xl font-bold text-navy">Event Types</h1>
          <p className="text-muted text-sm mt-1">Manage the types of meetings people can book</p>
        </div>
        <Link
          href="/admin/event-types/new"
          className="px-4 py-2.5 bg-teal text-white font-syne font-bold text-sm rounded-lg hover:bg-teal-dark transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event Type
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : eventTypes.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>No event types yet.</p>
            <Link href="/admin/event-types/new" className="text-teal-dark hover:underline font-semibold mt-2 inline-block">
              Create your first one →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eventTypes.map((et) => (
                  <tr key={et.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
                        <span className="font-medium text-navy">{et.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{et.duration_minutes} min</td>
                    <td className="px-4 py-3 text-muted">{locationLabel(et.location_type)}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-muted">/{et.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(et)}
                        className={[
                          'px-2 py-0.5 rounded-full text-xs font-semibold transition-colors',
                          et.is_active
                            ? 'bg-teal-light text-teal-dark hover:bg-teal/20'
                            : 'bg-gray-100 text-muted hover:bg-gray-200',
                        ].join(' ')}
                      >
                        {et.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <Link
                          href={`/admin/event-types/${et.id}`}
                          className="text-xs text-teal-dark hover:text-teal font-semibold transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(et)}
                          disabled={deletingId === et.id}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
                        >
                          {deletingId === et.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
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
