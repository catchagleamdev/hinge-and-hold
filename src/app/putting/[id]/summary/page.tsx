// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const PUTT_LENGTH_ORDER = ['Under 3 ft', '3–6 ft', '6–10 ft', '10–20 ft', '20 ft+']

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

export default async function PuttingSummaryPage({ params }) {
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

  const { data: putts } = await supabase
    .from('putts')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  const puttList = putts ?? []
  const totalPutts = puttList.length
  const madeCount = puttList.filter(p => p.result === 'Made 🎯').length
  const missedPutts = puttList.filter(p => p.result === 'Missed')

  // Make % by putt length
  const makeByLength: Record<string, { made: number; total: number }> = {}
  puttList.forEach(p => {
    if (!p.putt_length) return
    if (!makeByLength[p.putt_length]) makeByLength[p.putt_length] = { made: 0, total: 0 }
    makeByLength[p.putt_length].total++
    if (p.result === 'Made 🎯') makeByLength[p.putt_length].made++
  })

  // Miss direction breakdown (missed putts only)
  const missCounts: Record<string, number> = {}
  missedPutts.forEach(p => {
    if (p.miss_direction) {
      p.miss_direction.forEach((m: string) => {
        missCounts[m] = (missCounts[m] || 0) + 1
      })
    }
  })

  // Most common slope + break combination
  const comboCounts: Record<string, number> = {}
  puttList.forEach(p => {
    if (p.slope && p.break) {
      const key = `${p.slope} / ${p.break}`
      comboCounts[key] = (comboCounts[key] || 0) + 1
    }
  })
  const topCombo = Object.entries(comboCounts).sort((a, b) => b[1] - a[1])[0]

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
        <a href={`/putting/${id}`} className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Back</a>
        <h1 className="text-[#f5e6c8] text-lg font-bold">Session Summary</h1>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* Putt count + make % */}
        <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 text-center">
          <p className="text-4xl font-bold text-[#1a4731]">{totalPutts}</p>
          <p className="text-[#4a4a4a] text-base mt-1">putts logged</p>
          <p className="text-[#4a4a4a] text-sm mt-1">{session.session_date}</p>
        </div>

        {totalPutts > 0 && (
          <>
            {/* Overall make % */}
            <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
              <h2 className="text-base font-semibold text-[#1a1a1a]">Make %</h2>
              <StatBar label="Made" count={madeCount} total={totalPutts} />
            </div>

            {/* Make % by putt length */}
            {Object.keys(makeByLength).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Make % by Distance</h2>
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

            {/* Miss direction breakdown */}
            {missedPutts.length > 0 && Object.keys(missCounts).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5 space-y-4">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Miss Direction</h2>
                {Object.entries(missCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([miss, count]) => (
                    <StatBar key={miss} label={miss} count={count} total={missedPutts.length} />
                  ))}
              </div>
            )}

            {/* Most common slope + break */}
            {topCombo && (
              <div className="bg-[#1a4731] rounded-2xl p-5">
                <h2 className="text-[#f5e6c8] text-base font-semibold mb-2">Pattern</h2>
                <p className="text-[#f5e6c8] text-base leading-relaxed">
                  Most common read: <strong>{topCombo[0]}</strong> ({topCombo[1]} putt{topCombo[1] !== 1 ? 's' : ''}).
                </p>
              </div>
            )}
          </>
        )}

        {/* Comments + Done */}
        <form action={finish} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">What did you notice? What worked?</label>
            <textarea
              name="comments"
              rows={4}
              placeholder="What did you notice? What worked?"
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
