'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import EventTypeForm from '../EventTypeForm'
import { EventType } from '@/lib/types'

export default function EditEventTypePage() {
  const params = useParams()
  const id = params.id as string

  const [eventType, setEventType] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/admin/event-types/${id}`)
        if (res.ok) {
          setEventType(await res.json())
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !eventType) {
    return (
      <div className="p-8">
        <p className="text-muted">Event type not found.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne text-2xl font-bold text-navy">Edit: {eventType.name}</h1>
        <p className="text-muted text-sm mt-1">Update this event type&apos;s settings</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <EventTypeForm mode="edit" initial={eventType} />
      </div>
    </div>
  )
}
