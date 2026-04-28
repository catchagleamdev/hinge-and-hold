'use server'
import { createClient } from '@/lib/supabase/server'

export async function createSession(
  sessionType: 'chipping' | 'putting',
  selectedClubs: string[]
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('sessions')
    .insert({
      session_date: new Date().toISOString().split('T')[0],
      user_id: user.id,
      session_type: sessionType,
      selected_clubs: selectedClubs.length > 0 ? selectedClubs : null,
    })
    .select()
    .single()

  return data?.id ?? null
}
