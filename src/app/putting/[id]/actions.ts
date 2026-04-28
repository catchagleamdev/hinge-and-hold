'use server'
import { createClient } from '@/lib/supabase/server'

type PuttData = {
  result: string | null
  miss_direction: string[] | null
  putt_length: string | null
  green_speed: string | null
  slope: string | null
  break: string | null
  miss_distance: string | null
  notes: string | null
}

export async function addPutt(sessionId: string, data: PuttData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('putts').insert({
    session_id: sessionId,
    ...data,
  })
}
