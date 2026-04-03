export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getBlockedDates } from '@/lib/store'

export async function GET() {
  const blockedDates = await getBlockedDates()
  // Return only upcoming blocked dates
  const today = new Date().toISOString().split('T')[0]
  const upcoming = blockedDates.filter((bd) => bd.date >= today)
  return NextResponse.json(upcoming)
}
