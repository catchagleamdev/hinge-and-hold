// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AnalysisButton from '@/components/AnalysisButton'

const CONTACT_OPTIONS = ['Fat', 'Pure', 'Thin']
const MISS_OPTIONS = ['Left', 'Right', 'Long', 'Short']
const LIE_SLOPE_OPTIONS = ['Flat', 'Uphill', 'Downhill']
const BALL_POSITION_OPTIONS = ['Level', 'Above Feet', 'Below Feet']
const PROXIMITY_OPTIONS = ['Inside 1 ft', '1–3 ft', '3–6 ft', '6–10 ft', '11 ft+']
const LIE_SURFACE_OPTIONS = ['Fairway', 'Fringe', 'Rough']
const CLUB_OPTIONS = ['PW', 'GW', 'AW', 'SW', 'LW']

function ToggleCheckboxGroup({ name, options }: { name: string; options: string[] }) {
  const cols = options.length === 4 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className={`grid ${cols} gap-2`}>
      {options.map(opt => (
        <label key={opt} className="cursor-pointer">
          <input type="checkbox" name={name} value={opt} className="sr-only peer" />
          <span className="flex items-center justify-center min-h-[44px] text-base rounded-xl border border-[#1a4731] bg-white text-[#1a4731] peer-checked:bg-[#1a4731] peer-checked:text-[#f5e6c8] select-none transition-colors">
            {opt}
          </span>
        </label>
      ))}
    </div>
  )
}

export default async function SessionPage({ params }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) notFound()

  const { data: shots } = await supabase
    .from('shots')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  const shotList = shots ?? []

  async function addShot(formData) {
    'use server'
    const supabase = await createClient()
    const contacts = formData.getAll('contact')
    const misses = formData.getAll('miss_direction')
    const lieSlope = formData.getAll('lie_slope')
    const ballPosition = formData.getAll('ball_position')
    await supabase.from('shots').insert({
      session_id: id,
      contact: contacts.length > 0 ? contacts : null,
      miss_direction: misses.length > 0 ? misses : null,
      proximity: formData.get('proximity') || null,
      lie_surface: formData.get('lie_surface') || null,
      lie_slope: lieSlope.length > 0 ? lieSlope : null,
      ball_position: ballPosition.length > 0 ? ballPosition : null,
      club: formData.get('club') || null,
      notes: formData.get('notes') || null,
    })
    redirect(`/session/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Home</a>
        <span className="text-[#f5e6c8] text-sm font-medium">
          {session.session_date}
        </span>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* Shot list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#1a1a1a]">
              Shots logged: {shotList.length}
            </h2>
          </div>

          {shotList.length > 0 ? (
            <div className="space-y-2">
              {shotList.map((shot, i) => (
                <div key={shot.id} className="bg-white rounded-xl border border-[#1a4731]/20 px-4 py-3 flex flex-wrap gap-x-3 gap-y-1 items-center">
                  <span className="text-[#4a4a4a] text-sm font-medium">#{i + 1}</span>
                  {shot.club && (
                    <span className="text-[#1a1a1a] text-sm font-semibold">{shot.club}</span>
                  )}
                  {shot.lie_surface && (
                    <span className="text-[#4a4a4a] text-sm">{shot.lie_surface}</span>
                  )}
                  {shot.lie_slope && shot.lie_slope.length > 0 && (
                    <span className="text-[#4a4a4a] text-sm">{shot.lie_slope.join(', ')}</span>
                  )}
                  {shot.ball_position && shot.ball_position.length > 0 && (
                    <span className="text-[#4a4a4a] text-sm">{shot.ball_position.join(', ')}</span>
                  )}
                  {shot.contact && shot.contact.length > 0 && (
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded-md ${
                        shot.contact.includes('Fat')
                          ? 'text-[#8b0000] bg-[#8b0000]/10'
                          : 'text-[#1a4731] bg-[#1a4731]/10'
                      }`}
                    >
                      {shot.contact.join(', ')}
                    </span>
                  )}
                  {shot.miss_direction && shot.miss_direction.length > 0 && (
                    <span className="text-[#4a4a4a] text-sm">{shot.miss_direction.join(', ')}</span>
                  )}
                  {shot.proximity && (
                    <span
                      className={`text-sm ml-auto ${
                        shot.proximity === '11 ft+' ? 'text-[#8b0000] font-medium' : 'text-[#4a4a4a]'
                      }`}
                    >
                      {shot.proximity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#4a4a4a] text-base text-center py-4">No shots yet. Log your first.</p>
          )}
        </div>

        {/* Quick Analysis — client component */}
        <AnalysisButton shots={shotList} />

        {/* Save Session */}
        <a
          href={`/session/${id}/summary`}
          className="flex items-center justify-center w-full min-h-[52px] bg-[#1a4731] text-[#f5e6c8] text-base font-semibold rounded-2xl"
        >
          Save Session
        </a>

        {/* Shot form */}
        <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5">
          <h3 className="text-base font-semibold text-[#1a1a1a] mb-5">Log a Shot</h3>
          <form action={addShot} className="space-y-5">

            {/* Contact */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Contact</label>
              <ToggleCheckboxGroup name="contact" options={CONTACT_OPTIONS} />
            </div>

            {/* Miss */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Miss</label>
              <ToggleCheckboxGroup name="miss_direction" options={MISS_OPTIONS} />
            </div>

            {/* Lie Slope */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Lie Slope</label>
              <ToggleCheckboxGroup name="lie_slope" options={LIE_SLOPE_OPTIONS} />
            </div>

            {/* Ball Position */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Ball Position</label>
              <ToggleCheckboxGroup name="ball_position" options={BALL_POSITION_OPTIONS} />
            </div>

            {/* Proximity */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Proximity</label>
              <select
                name="proximity"
                className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
              >
                <option value="">— select —</option>
                {PROXIMITY_OPTIONS.map(p => (
                  <option
                    key={p}
                    value={p}
                    style={p === '11 ft+' ? { color: '#8b0000' } : undefined}
                  >
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Lie Surface */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Surface</label>
              <select
                name="lie_surface"
                className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
              >
                <option value="">— select —</option>
                {LIE_SURFACE_OPTIONS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Club */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Club</label>
              <select
                name="club"
                className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
              >
                <option value="">— select —</option>
                {CLUB_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Notes</label>
              <input
                type="text"
                name="notes"
                placeholder="Optional"
                className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] bg-[#1a4731] text-[#f5e6c8] text-base font-semibold rounded-2xl"
            >
              Log Shot
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
