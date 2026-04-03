import { NextRequest, NextResponse } from 'next/server'
import { getBookingByToken } from '@/lib/store'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const booking = await getBookingByToken(params.token)
  if (!booking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(booking)
}
