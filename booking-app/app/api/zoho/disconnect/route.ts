import { NextResponse } from 'next/server'
import { clearTokens } from '@/lib/token-store'

export async function POST() {
  try {
    await clearTokens()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[zoho/disconnect] Error:', err)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
