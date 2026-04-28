// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClubPickerClient from './ClubPickerClient'

export default async function NewSessionPage({ searchParams }) {
  const sp = await searchParams
  const type = sp?.type === 'putting' ? 'putting' : 'chipping'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clubs } = await supabase
    .from('user_clubs')
    .select('id, label, notes')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!clubs || clubs.length === 0) {
    redirect('/bag?empty=1')
  }

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Home</a>
        <h1 className="text-[#f5e6c8] text-base font-bold">
          {type === 'putting' ? 'New Putting Session' : 'New Chipping Session'}
        </h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <ClubPickerClient clubs={clubs} sessionType={type} />
      </main>
    </div>
  )
}
