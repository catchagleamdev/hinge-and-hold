// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const CLUBS = ['Driver','3W','5W','4i','5i','6i','7i','8i','9i','PW','GW','SW','LW','Putter']
const SHOT_TYPES = ['Full','Punch','Chip','Pitch','Flop','Bunker','Putt']
const CONTACT_OPTIONS = ['Pure','Thin','Fat','Toe','Heel','Top']
const MISS_OPTIONS = ['Left','Right','Long','Short','Pull','Push','Hook','Slice']
const LIE_SURFACE_OPTIONS = ['Tee','Fairway','Rough','Bunker','Fringe','Green']
const LIE_SLOPE_OPTIONS = ['Flat','Uphill','Downhill']
const BALL_POSITION_OPTIONS = ['Level','Above Feet','Below Feet']

function ToggleRadio({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label key={opt} className="cursor-pointer">
          <input type="radio" name={name} value={opt} className="sr-only peer" />
          <span className="inline-block px-3 py-1.5 text-sm border border-gray-300 rounded-md select-none transition-colors peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600 hover:border-gray-400">
            {opt}
          </span>
        </label>
      ))}
    </div>
  )
}

function ToggleCheckbox({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label key={opt} className="cursor-pointer">
          <input type="checkbox" name={name} value={opt} className="sr-only peer" />
          <span className="inline-block px-3 py-1.5 text-sm border border-gray-300 rounded-md select-none transition-colors peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600 hover:border-gray-400">
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
    .single()

  if (!session) notFound()

  const { data: shots } = await supabase
    .from('shots')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  async function addShot(formData) {
    'use server'
    const supabase = await createClient()
    const misses = formData.getAll('miss_direction')
    const lieSlope = formData.getAll('lie_slope')
    const ballPosition = formData.getAll('ball_position')
    await supabase.from('shots').insert({
      session_id: id,
      contact: formData.get('contact') || null,
      miss_direction: misses.length > 0 ? misses : null,
      proximity: formData.get('proximity') || null,
      lie_surface: formData.get('lie_surface') || null,
      lie_slope: lieSlope.length > 0 ? lieSlope : null,
      ball_position: ballPosition.length > 0 ? ballPosition : null,
      shot_type: formData.get('shot_type') || null,
      club: formData.get('club') || null,
      notes: formData.get('notes') || null,
    })
    redirect(`/dashboard/sessions/${id}`)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Sessions</a>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">{session.session_date}</h2>
          {session.location && <p className="text-sm text-gray-500 mt-0.5">{session.location}</p>}
          {session.notes && <p className="text-sm text-gray-600 mt-2">{session.notes}</p>}
        </div>

        <div>
          <h3 className="text-base font-medium mb-3">Shots ({shots?.length ?? 0})</h3>
          {shots && shots.length > 0 ? (
            <div className="space-y-2 mb-6">
              {shots.map((shot, i) => (
                <div key={shot.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-sm flex flex-wrap gap-2 items-center">
                  <span className="font-medium text-gray-400">#{i + 1}</span>
                  {shot.club && <span className="font-medium">{shot.club}</span>}
                  {shot.shot_type && <span className="text-gray-500">{shot.shot_type}</span>}
                  {shot.lie_surface && <span className="text-gray-400">{shot.lie_surface}</span>}
                  {shot.lie_slope && shot.lie_slope.length > 0 && (
                    <span className="text-gray-400">{shot.lie_slope.join(', ')}</span>
                  )}
                  {shot.ball_position && shot.ball_position.length > 0 && (
                    <span className="text-gray-400">{shot.ball_position.join(', ')}</span>
                  )}
                  {shot.contact && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{shot.contact}</span>}
                  {shot.miss_direction && shot.miss_direction.length > 0 && (
                    <span className="text-orange-500">{shot.miss_direction.join(', ')}</span>
                  )}
                  {shot.proximity && <span className="text-gray-400 ml-auto">{shot.proximity}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-6">No shots logged yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-medium mb-4">Log a Shot</h3>
          <form action={addShot} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Club</label>
                <select name="club" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">—</option>
                  {CLUBS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Shot Type</label>
                <select name="shot_type" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">—</option>
                  {SHOT_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lie Surface</label>
                <select name="lie_surface" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">—</option>
                  {LIE_SURFACE_OPTIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proximity</label>
                <input type="text" name="proximity" placeholder="e.g. 6ft, 20yds"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Contact</label>
              <ToggleRadio name="contact" options={CONTACT_OPTIONS} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Miss Direction</label>
              <ToggleCheckbox name="miss_direction" options={MISS_OPTIONS} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Lie Slope</label>
              <ToggleCheckbox name="lie_slope" options={LIE_SLOPE_OPTIONS} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Ball Position</label>
              <ToggleCheckbox name="ball_position" options={BALL_POSITION_OPTIONS} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input type="text" name="notes"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <button type="submit" className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              Log Shot
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
