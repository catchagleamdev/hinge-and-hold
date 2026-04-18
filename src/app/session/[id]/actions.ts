'use server'
import { createClient } from '@/lib/supabase/server'

type ShotData = {
  contact: string[] | null
  miss_direction: string[] | null
  proximity: string | null
  lie_surface: string | null
  lie_slope: string[] | null
  ball_position: string[] | null
  club: string | null
  notes: string | null
}

export async function addShot(sessionId: string, data: ShotData) {
  const supabase = await createClient()
  await supabase.from('shots').insert({
    session_id: sessionId,
    ...data,
  })
}
