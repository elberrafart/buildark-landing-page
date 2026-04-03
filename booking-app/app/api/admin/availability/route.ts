import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'
import { getAvailability, upsertAvailability } from '@/lib/store'

function requireAdmin(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin_session')
  if (!cookie?.value) return false
  return verifySessionToken(cookie.value)
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const availability = await getAvailability()
  return NextResponse.json(availability)
}

export async function PUT(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    day_of_week?: number
    start_time?: string
    end_time?: string
    is_active?: boolean
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { day_of_week } = body

  if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
    return NextResponse.json(
      { error: 'day_of_week must be 0-6' },
      { status: 400 }
    )
  }

  const updated = await upsertAvailability(day_of_week, {
    start_time: body.start_time,
    end_time: body.end_time,
    is_active: body.is_active,
  })

  return NextResponse.json(updated)
}
