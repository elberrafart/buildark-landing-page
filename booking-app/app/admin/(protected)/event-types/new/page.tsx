import EventTypeForm from '../EventTypeForm'

export default function NewEventTypePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne text-2xl font-bold text-navy">New Event Type</h1>
        <p className="text-muted text-sm mt-1">Create a new booking type for your calendar</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <EventTypeForm mode="create" />
      </div>
    </div>
  )
}
