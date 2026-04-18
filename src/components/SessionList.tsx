'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Session = {
  id: string
  session_date: string
  session_type: string
  location: string | null
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

export default function SessionList({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState(initialSessions)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(sessionId: string) {
    const confirmed = window.confirm(
      'Delete this session and all its shots? This cannot be undone.'
    )
    if (!confirmed) return

    setDeletingId(sessionId)
    const supabase = createClient()

    // Delete shots first (FK constraint), then session
    await supabase.from('shots').delete().eq('session_id', sessionId)
    await supabase.from('sessions').delete().eq('id', sessionId)

    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setDeletingId(null)
  }

  if (sessions.length === 0) {
    return (
      <p className="text-[#4a4a4a] text-sm text-center py-2">
        No sessions yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map(session => (
        <div key={session.id} className="flex items-center gap-2">
          <a
            href={`/session/${session.id}`}
            className="flex-1 min-h-[52px] bg-white rounded-xl border border-[#1a4731]/20 px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[#1a1a1a] text-base font-medium">{session.session_date}</p>
              {session.location && (
                <p className="text-[#4a4a4a] text-sm truncate">{session.location}</p>
              )}
            </div>
            <span className="text-[#4a4a4a] text-sm capitalize flex-shrink-0">
              {session.session_type}
            </span>
          </a>

          <button
            onClick={() => handleDelete(session.id)}
            disabled={deletingId === session.id}
            aria-label="Delete session"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8b0000] disabled:opacity-40 flex-shrink-0"
          >
            {deletingId === session.id
              ? <span className="text-xs text-[#4a4a4a]">…</span>
              : <TrashIcon />
            }
          </button>
        </div>
      ))}
    </div>
  )
}
