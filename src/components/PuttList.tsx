'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Putt = {
  id: string
  result: string | null
  miss_direction: string[] | null
  putt_length: string | null
  green_speed: string | null
  slope: string | null
  break: string | null
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export default function PuttList({ initialPutts }: { initialPutts: Putt[] }) {
  const [putts, setPutts] = useState(initialPutts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const puttIds = initialPutts.map(p => p.id).join(',')
  useEffect(() => {
    setPutts(initialPutts)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puttIds])

  async function handleDelete(puttId: string) {
    const confirmed = window.confirm('Remove this putt?')
    if (!confirmed) return

    setDeletingId(puttId)
    const supabase = createClient()
    await supabase.from('putts').delete().eq('id', puttId)
    setPutts(prev => prev.filter(p => p.id !== puttId))
    setDeletingId(null)
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">
        Putts logged: {putts.length}
      </h2>

      {putts.length > 0 ? (
        <div className="space-y-2">
          {putts.map((putt, i) => (
            <div
              key={putt.id}
              className="bg-white rounded-xl border border-[#1a4731]/20 px-4 py-3 flex flex-wrap gap-x-3 gap-y-1 items-center"
            >
              <span className="text-[#4a4a4a] text-sm font-medium">#{i + 1}</span>

              {putt.result && (
                <span
                  className={`text-sm font-semibold ${
                    putt.result === 'Made 🎯' ? 'text-[#c9a84c]' : 'text-[#8b0000]'
                  }`}
                >
                  {putt.result}
                </span>
              )}
              {putt.putt_length && (
                <span className="text-[#4a4a4a] text-sm">{putt.putt_length}</span>
              )}
              {putt.slope && (
                <span className="text-[#4a4a4a] text-sm">{putt.slope}</span>
              )}
              {putt.break && (
                <span className="text-[#4a4a4a] text-sm">{putt.break}</span>
              )}
              {putt.green_speed && (
                <span className="text-[#4a4a4a] text-sm">{putt.green_speed}</span>
              )}
              {putt.miss_direction && putt.miss_direction.length > 0 && (
                <span className="text-[#8b0000] text-sm">
                  {putt.miss_direction.join(', ')}
                </span>
              )}

              <button
                onClick={() => handleDelete(putt.id)}
                disabled={deletingId === putt.id}
                aria-label="Remove putt"
                className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8b0000] disabled:opacity-40"
              >
                {deletingId === putt.id
                  ? <span className="text-xs text-[#4a4a4a]">…</span>
                  : <TrashIcon />
                }
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[#4a4a4a] text-base text-center py-4">
          No putts yet. Log your first.
        </p>
      )}
    </div>
  )
}
