import crypto from 'crypto'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function getSecret(): string {
  return process.env.ADMIN_PASSWORD ?? 'changeme'
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? 'changeme'
  return password === expected
}

export function createSessionToken(): string {
  const timestamp = Date.now().toString()
  const hmac = crypto
    .createHmac('sha256', getSecret())
    .update(timestamp)
    .digest('hex')
  return `${timestamp}.${hmac}`
}

export function verifySessionToken(token: string): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [timestamp, hmac] = parts

  // Check not expired
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return false
  if (Date.now() - ts > SESSION_DURATION_MS) return false

  // Verify HMAC
  const expectedHmac = crypto
    .createHmac('sha256', getSecret())
    .update(timestamp)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  )
}
