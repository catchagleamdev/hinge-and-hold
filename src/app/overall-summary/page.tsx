// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PROXIMITY_ORDER = ['Inside 1 ft', '1–3 ft', '3–6 ft', '6–10 ft', '11 ft+']

function StatBar({ label, count, total, danger }: { label: string; count: number; total: number; danger?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${danger ? 'text-[#8b0000]' : 'text-[#1a1a1a]'}`}>{label}</span>
        <span className="text-[#4a4a4a]">{count} shots ({pct}%)</span>
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

export default async function OverallSummaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_date, session_type')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })

  const sessionIds = (sessions ?? []).map(s => s.id)
  const sessionCount = sessionIds.length

  let shots: any[] = []
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from('shots')
      .select('contact, miss_direction, proximity')
      .in('session_id', sessionIds)
    shots = data ?? []
  }

  const totalShots = shots.length

  // Contact breakdown (contact is text[])
  const contactCounts = { Fat: 0, Pure: 0, Thin: 0 }
  shots.forEach(s => {
    if (s.contact) {
      s.contact.forEach((c: string) => {
        if (c in contactCounts) contactCounts[c as keyof typeof contactCounts]++
      })
    }
  })

  // Miss breakdown
  const missCounts: Record<string, number> = {}
  shots.forEach(s => {
    if (s.miss_direction) {
      s.miss_direction.forEach((m: string) => {
        missCounts[m] = (missCounts[m] || 0) + 1
      })
    }
  })

  // Proximity breakdown
  const proximityCounts: Record<string, number> = {}
  shots.forEach(s => {
    if (s.proximity) proximityCounts[s.proximity] = (proximityCounts[s.proximity] || 0) + 1
  })

  const shotsMissed = shots.filter(s => s.miss_direction && s.miss_direction.length > 0).length
  const mostCommonContact = Object.entries(contactCounts).sort((a, b) => b[1] - a[1])[0]
  const mostCommonMiss = Object.entries(missCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Home</a>
        <h1 className="text-[#f5e6c8] text-lg font-bold">Overall Summary</h1>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {totalShots === 0 ? (
          <div className="text-center py-16 text-[#4a4a4a] text-base">
            No shots logged yet. Start a chipping session.
          </div>
        ) : (
          <>
            {/* Totals */}
            <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1a4731]">{totalShots}</p>
                  <p className="text-sm text-[#4a4a4a] mt-1">Total Shots</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1a4731]">{sessionCount}</p>
                  <p className="text-sm text-[#4a4a4a] mt-1">Sessions</p>
                </div>
              </div>
            </div>

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
            {(mostCommonContact || mostCommonMiss) && (
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
      </main>
    </div>
  )
}
