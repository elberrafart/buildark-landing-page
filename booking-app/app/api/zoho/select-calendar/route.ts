import { NextRequest, NextResponse } from 'next/server'
import { getTokens, saveTokens } from '@/lib/token-store'

export async function POST(request: NextRequest) {
  let body: { calendarId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { calendarId } = body
  if (!calendarId) {
    return NextResponse.json({ error: 'Missing calendarId' }, { status: 400 })
  }

  const tokens = await getTokens()
  if (!tokens) {
    return NextResponse.json({ error: 'Zoho not connected' }, { status: 400 })
  }

  await saveTokens({ ...tokens, calendar_id: calendarId })
  return NextResponse.json({ success: true })
}
