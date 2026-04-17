import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type SessionRow = Database['public']['Tables']['sessions']['Row']
type SessionWithCount = SessionRow & { shots: [{ count: number }] }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, shots(count)')
    .returns<SessionWithCount[]>()
    .order('session_date', { ascending: false })
    .limit(20)

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hinge &amp; Hold</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </form>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Sessions</h2>
          <a href="/dashboard/sessions/new" className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
            + New Session
          </a>
        </div>
        {sessions && sessions.length > 0 ? (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li key={session.id}>
                <a href={`/dashboard/sessions/${session.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{session.session_date}</p>
                      {session.location && <p className="text-sm text-gray-500 mt-0.5">{session.location}</p>}
                    </div>
                    <span className="text-sm text-gray-400">
                      {session.shots[0]?.count ?? 0} shots
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">No sessions yet. Log your first round.</div>
        )}
      </main>
    </div>
  )
}
