import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'
import { getEventTypes, createEventType } from '@/lib/store'

function requireAdmin(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin_session')
  if (!cookie?.value) return false
  return verifySessionToken(cookie.value)
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const eventTypes = await getEventTypes()
  return NextResponse.json(eventTypes)
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    slug?: string
    name?: string
    description?: string
    duration_minutes?: number
    buffer_before_minutes?: number
    buffer_after_minutes?: number
    color?: string
    is_active?: boolean
    location_type?: string
    location_details?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, slug, description, duration_minutes, location_type } = body

  if (!name || !slug || !description || !duration_minutes || !location_type) {
    return NextResponse.json(
      { error: 'Missing required fields: name, slug, description, duration_minutes, location_type' },
      { status: 400 }
    )
  }

  const validLocationTypes = ['google_meet', 'zoom', 'phone', 'in_person']
  if (!validLocationTypes.includes(location_type)) {
    return NextResponse.json({ error: 'Invalid location_type' }, { status: 400 })
  }

  const eventType = await createEventType({
    name,
    slug,
    description,
    duration_minutes,
    buffer_before_minutes: body.buffer_before_minutes ?? 0,
    buffer_after_minutes: body.buffer_after_minutes ?? 0,
    color: body.color ?? '#00B4D8',
    is_active: body.is_active ?? true,
    location_type: location_type as 'google_meet' | 'zoom' | 'phone' | 'in_person',
    location_details: body.location_details,
  })

  return NextResponse.json(eventType, { status: 201 })
}
