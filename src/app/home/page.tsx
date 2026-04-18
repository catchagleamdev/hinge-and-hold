// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MethodBanner from '@/components/MethodBanner'
import SessionList from '@/components/SessionList'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_date, session_type, location')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .limit(50)

  async function createChippingSession() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data } = await supabase
      .from('sessions')
      .insert({
        session_date: new Date().toISOString().split('T')[0],
        user_id: user.id,
        session_type: 'chipping',
      })
      .select()
      .single()

    if (data) redirect(`/session/${data.id}`)
  }

  async function createPuttingSession() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data } = await supabase
      .from('sessions')
      .insert({
        session_date: new Date().toISOString().split('T')[0],
        user_id: user.id,
        session_type: 'putting',
      })
      .select()
      .single()

    if (data) redirect(`/putting/${data.id}`)
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <h1 className="text-[#f5e6c8] text-xl font-bold tracking-wide">Hinge &amp; Hold</h1>
        <div className="flex items-center gap-5">
          <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium">Field Guide</a>
          <form action={signOut}>
            <button type="submit" className="text-[#f5e6c8] text-sm opacity-60">Sign out</button>
          </form>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-8 gap-4 max-w-md mx-auto w-full">
        <MethodBanner />

        <form action={createChippingSession} className="w-full">
          <button
            type="submit"
            className="w-full min-h-[60px] bg-[#1a4731] text-[#f5e6c8] text-lg font-semibold rounded-2xl flex items-center justify-center"
          >
            New Chipping Session
          </button>
        </form>

        <form action={createPuttingSession} className="w-full">
          <button
            type="submit"
            className="w-full min-h-[60px] bg-white border-2 border-[#1a4731] text-[#1a4731] text-lg font-semibold rounded-2xl flex items-center justify-center"
          >
            New Putting Session
          </button>
        </form>

        <a
          href="/coming-soon"
          className="w-full min-h-[60px] bg-white border-2 border-[#1a4731]/40 text-[#1a4731]/60 text-lg font-semibold rounded-2xl flex items-center justify-center"
        >
          New Pitching Session
        </a>

        <a
          href="/overall-summary"
          className="w-full min-h-[60px] bg-white border-2 border-[#1a4731] text-[#1a4731] text-lg font-semibold rounded-2xl flex items-center justify-center"
        >
          Overall Summary
        </a>

        {/* Session list with delete */}
        {sessions && sessions.length > 0 && (
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-[#4a4a4a] mb-3 uppercase tracking-wide">
              Past Sessions
            </h2>
            <SessionList initialSessions={sessions} />
          </div>
        )}
      </main>
    </div>
  )
}
