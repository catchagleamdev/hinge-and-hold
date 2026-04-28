'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomeButton({
  sessionId,
  table,
}: {
  sessionId: string
  table: 'shots' | 'putts'
}) {
  const router = useRouter()

  async function handleHome() {
    const supabase = createClient()
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    if (count === 0) {
      await supabase.from('sessions').delete().eq('id', sessionId)
    }

    router.push('/home')
  }

  return (
    <button
      onClick={handleHome}
      className="text-[#f5e6c8] text-base min-h-[44px] flex items-center"
    >
      ← Home
    </button>
  )
}
