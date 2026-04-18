// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AnalysisButton from '@/components/AnalysisButton'
import ShotForm from '@/components/ShotForm'

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

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Home</a>
        <span className="text-[#f5e6c8] text-sm font-medium">{session.session_date}</span>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* Shot list */}
        <div>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">
            Shots logged: {shotList.length}
          </h2>
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

        {/* Quick Analysis */}
        <AnalysisButton shots={shotList} />

        {/* Save Session */}
        <a
          href={`/session/${id}/summary`}
          className="flex items-center justify-center w-full min-h-[52px] bg-[#1a4731] text-[#f5e6c8] text-base font-semibold rounded-2xl"
        >
          Save Session
        </a>

        {/* Shot form — client component with state persistence */}
        <ShotForm sessionId={id} />

      </main>
    </div>
  )
}
