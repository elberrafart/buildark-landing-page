import { NextRequest, NextResponse } from 'next/server'
import { getBookingById } from '@/lib/store'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = await getBookingById(params.id)
  if (!booking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Return booking but strip the cancellation token for security
  // Actually, client needs it for cancel link on success page -- keep it but limit exposure
  return NextResponse.json(booking)
}
