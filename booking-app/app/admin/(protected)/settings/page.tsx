'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ZohoStatus {
  connected: boolean
  calendarId: string | null
  calendars: Array<{ id: string; name: string }> | null
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const zohoParam = searchParams.get('zoho')

  const [status, setStatus] = useState<ZohoStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [savingCalendar, setSavingCalendar] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (zohoParam === 'connected') {
      setToast('Zoho Calendar connected successfully!')
      setTimeout(() => setToast(''), 5000)
    } else if (zohoParam === 'error') {
      setToast('Failed to connect Zoho Calendar. Please try again.')
      setTimeout(() => setToast(''), 5000)
    }
  }, [zohoParam])

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zoho/status')
      if (res.ok) setStatus(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Zoho Calendar? New bookings will not be synced.')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/zoho/disconnect', { method: 'POST' })
      if (res.ok) {
        setStatus({ connected: false, calendarId: null, calendars: null })
        setToast('Zoho Calendar disconnected.')
        setTimeout(() => setToast(''), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSelectCalendar = async (calendarId: string) => {
    setSavingCalendar(true)
    try {
      const res = await fetch('/api/zoho/select-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId }),
      })
      if (res.ok) {
        setStatus((s) => s ? { ...s, calendarId } : s)
        setToast('Calendar updated.')
        setTimeout(() => setToast(''), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingCalendar(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={[
          'fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-semibold transition-all',
          toast.includes('success') || toast.includes('updated') || toast.includes('disconnected')
            ? 'bg-teal text-white'
            : 'bg-red-500 text-white',
        ].join(' ')}>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-syne text-2xl font-bold text-navy">Settings</h1>
        <p className="text-muted text-sm mt-1">Configure integrations and app settings</p>
      </div>

      {/* Zoho Calendar section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-syne font-bold text-navy">Zoho Calendar</h2>
          <p className="text-muted text-xs mt-1">
            Connect your Zoho Calendar to automatically create events when bookings are made.
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted">
              <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Checking connection status...</span>
            </div>
          ) : status?.connected ? (
            <div className="space-y-4">
              {/* Connected badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-light rounded-full">
                  <div className="w-2 h-2 rounded-full bg-teal" />
                  <span className="text-xs font-semibold text-teal-dark">Connected</span>
                </div>
                <span className="text-sm text-muted">Zoho Calendar is synced with your bookings</span>
              </div>

              {/* Calendar selector */}
              {status.calendars && status.calendars.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Active Calendar
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={status.calendarId ?? ''}
                      onChange={(e) => handleSelectCalendar(e.target.value)}
                      disabled={savingCalendar}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    >
                      <option value="">Select a calendar...</option>
                      {status.calendars.map((cal) => (
                        <option key={cal.id} value={cal.id}>{cal.name}</option>
                      ))}
                    </select>
                    {savingCalendar && (
                      <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin self-center" />
                    )}
                  </div>
                </div>
              )}

              {/* Disconnect */}
              <div className="pt-2">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect Zoho Calendar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Disconnected state */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-xs font-semibold text-muted">Not connected</span>
                </div>
              </div>

              <p className="text-sm text-muted">
                Connect Zoho Calendar to automatically create calendar events and manage your availability.
              </p>

              <a
                href="/api/zoho/connect"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-syne font-bold text-sm rounded-lg hover:bg-teal-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect Zoho Calendar
              </a>

              <div className="bg-surface border border-gray-200 rounded-lg p-4 text-xs text-muted">
                <p className="font-semibold text-navy mb-1">Setup required</p>
                <p>You need <code className="bg-gray-100 px-1 py-0.5 rounded">ZOHO_CLIENT_ID</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">ZOHO_CLIENT_SECRET</code>, and <code className="bg-gray-100 px-1 py-0.5 rounded">ZOHO_REDIRECT_URI</code> set in your environment.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking page link */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-syne font-bold text-navy mb-2">Booking Page</h2>
        <p className="text-sm text-muted mb-3">Share this link with clients to let them book sessions.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-surface border border-gray-200 rounded-lg px-3 py-2 text-navy">
            {typeof window !== 'undefined' ? window.location.origin : 'https://bookings.buildark.dev'}
          </code>
          <button
            onClick={() => {
              const url = typeof window !== 'undefined' ? window.location.origin : ''
              navigator.clipboard.writeText(url)
              setToast('Copied!')
              setTimeout(() => setToast(''), 2000)
            }}
            className="px-3 py-2 bg-surface border border-gray-200 rounded-lg text-sm text-muted hover:text-navy hover:border-gray-300 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}
