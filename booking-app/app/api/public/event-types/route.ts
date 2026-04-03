export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getEventTypes, getEventTypeBySlug, getEventTypeById } from '@/lib/store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  if (slug) {
    const eventType = await getEventTypeBySlug(slug)
    if (!eventType || !eventType.is_active) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(eventType)
  }

  if (id) {
    const eventType = await getEventTypeById(id)
    if (!eventType || !eventType.is_active) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(eventType)
  }

  const eventTypes = await getEventTypes()
  return NextResponse.json(eventTypes.filter((et) => et.is_active))
}
