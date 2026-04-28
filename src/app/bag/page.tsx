// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BagClient from './BagClient'

export default async function BagPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clubs } = await supabase
    .from('user_clubs')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const sp = await searchParams
  const showEmptyMessage = sp?.empty === '1'

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base min-h-[44px] flex items-center">← Home</a>
        <h1 className="text-[#f5e6c8] text-base font-bold">My Bag 🎒</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {showEmptyMessage && (
          <div className="mb-4 bg-[#c9a84c]/20 border border-[#c9a84c] rounded-xl px-4 py-3 text-sm text-[#1a1a1a]">
            Add your clubs to My Bag before starting a session.
          </div>
        )}
        <BagClient initialClubs={clubs ?? []} userId={user.id} />
      </main>
    </div>
  )
}
