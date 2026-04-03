export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateSlots } from '@/lib/slots'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventTypeId = searchParams.get('eventTypeId')
  const date = searchParams.get('date')
  const timezone = searchParams.get('timezone')

  if (!eventTypeId || !date || !timezone) {
    return NextResponse.json(
      { error: 'Missing required query params: eventTypeId, date, timezone' },
      { status: 400 }
    )
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYY-MM-DD' },
      { status: 400 }
    )
  }

  try {
    const slots = await generateSlots({ eventTypeId, date, timezone })
    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[api/slots] Error:', err)
    return NextResponse.json({ error: 'Failed to generate slots' }, { status: 500 })
  }
}
