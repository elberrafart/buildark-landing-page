import Link from 'next/link'
import { getEventTypes } from '@/lib/store'
import { EventType } from '@/lib/types'

function ArkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      <path d="M4 20 C4 20 14 8 24 20" stroke="#00B4D8" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M2 20 L26 20" stroke="#00B4D8" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M10 20 L10 14 L14 10 L18 14 L18 20" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

function LocationIcon({ type }: { type: EventType['location_type'] }) {
  if (type === 'google_meet' || type === 'zoom') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
  if (type === 'phone') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    </svg>
  )
}

function locationLabel(type: EventType['location_type']): string {
  switch (type) {
    case 'zoho_meeting': return 'Zoho Meeting'
    case 'google_meet': return 'Google Meet'
    case 'zoom': return 'Zoom'
    case 'phone': return 'Phone call'
    case 'in_person': return 'In person'
    default: return type
  }
}

export default async function HomePage() {
  const allEventTypes = await getEventTypes()
  const eventTypes = allEventTypes.filter((et) => et.is_active)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="bg-navy relative overflow-hidden">
        {/* Teal glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-dark/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <ArkIcon />
            <span className="font-syne text-2xl font-bold tracking-widest text-teal uppercase">
              BuildArk
            </span>
          </div>

          <h1 className="font-syne text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Schedule time with Raz
          </h1>
          <p className="text-teal-light/80 text-lg max-w-md mx-auto">
            Pick a session type below to get started. All times are shown in your local timezone.
          </p>
        </div>
      </header>

      {/* Event Type Cards */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {eventTypes.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <p className="text-lg">No sessions available right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {eventTypes.map((et) => (
              <Link
                key={et.id}
                href={`/${et.slug}`}
                className="group block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden"
              >
                {/* Colored top border */}
                <div className="h-1" style={{ backgroundColor: et.color }} />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-syne text-xl font-bold text-navy group-hover:text-teal-dark transition-colors">
                      {et.name}
                    </h2>
                    {/* Duration badge */}
                    <span className="ml-3 flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-light text-teal-dark">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {et.duration_minutes} min
                    </span>
                  </div>

                  <p className="text-muted text-sm leading-relaxed mb-4">
                    {et.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <LocationIcon type={et.location_type} />
                      {locationLabel(et.location_type)}
                    </span>

                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-dark group-hover:gap-2 transition-all">
                      Book this
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-muted">
          Powered by{' '}
          <a href="https://buildark.dev" className="text-teal-dark hover:text-teal transition-colors font-semibold" target="_blank" rel="noopener noreferrer">
            BuildArk
          </a>
        </p>
      </footer>
    </div>
  )
}
