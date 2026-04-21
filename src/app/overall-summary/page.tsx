// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PROXIMITY_ORDER = ['Inside 1 ft', '1–3 ft', '3–6 ft', '6–10 ft', '11 ft+']
const PUTT_LENGTH_ORDER = ['Inside 1 ft', '1–2 ft', '2–3 ft', '3–5 ft', '5–8 ft', '8–12 ft', '12–20 ft', '20 ft+']

function StatBar({ label, count, total, danger }: { label: string; count: number; total: number; danger?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${danger ? 'text-[#8b0000]' : 'text-[#1a1a1a]'}`}>{label}</span>
        <span className="text-[#4a4a4a]">{count} ({pct}%)</span>
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

function comboLabel(slope: string, brk: string) {
  const breakPart = brk === 'Straight' ? 'Straight' : `${brk} Break`
  return `${slope} + ${breakPart}`
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

  const allSessions = sessions ?? []
  const chippingSessions = allSessions.filter(s => s.session_type === 'chipping')
  const puttingSessions = allSessions.filter(s => s.session_type === 'putting')

  const chippingIds = chippingSessions.map(s => s.id)
  const puttingIds = puttingSessions.map(s => s.id)

  // Chipping data
  let shots: any[] = []
  if (chippingIds.length > 0) {
    const { data } = await supabase
      .from('shots')
      .select('contact, miss_direction, proximity')
      .in('session_id', chippingIds)
    shots = data ?? []
  }

  // Putting data — include slope + break for combo stats
  let putts: any[] = []
  if (puttingIds.length > 0) {
    const { data } = await supabase
      .from('putts')
      .select('result, miss_direction, putt_length, slope, break')
      .in('session_id', puttingIds)
    putts = data ?? []
  }

  const totalShots = shots.length
  const totalPutts = putts.length

  // --- Chipping stats ---
  const contactCounts = { Fat: 0, Pure: 0, Thin: 0 }
  shots.forEach(s => {
    if (s.contact) {
      s.contact.forEach((c: string) => {
        if (c in contactCounts) contactCounts[c as keyof typeof contactCounts]++
      })
    }
  })

  const chipMissCounts: Record<string, number> = {}
  shots.forEach(s => {
    if (s.miss_direction) {
      s.miss_direction.forEach((m: string) => {
        chipMissCounts[m] = (chipMissCounts[m] || 0) + 1
      })
    }
  })

  const proximityCounts: Record<string, number> = {}
  shots.forEach(s => {
    if (s.proximity) proximityCounts[s.proximity] = (proximityCounts[s.proximity] || 0) + 1
  })

  const shotsMissed = shots.filter(s => s.miss_direction && s.miss_direction.length > 0).length
  const mostCommonContact = Object.entries(contactCounts).sort((a, b) => b[1] - a[1])[0]
  const mostCommonChipMiss = Object.entries(chipMissCounts).sort((a, b) => b[1] - a[1])[0]

  // --- Putting stats ---
  const puttsMade = putts.filter(p => p.result === 'Made 🎯').length
  const missedOrLipOut = putts.filter(p => p.result === 'Missed' || p.result === 'Lip Out')

  const makeByLength: Record<string, { made: number; total: number }> = {}
  putts.forEach(p => {
    if (!p.putt_length) return
    if (!makeByLength[p.putt_length]) makeByLength[p.putt_length] = { made: 0, total: 0 }
    makeByLength[p.putt_length].total++
    if (p.result === 'Made 🎯') makeByLength[p.putt_length].made++
  })

  // Miss direction (Missed + Lip Out only)
  const puttMissCounts: Record<string, number> = {}
  missedOrLipOut.forEach(p => {
    if (p.miss_direction) {
      p.miss_direction.forEach((m: string) => {
        puttMissCounts[m] = (puttMissCounts[m] || 0) + 1
      })
    }
  })

  // Slope + break combo
  const comboCounts: Record<string, number> = {}
  putts.forEach(p => {
    if (p.slope && p.break) {
      const key = comboLabel(p.slope, p.break)
      comboCounts[key] = (comboCounts[key] || 0) + 1
    }
  })
  const topCombo = Object.entries(comboCounts).sort((a, b) => b[1] - a[1])[0]
  const topPuttMiss = Object.entries(puttMissCounts).sort((a, b) => b[1] - a[1])[0]

  const hasChipping = totalShots > 0
  const hasPutting = totalPutts > 0
  const hasAnything = hasChipping || hasPutting

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Home</a>
        <h1 className="text-[#f5e6c8] text-lg font-bold">Overall Summary</h1>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {!hasAnything ? (
          <div className="text-center py-16 text-[#4a4a4a] text-base">
            No sessions logged yet. Start chipping or putting.
          </div>
        ) : (
          <>
            {/* ── Chipping ── */}
            {hasChipping && (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-[#1a4731]">Chipping</h2>
                  <div className="flex-1 h-px bg-[#1a4731]/20" />
                </div>

                <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#1a4731]">{totalShots}</p>
                      <p className="text-sm text-[#4a4a4a] mt-1">Total Shots</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#1a4731]">{chippingSessions.length}</p>
                      <p className="text-sm text-[#4a4a4a] mt-1">Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                  <h3 className="text-base font-semibold text-[#1a1a1a]">Contact</h3>
                  <StatBar label="Pure" count={contactCounts.Pure} total={totalShots} />
                  <StatBar label="Thin" count={contactCounts.Thin} total={totalShots} />
                  <StatBar label="Fat" count={contactCounts.Fat} total={totalShots} danger />
                </div>

                {Object.keys(chipMissCounts).length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">Miss Direction</h3>
                    {Object.entries(chipMissCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([miss, count]) => (
                        <StatBar key={miss} label={miss} count={count} total={shotsMissed} />
                      ))}
                  </div>
                )}

                {Object.keys(proximityCounts).length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">Proximity</h3>
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

                {(mostCommonContact || mostCommonChipMiss) && (
                  <div className="bg-[#1a4731] rounded-2xl p-5">
                    <h3 className="text-[#f5e6c8] text-base font-semibold mb-2">Pattern</h3>
                    <p className="text-[#f5e6c8] text-base leading-relaxed">
                      {mostCommonContact && mostCommonContact[1] > 0 && (
                        <>Most common contact: <strong>{mostCommonContact[0]}</strong>.</>
                      )}
                      {mostCommonChipMiss && mostCommonChipMiss[1] > 0 && (
                        <> Most common miss: <strong>{mostCommonChipMiss[0]}</strong>.</>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── Putting ── */}
            {hasPutting && (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-[#1a4731]">Putting</h2>
                  <div className="flex-1 h-px bg-[#1a4731]/20" />
                </div>

                <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#1a4731]">{totalPutts}</p>
                      <p className="text-sm text-[#4a4a4a] mt-1">Total Putts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#1a4731]">{puttingSessions.length}</p>
                      <p className="text-sm text-[#4a4a4a] mt-1">Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                  <h3 className="text-base font-semibold text-[#1a1a1a]">Overall Make %</h3>
                  <StatBar label="Made" count={puttsMade} total={totalPutts} />
                </div>

                {Object.keys(makeByLength).length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">Make % by Distance</h3>
                    {PUTT_LENGTH_ORDER.filter(l => makeByLength[l]).map(l => (
                      <StatBar
                        key={l}
                        label={l}
                        count={makeByLength[l].made}
                        total={makeByLength[l].total}
                      />
                    ))}
                  </div>
                )}

                {missedOrLipOut.length > 0 && Object.keys(puttMissCounts).length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">Miss Direction (Missed + Lip Out)</h3>
                    {Object.entries(puttMissCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([miss, count]) => (
                        <StatBar key={miss} label={miss} count={count} total={missedOrLipOut.length} />
                      ))}
                  </div>
                )}

                {(topCombo || topPuttMiss) && (
                  <div className="bg-[#1a4731] rounded-2xl p-5">
                    <h3 className="text-[#f5e6c8] text-base font-semibold mb-2">Pattern</h3>
                    <p className="text-[#f5e6c8] text-base leading-relaxed">
                      {topCombo && topCombo[1] > 0 && (
                        <>Most putts were <strong>{topCombo[0]}</strong>.</>
                      )}
                      {topPuttMiss && topPuttMiss[1] > 0 && (
                        <> You missed mostly <strong>{topPuttMiss[0]}</strong>.</>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
