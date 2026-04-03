'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventType } from '@/lib/types'

type FormData = {
  name: string
  slug: string
  description: string
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  color: string
  is_active: boolean
  location_type: EventType['location_type']
  location_details: string
}

const COLOR_SWATCHES = [
  '#00B4D8',
  '#0077B6',
  '#F4A261',
  '#E07A3A',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
  '#0D1B2A',
]

const LOCATION_TYPES: { value: EventType['location_type']; label: string }[] = [
  { value: 'zoho_meeting', label: 'Zoho Meeting' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'phone', label: 'Phone call' },
  { value: 'in_person', label: 'In person' },
]

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Props {
  initial?: EventType
  mode: 'create' | 'edit'
}

export default function EventTypeForm({ initial, mode }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    duration_minutes: initial?.duration_minutes ?? 30,
    buffer_before_minutes: initial?.buffer_before_minutes ?? 0,
    buffer_after_minutes: initial?.buffer_after_minutes ?? 10,
    color: initial?.color ?? '#00B4D8',
    is_active: initial?.is_active ?? true,
    location_type: initial?.location_type ?? 'google_meet',
    location_details: initial?.location_details ?? '',
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slugManuallyEdited && mode === 'create') {
      setForm((f) => ({ ...f, slug: slugify(f.name) }))
    }
  }, [form.name, slugManuallyEdited, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const url = mode === 'create'
        ? '/api/admin/event-types'
        : `/api/admin/event-types/${initial?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          location_details: form.location_details || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save event type')
        return
      }

      router.push('/admin/event-types')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Discovery Call"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal/40 focus-within:border-teal">
          <span className="px-3 py-2.5 bg-gray-50 text-muted text-sm border-r border-gray-200 flex-shrink-0">
            bookings.buildark.dev/
          </span>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true)
              setForm((f) => ({ ...f, slug: e.target.value }))
            }}
            placeholder="discovery-call"
            className="flex-1 px-3 py-2.5 text-navy focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Brief description of what this session is about..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal resize-none"
        />
      </div>

      {/* Duration + Buffers */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">Duration (min)</label>
          <input
            type="number"
            required
            min={5}
            max={480}
            value={form.duration_minutes}
            onChange={(e) => setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 30 }))}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">Buffer Before</label>
          <input
            type="number"
            min={0}
            max={60}
            value={form.buffer_before_minutes}
            onChange={(e) => setForm((f) => ({ ...f, buffer_before_minutes: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">Buffer After</label>
          <input
            type="number"
            min={0}
            max={60}
            value={form.buffer_after_minutes}
            onChange={(e) => setForm((f) => ({ ...f, buffer_after_minutes: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>
      </div>

      {/* Location type */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5">Location Type</label>
        <select
          value={form.location_type}
          onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value as EventType['location_type'] }))}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
        >
          {LOCATION_TYPES.map((lt) => (
            <option key={lt.value} value={lt.value}>{lt.label}</option>
          ))}
        </select>
      </div>

      {/* Location details */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5">
          {form.location_type === 'zoho_meeting' ? 'Zoho Meeting URL' : 'Location Details'}
          {form.location_type !== 'zoho_meeting' && <span className="text-muted font-normal"> (optional)</span>}
          {form.location_type === 'zoho_meeting' && <span className="text-red-500"> *</span>}
        </label>
        <input
          type={form.location_type === 'zoho_meeting' ? 'url' : 'text'}
          required={form.location_type === 'zoho_meeting'}
          value={form.location_details}
          onChange={(e) => setForm((f) => ({ ...f, location_details: e.target.value }))}
          placeholder={form.location_type === 'zoho_meeting' ? 'https://meeting.zoho.com/meeting/join/...' : 'e.g. Zoom link, address...'}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
        />
        {form.location_type === 'zoho_meeting' && (
          <p className="text-xs text-muted mt-1">This link will be included in all booking confirmations and calendar events.</p>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-2">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: c }}
            >
              {form.color === c && (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="w-8 h-8 rounded-full cursor-pointer border border-gray-200"
            title="Custom color"
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            form.is_active ? 'bg-teal' : 'bg-gray-300',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              form.is_active ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
        <span className="text-sm font-medium text-navy">
          {form.is_active ? 'Active (visible to bookers)' : 'Inactive (hidden from bookers)'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-teal text-white font-syne font-bold rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create Event Type' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/event-types')}
          className="px-6 py-2.5 bg-white border border-gray-200 text-navy font-semibold rounded-lg hover:border-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
