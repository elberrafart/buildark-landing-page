export interface EventType {
  id: string
  slug: string
  name: string
  description: string
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  color: string
  is_active: boolean
  location_type: 'zoho_meeting' | 'google_meet' | 'zoom' | 'phone' | 'in_person'
  location_details?: string
  created_at: string
}

export interface Availability {
  id: string
  day_of_week: number // 0=Sun...6=Sat
  start_time: string  // "09:00"
  end_time: string    // "17:00"
  is_active: boolean
}

export interface BlockedDate {
  id: string
  date: string // "YYYY-MM-DD"
  reason?: string
  created_at: string
}

export interface Booking {
  id: string
  event_type_id: string
  booker_name: string
  booker_email: string
  booker_notes?: string
  start_time: string // ISO8601 UTC
  end_time: string   // ISO8601 UTC
  timezone: string
  status: 'confirmed' | 'cancelled' | 'rescheduled'
  zoho_event_id?: string
  meet_link?: string
  cancellation_token: string
  created_at: string
}

export interface ZohoTokens {
  access_token: string
  refresh_token: string
  expires_at: string // ISO8601
  calendar_id?: string
}
