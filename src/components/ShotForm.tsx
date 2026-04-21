'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addShot } from '@/app/session/[id]/actions'

const CONTACT_OPTIONS = ['Fat', 'Pure', 'Thin']
const MISS_OPTIONS = ['Left', 'Right', 'Long', 'Short', 'Lip Out']
const LIE_SLOPE_OPTIONS = ['Flat', 'Uphill', 'Downhill']
const BALL_POSITION_OPTIONS = ['Level', 'Above Feet', 'Below Feet']
const PROXIMITY_OPTIONS = ['Holed Out 🏆', 'Inside 1 ft', '1–3 ft', '3–6 ft', '6–10 ft', '11 ft+']
const LIE_SURFACE_OPTIONS = ['Fairway', 'Fringe', 'Rough']
const CLUB_OPTIONS = ['PW', 'GW', 'AW', 'SW', 'LW']

function ToggleGroup({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const cols = options.length === 4 ? 'grid-cols-2' : 'grid-cols-3'

  function toggle(opt: string) {
    onChange(
      selected.includes(opt)
        ? selected.filter(v => v !== opt)
        : [...selected, opt]
    )
  }

  return (
    <div className={`grid ${cols} gap-2`}>
      {options.map(opt => (
        <label key={opt} className="cursor-pointer">
          <input
            type="checkbox"
            value={opt}
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="sr-only peer"
            readOnly={false}
          />
          <span className="flex items-center justify-center min-h-[44px] text-base rounded-xl border border-[#1a4731] bg-white text-[#1a4731] peer-checked:bg-[#1a4731] peer-checked:text-[#f5e6c8] select-none transition-colors">
            {opt}
          </span>
        </label>
      ))}
    </div>
  )
}

type Persisted = {
  club: string
  lie_surface: string
  lie_slope: string[]
  ball_position: string[]
}

const EMPTY_PERSISTED: Persisted = {
  club: '',
  lie_surface: '',
  lie_slope: [],
  ball_position: [],
}

export default function ShotForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [celebrationKey, setCelebrationKey] = useState(0)

  // Persisted across shots
  const [persisted, setPersisted] = useState<Persisted>(EMPTY_PERSISTED)

  // Reset after every shot
  const [contact, setContact] = useState<string[]>([])
  const [miss, setMiss] = useState<string[]>([])
  const [proximity, setProximity] = useState('')
  const [notes, setNotes] = useState('')

  function clearAll() {
    setPersisted(EMPTY_PERSISTED)
    setContact([])
    setMiss([])
    setProximity('')
    setNotes('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addShot(sessionId, {
        contact: contact.length > 0 ? contact : null,
        miss_direction: miss.length > 0 ? miss : null,
        proximity: proximity || null,
        lie_surface: persisted.lie_surface || null,
        lie_slope: persisted.lie_slope.length > 0 ? persisted.lie_slope : null,
        ball_position: persisted.ball_position.length > 0 ? persisted.ball_position : null,
        club: persisted.club || null,
        notes: notes || null,
      })
      // Reset per-shot fields; persisted fields stay
      setContact([])
      setMiss([])
      setProximity('')
      setNotes('')
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-[#1a1a1a]">Log a Shot</h3>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-[#4a4a4a] min-h-[44px] px-2"
        >
          Clear All
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Contact — resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Contact</label>
          <ToggleGroup options={CONTACT_OPTIONS} selected={contact} onChange={setContact} />
        </div>

        {/* Miss — resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Miss</label>
          <ToggleGroup options={MISS_OPTIONS} selected={miss} onChange={setMiss} />
        </div>

        {/* Lie Slope — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Lie Slope</label>
          <ToggleGroup
            options={LIE_SLOPE_OPTIONS}
            selected={persisted.lie_slope}
            onChange={v => setPersisted(p => ({ ...p, lie_slope: v }))}
          />
        </div>

        {/* Ball Position — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Ball Position</label>
          <ToggleGroup
            options={BALL_POSITION_OPTIONS}
            selected={persisted.ball_position}
            onChange={v => setPersisted(p => ({ ...p, ball_position: v }))}
          />
        </div>

        {/* Proximity — resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Proximity</label>
          {/* key changes on each "Holed Out" selection → re-mounts → CSS animation restarts */}
          <div key={celebrationKey} className={proximity === 'Holed Out 🏆' ? 'animate-holed-out rounded-xl' : ''}>
            <select
              value={proximity}
              onChange={e => {
                const val = e.target.value
                setProximity(val)
                if (val === 'Holed Out 🏆') setCelebrationKey(k => k + 1)
              }}
              className={`w-full min-h-[44px] border rounded-xl px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 ${
                proximity === 'Holed Out 🏆'
                  ? 'border-[#c9a84c] text-[#c9a84c] focus:ring-[#c9a84c]'
                  : 'border-[#1a4731] text-[#1a1a1a] focus:ring-[#1a4731]'
              }`}
            >
              <option value="">— select —</option>
              {PROXIMITY_OPTIONS.map(p => (
                <option
                  key={p}
                  value={p}
                  style={
                    p === 'Holed Out 🏆' ? { color: '#c9a84c' } :
                    p === '11 ft+' ? { color: '#8b0000' } :
                    undefined
                  }
                >
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lie Surface — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Surface</label>
          <select
            value={persisted.lie_surface}
            onChange={e => setPersisted(p => ({ ...p, lie_surface: e.target.value }))}
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="">— select —</option>
            {LIE_SURFACE_OPTIONS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Club — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Club</label>
          <select
            value={persisted.club}
            onChange={e => setPersisted(p => ({ ...p, club: e.target.value }))}
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="">— select —</option>
            {CLUB_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Notes — resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional"
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full min-h-[52px] bg-[#1a4731] text-[#f5e6c8] text-base font-semibold rounded-2xl disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Log Shot'}
        </button>
      </form>
    </div>
  )
}
