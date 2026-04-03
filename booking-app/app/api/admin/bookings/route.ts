import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'
import { getBookings } from '@/lib/store'

function requireAdmin(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin_session')
  if (!cookie?.value) return false
  return verifySessionToken(cookie.value)
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? undefined

  const bookings = await getBookings(status)

  // Sort by start_time descending (most recent first)
  bookings.sort((a, b) => b.start_time.localeCompare(a.start_time))

  return NextResponse.json(bookings)
}
