import { NextRequest, NextResponse } from 'next/server'
import { saveTokens } from '@/lib/token-store'
import { getTokens } from '@/lib/token-store'
import { listCalendars } from '@/lib/zoho'
import { ZohoTokens } from '@/lib/types'

const ZOHO_TOKEN_ENDPOINT = 'https://accounts.zoho.com/oauth/v2/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('[zoho/callback] OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?zoho=error&message=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?zoho=error&message=no_code`
    )
  }

  // Exchange code for tokens
  const params = new URLSearchParams({
    code,
    client_id: process.env.ZOHO_CLIENT_ID ?? '',
    client_secret: process.env.ZOHO_CLIENT_SECRET ?? '',
    redirect_uri: process.env.ZOHO_REDIRECT_URI ?? '',
    grant_type: 'authorization_code',
  })

  try {
    const res = await fetch(`${ZOHO_TOKEN_ENDPOINT}?${params.toString()}`, {
      method: 'POST',
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[zoho/callback] Token exchange failed:', text)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?zoho=error&message=token_exchange_failed`
      )
    }

    const data = await res.json()
    console.log('[zoho/callback] Token exchange response keys:', Object.keys(data))
    console.log('[zoho/callback] Has access_token:', !!data.access_token)
    console.log('[zoho/callback] Has refresh_token:', !!data.refresh_token)

    if (!data.access_token) {
      console.error('[zoho/callback] No access_token in response:', JSON.stringify(data))
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?zoho=error&message=no_access_token`
      )
    }

    if (!data.refresh_token) {
      console.error('[zoho/callback] No refresh_token — Zoho did not return one. This usually means re-auth without prompt=consent.')
    }

    const tokens: ZohoTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? '',
      expires_at: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
    }

    await saveTokens(tokens)

    // Try to set default calendar
    try {
      const existing = await getTokens()
      if (!existing?.calendar_id) {
        const calendars = await listCalendars()
        if (calendars.length > 0) {
          await saveTokens({ ...tokens, calendar_id: calendars[0].id })
        }
      }
    } catch (err) {
      console.error('[zoho/callback] Failed to fetch calendars (continuing):', err)
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?zoho=connected`
    )
  } catch (err) {
    console.error('[zoho/callback] Unexpected error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?zoho=error&message=unexpected_error`
    )
  }
}
