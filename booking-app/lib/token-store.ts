import fs from 'fs/promises'
import path from 'path'
import { ZohoTokens } from './types'

const TOKEN_FILE = path.join(process.cwd(), '.zoho-tokens.json')

// In-memory cache — survives within a Lambda instance, lost on cold start
let memoryCache: ZohoTokens | null = null

export async function getTokens(): Promise<ZohoTokens | null> {
  // 1. In-memory cache (fastest, current instance)
  if (memoryCache?.access_token && memoryCache?.refresh_token) {
    return memoryCache
  }

  // 2. File (local dev)
  try {
    const raw = await fs.readFile(TOKEN_FILE, 'utf-8')
    const tokens = JSON.parse(raw) as ZohoTokens
    if (tokens.access_token && tokens.refresh_token) {
      memoryCache = tokens
      return tokens
    }
  } catch {
    // File doesn't exist — fall through
  }

  // 3. Read live from Vercel API (reads current values, not baked-in deploy-time values)
  const tokens = await readTokensFromVercelApi()
  if (tokens) {
    memoryCache = tokens
    return tokens
  }

  return null
}

async function readTokensFromVercelApi(): Promise<ZohoTokens | null> {
  const vercelToken = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!vercelToken || !projectId) return null

  try {
    const teamQ = teamId ? `?teamId=${teamId}` : ''
    const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env${teamQ}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    if (!listRes.ok) return null

    const listData = await listRes.json()
    const envVars: Array<{ id: string; key: string }> = listData.envs ?? []

    const keys = ['ZOHO_ACCESS_TOKEN', 'ZOHO_REFRESH_TOKEN', 'ZOHO_TOKEN_EXPIRES_AT', 'ZOHO_CALENDAR_ID']
    const zohoVars = envVars.filter(e => keys.includes(e.key))

    const hasAccess = zohoVars.find(e => e.key === 'ZOHO_ACCESS_TOKEN')
    const hasRefresh = zohoVars.find(e => e.key === 'ZOHO_REFRESH_TOKEN')
    if (!hasAccess || !hasRefresh) return null

    // Fetch decrypted values in parallel
    const decryptQ = teamId ? `?decrypt=1&teamId=${teamId}` : '?decrypt=1'
    const values: Record<string, string> = {}
    await Promise.all(
      zohoVars.map(async (v) => {
        try {
          const res = await fetch(
            `https://api.vercel.com/v9/projects/${projectId}/env/${v.id}${decryptQ}`,
            { headers: { Authorization: `Bearer ${vercelToken}` } }
          )
          if (res.ok) {
            const data = await res.json()
            values[v.key] = data.value ?? ''
          }
        } catch {
          // skip
        }
      })
    )

    const access_token = values['ZOHO_ACCESS_TOKEN']
    const refresh_token = values['ZOHO_REFRESH_TOKEN']
    if (!access_token || !refresh_token) return null

    return {
      access_token,
      refresh_token,
      expires_at: values['ZOHO_TOKEN_EXPIRES_AT'] ?? new Date(Date.now() + 3600 * 1000).toISOString(),
      calendar_id: values['ZOHO_CALENDAR_ID'],
    }
  } catch (err) {
    console.error('[token-store] Failed to read tokens from Vercel API:', err)
    return null
  }
}

export async function saveTokens(tokens: ZohoTokens): Promise<void> {
  // Always update in-memory cache so the current instance uses new tokens immediately
  memoryCache = tokens

  // Try file (local dev)
  try {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8')
    return // succeeded — local dev, done
  } catch {
    // Read-only filesystem on Vercel — fall through to Vercel API persistence
  }

  // Persist to Vercel env vars so tokens survive cold starts
  await persistToVercelEnv(tokens)
}

export async function clearTokens(): Promise<void> {
  memoryCache = null
  try {
    await fs.unlink(TOKEN_FILE)
  } catch {
    // File may not exist
  }
}

async function persistToVercelEnv(tokens: ZohoTokens): Promise<void> {
  const vercelToken = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!vercelToken || !projectId) {
    console.warn('[token-store] VERCEL_TOKEN/VERCEL_PROJECT_ID not set — tokens will not persist across cold starts')
    return
  }

  const teamQ = teamId ? `?teamId=${teamId}` : ''

  try {
    // Get existing env var IDs so we can PATCH rather than create duplicates
    const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env${teamQ}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    const listData = await listRes.json()
    const existing: Array<{ id: string; key: string }> = listData.envs ?? []

    const toUpsert: Record<string, string> = {
      ZOHO_ACCESS_TOKEN: tokens.access_token,
      ZOHO_REFRESH_TOKEN: tokens.refresh_token,
      ZOHO_TOKEN_EXPIRES_AT: tokens.expires_at,
      ...(tokens.calendar_id ? { ZOHO_CALENDAR_ID: tokens.calendar_id } : {}),
    }

    for (const [key, value] of Object.entries(toUpsert)) {
      if (!value) {
        console.warn(`[token-store] Skipping ${key} — value is empty`)
        continue
      }
      const found = existing.find(e => e.key === key)
      if (found) {
        const r = await fetch(
          `https://api.vercel.com/v9/projects/${projectId}/env/${found.id}${teamQ}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, target: ['production', 'preview'], type: 'encrypted' }),
          }
        )
        console.log(`[token-store] PATCH ${key}: ${r.status}`)
      } else {
        const r = await fetch(
          `https://api.vercel.com/v10/projects/${projectId}/env${teamQ}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value, type: 'encrypted', target: ['production', 'preview'] }),
          }
        )
        const body = await r.json().catch(() => ({}))
        console.log(`[token-store] POST ${key}: ${r.status}`, JSON.stringify(body).slice(0, 100))
      }
    }

    console.log('[token-store] Zoho tokens persisted to Vercel env vars')
  } catch (err) {
    console.error('[token-store] Failed to persist tokens to Vercel:', err)
  }
}
