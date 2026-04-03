import { NextResponse } from 'next/server'
import { buildZohoAuthUrl } from '@/lib/zoho'

export async function GET() {
  const url = await buildZohoAuthUrl()
  return NextResponse.redirect(url)
}
