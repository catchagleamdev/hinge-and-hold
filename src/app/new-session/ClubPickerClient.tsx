'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from './actions'

type Club = { id: string; label: string; notes: string | null }

export default function ClubPickerClient({
  clubs,
  sessionType,
}: {
  clubs: Club[]
  sessionType: 'chipping' | 'putting'
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  function toggle(label: string) {
    setSelected(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  function handleStart() {
    startTransition(async () => {
      const localDate = new Date().toLocaleDateString('en-CA')
      const sessionId = await createSession(sessionType, selected, localDate)
      if (sessionId) {
        const dest = sessionType === 'putting' ? `/putting/${sessionId}` : `/session/${sessionId}`
        router.push(dest)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-1">Which clubs today?</h2>
        <p className="text-sm text-[#4a4a4a]">Select the clubs you're working with this session.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {clubs.map(club => {
          const isSelected = selected.includes(club.label)
          return (
            <button
              key={club.id}
              type="button"
              onClick={() => toggle(club.label)}
              className={`min-h-[52px] px-5 text-base font-semibold rounded-2xl border-2 transition-colors select-none ${
                isSelected
                  ? 'bg-[#1a4731] border-[#1a4731] text-[#f5e6c8]'
                  : 'bg-white border-[#1a4731] text-[#1a4731]'
              }`}
            >
              <span>{club.label}</span>
              {club.notes && (
                <span className={`block text-xs font-normal mt-0.5 ${isSelected ? 'text-[#f5e6c8]/70' : 'text-[#4a4a4a]'}`}>
                  {club.notes}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={isPending || selected.length === 0}
        className="w-full min-h-[60px] bg-[#1a4731] text-[#f5e6c8] text-lg font-semibold rounded-2xl disabled:opacity-50"
      >
        {isPending ? 'Starting…' : `Start Session →`}
      </button>
    </div>
  )
}
