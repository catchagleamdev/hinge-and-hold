// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ShotList from '@/components/ShotList'
import ShotForm from '@/components/ShotForm'
import HomeButton from '@/components/HomeButton'

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
  const clubs: string[] = session.selected_clubs ?? []

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <HomeButton sessionId={id} table="shots" />
        <span className="text-[#f5e6c8] text-sm font-medium">{session.session_date}</span>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium min-h-[44px] flex items-center">Field Guide</a>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* Shot list with delete + analysis button */}
        <ShotList initialShots={shotList} />

        {/* Save Session */}
        <a
          href={`/session/${id}/summary`}
          className="flex items-center justify-center w-full min-h-[52px] bg-[#1a4731] text-[#f5e6c8] text-base font-semibold rounded-2xl"
        >
          Save Session
        </a>

        {/* Shot form — client component with state persistence */}
        <ShotForm sessionId={id} clubs={clubs} />

      </main>
    </div>
  )
}
