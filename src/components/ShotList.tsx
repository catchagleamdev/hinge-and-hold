'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AnalysisButton from '@/components/AnalysisButton'

type Shot = {
  id: string
  club: string | null
  lie_surface: string | null
  lie_slope: string[] | null
  ball_position: string[] | null
  contact: string[] | null
  miss_direction: string[] | null
  proximity: string | null
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

export default function ShotList({
  initialShots,
}: {
  initialShots: Shot[]
}) {
  const [shots, setShots] = useState(initialShots)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Sync when a shot is added (router.refresh() from ShotForm changes initialShots)
  // Using joined IDs as dep so this only fires when the set of shots changes server-side,
  // not when we remove one locally (since we don't call router.refresh() on delete).
  const shotIds = initialShots.map(s => s.id).join(',')
  useEffect(() => {
    setShots(initialShots)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotIds])

  async function handleDelete(shotId: string) {
    const confirmed = window.confirm('Remove this shot?')
    if (!confirmed) return

    setDeletingId(shotId)
    const supabase = createClient()
    await supabase.from('shots').delete().eq('id', shotId)

    // Update UI immediately — no router.refresh() needed
    setShots(prev => prev.filter(s => s.id !== shotId))
    setDeletingId(null)
  }

  return (
    <>
      <div>
        <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">
          Shots logged: {shots.length}
        </h2>

        {shots.length > 0 ? (
          <div className="space-y-2">
            {shots.map((shot, i) => (
              <div
                key={shot.id}
                className="bg-white rounded-xl border border-[#1a4731]/20 px-4 py-3 flex flex-wrap gap-x-3 gap-y-1 items-center"
              >
                <span className="text-[#4a4a4a] text-sm font-medium">#{i + 1}</span>

                {shot.club && (
                  <span className="text-[#1a1a1a] text-sm font-semibold">{shot.club}</span>
                )}
                {shot.lie_surface && (
                  <span className="text-[#4a4a4a] text-sm">{shot.lie_surface}</span>
                )}
                {shot.lie_slope && shot.lie_slope.length > 0 && (
                  <span className="text-[#4a4a4a] text-sm">{shot.lie_slope.join(', ')}</span>
                )}
                {shot.ball_position && shot.ball_position.length > 0 && (
                  <span className="text-[#4a4a4a] text-sm">{shot.ball_position.join(', ')}</span>
                )}
                {shot.contact && shot.contact.length > 0 && (
                  <span
                    className={`text-sm font-medium px-2 py-0.5 rounded-md ${
                      shot.contact.includes('Fat')
                        ? 'text-[#8b0000] bg-[#8b0000]/10'
                        : 'text-[#1a4731] bg-[#1a4731]/10'
                    }`}
                  >
                    {shot.contact.join(', ')}
                  </span>
                )}
                {shot.miss_direction && shot.miss_direction.length > 0 && (
                  <span className="text-[#4a4a4a] text-sm">
                    {shot.miss_direction.join(', ')}
                  </span>
                )}
                {shot.proximity && (
                  <span
                    className={`text-sm ${
                      shot.proximity === '11 ft+' ? 'text-[#8b0000] font-medium' : 'text-[#4a4a4a]'
                    }`}
                  >
                    {shot.proximity}
                  </span>
                )}

                {/* Trash — pushed to far right */}
                <button
                  onClick={() => handleDelete(shot.id)}
                  disabled={deletingId === shot.id}
                  aria-label="Remove shot"
                  className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8b0000] disabled:opacity-40"
                >
                  {deletingId === shot.id
                    ? <span className="text-xs text-[#4a4a4a]">…</span>
                    : <TrashIcon />
                  }
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#4a4a4a] text-base text-center py-4">
            No shots yet. Log your first.
          </p>
        )}
      </div>

      {/* AnalysisButton reads from local shots so count stays accurate after deletes */}
      <AnalysisButton shots={shots} />
    </>
  )
}
