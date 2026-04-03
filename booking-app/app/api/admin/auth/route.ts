import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createSessionToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const action = url.pathname.endsWith('/logout') ? 'logout' : 'login'

  if (action === 'logout') {
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    })
    return response
  }

  // Login
  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { password } = body
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = createSessionToken()

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    maxAge: 86400, // 24 hours
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
