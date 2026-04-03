export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAvailability } from '@/lib/store'

export async function GET() {
  const availability = await getAvailability()
  return NextResponse.json(availability)
}
