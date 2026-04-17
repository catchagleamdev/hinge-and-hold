import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const CLUBS = ['Driver','3W','5W','4i','5i','6i','7i','8i','9i','PW','GW','SW','LW','Putter']
const SHOT_TYPES = ['Full','Punch','Chip','Pitch','Flop','Bunker','Putt']
const CONTACT_OPTIONS = ['Pure','Thin','Fat','Toe','Heel','Top']
const MISS_OPTIONS = ['Left','Right','Long','Short','Pull','Push','Hook','Slice']
const LIE_OPTIONS = ['Tee','Fairway','Rough','Bunker','Fringe','Green']

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) notFound()

  const { data: shots } = await db
    .from('shots')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  async function addShot(formData: FormData) {
    'use server'
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const misses = formData.getAll('miss_direction') as string[]
    await db.from('shots').insert({
      session_id: id,
      contact: (formData.get('contact') as string) || null,
      miss_direction: misses.length > 0 ? misses : null,
      proximity: (formData.get('proximity') as string) || null,
      lie: (formData.get('lie') as string) || null,
      shot_type: (formData.get('shot_type') as string) || null,
      club: (formData.get('club') as string) || null,
      notes: (formData.get('notes') as string) || null,
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
              {shots.map((shot: any, i: number) => (
                <div key={shot.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-sm flex flex-wrap gap-2 items-center">
                  <span className="font-medium text-gray-400">#{i + 1}</span>
                  {shot.club && <span className="font-medium">{shot.club}</span>}
                  {shot.shot_type && <span className="text-gray-500">{shot.shot_type}</span>}
                  {shot.lie && <span className="text-gray-400">{shot.lie}</span>}
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
          <form action={addShot} className="grid grid-cols-2 gap-4">
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Lie</label>
              <select name="lie" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">—</option>
                {LIE_OPTIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
              <select name="contact" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">—</option>
                {CONTACT_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Miss Direction (hold Ctrl/Cmd for multi)</label>
              <select name="miss_direction" multiple className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-24">
                {MISS_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Proximity</label>
              <input type="text" name="proximity" placeholder="e.g. 6ft, 20yds"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input type="text" name="notes"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2">
              <button type="submit" className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                Log Shot
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
