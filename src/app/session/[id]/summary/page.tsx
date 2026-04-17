// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const PROXIMITY_ORDER = ['Inside 1 ft', '1–3 ft', '3–6 ft', '6–10 ft', '11 ft+']

function StatBar({ label, count, total, danger }: { label: string; count: number; total: number; danger?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${danger ? 'text-[#8b0000]' : 'text-[#1a1a1a]'}`}>{label}</span>
        <span className="text-[#4a4a4a]">{pct}%</span>
      </div>
      <div className="h-3 bg-[#f5e6c8] rounded-full overflow-hidden border border-[#1a4731]/20">
        <div
          className={`h-full rounded-full ${danger ? 'bg-[#8b0000]' : 'bg-[#1a4731]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default async function SessionSummaryPage({ params }) {
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
  const totalShots = shotList.length

  // Contact breakdown
  const contactCounts = { Fat: 0, Pure: 0, Thin: 0 }
  shotList.forEach(s => {
    if (s.contact && s.contact in contactCounts) contactCounts[s.contact]++
  })

  // Miss breakdown
  const missCounts: Record<string, number> = {}
  shotList.forEach(s => {
    if (s.miss_direction) {
      s.miss_direction.forEach((m: string) => {
        missCounts[m] = (missCounts[m] || 0) + 1
      })
    }
  })
  const shotsMissed = shotList.filter(s => s.miss_direction && s.miss_direction.length > 0).length

  // Proximity breakdown
  const proximityCounts: Record<string, number> = {}
  shotList.forEach(s => {
    if (s.proximity) proximityCounts[s.proximity] = (proximityCounts[s.proximity] || 0) + 1
  })

  // Pattern callout
  const mostCommonContact = Object.entries(contactCounts).sort((a, b) => b[1] - a[1])[0]
  const mostCommonMiss = Object.entries(missCounts).sort((a, b) => b[1] - a[1])[0]

  async function finish(formData) {
    'use server'
    const supabase = await createClient()
    const comments = formData.get('comments') as string
    if (comments?.trim()) {
      await supabase.from('sessions').update({ notes: comments }).eq('id', id)
    }
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href={`/session/${id}`} className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Back</a>
        <h1 className="text-[#f5e6c8] text-lg font-bold">Session Summary</h1>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* Shot count */}
        <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 text-center">
          <p className="text-4xl font-bold text-[#1a4731]">{totalShots}</p>
          <p className="text-[#4a4a4a] text-base mt-1">shots logged</p>
          <p className="text-[#4a4a4a] text-sm mt-1">{session.session_date}</p>
        </div>

        {totalShots > 0 && (
          <>
            {/* Contact breakdown */}
            <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
              <h2 className="text-base font-semibold text-[#1a1a1a]">Contact</h2>
              <StatBar label="Pure" count={contactCounts.Pure} total={totalShots} />
              <StatBar label="Thin" count={contactCounts.Thin} total={totalShots} />
              <StatBar label="Fat" count={contactCounts.Fat} total={totalShots} danger />
            </div>

            {/* Miss breakdown */}
            {Object.keys(missCounts).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Miss Direction</h2>
                {Object.entries(missCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([miss, count]) => (
                    <StatBar key={miss} label={miss} count={count} total={shotsMissed} />
                  ))}
              </div>
            )}

            {/* Proximity breakdown */}
            {Object.keys(proximityCounts).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Proximity</h2>
                {PROXIMITY_ORDER.filter(p => proximityCounts[p]).map(p => (
                  <StatBar
                    key={p}
                    label={p}
                    count={proximityCounts[p]}
                    total={totalShots}
                    danger={p === '11 ft+'}
                  />
                ))}
              </div>
            )}

            {/* Pattern callout */}
            {(mostCommonContact?.[1] > 0 || mostCommonMiss?.[1] > 0) && (
              <div className="bg-[#1a4731] rounded-2xl p-5">
                <h2 className="text-[#f5e6c8] text-base font-semibold mb-2">Pattern</h2>
                <p className="text-[#f5e6c8] text-base leading-relaxed">
                  {mostCommonContact && mostCommonContact[1] > 0 && (
                    <>Most common contact: <strong>{mostCommonContact[0]}</strong>.</>
                  )}
                  {mostCommonMiss && mostCommonMiss[1] > 0 && (
                    <> Most common miss: <strong>{mostCommonMiss[0]}</strong>.</>
                  )}
                </p>
              </div>
            )}
          </>
        )}

        {/* Comments + Done */}
        <form action={finish} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">How did it feel?</label>
            <textarea
              name="comments"
              rows={4}
              placeholder="How did it feel? What worked? What didn't?"
              defaultValue={session.notes ?? ''}
              className="w-full border border-[#1a4731] rounded-xl px-4 py-3 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731] resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[52px] bg-[#1a4731] text-[#f5e6c8] text-base font-semibold rounded-2xl"
          >
            Done
          </button>
        </form>

      </main>
    </div>
  )
}
