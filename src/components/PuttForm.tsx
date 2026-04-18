'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPutt } from '@/app/putting/[id]/actions'

const MISS_OPTIONS = ['Left', 'Right', 'Long', 'Short']
const PUTT_LENGTH_OPTIONS = ['Under 3 ft', '3–6 ft', '6–10 ft', '10–20 ft', '20 ft+']
const GREEN_SPEED_OPTIONS = ['Slow', 'Medium', 'Fast']
const SLOPE_OPTIONS = ['Flat', 'Uphill', 'Downhill']
const BREAK_OPTIONS = ['Straight', 'Left', 'Right']

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
  putt_length: string
  green_speed: string
  slope: string
  break: string
}

const EMPTY_PERSISTED: Persisted = {
  putt_length: '',
  green_speed: '',
  slope: '',
  break: '',
}

export default function PuttForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Persisted across putts
  const [persisted, setPersisted] = useState<Persisted>(EMPTY_PERSISTED)

  // Resets on every submit
  const [result, setResult] = useState('')
  const [miss, setMiss] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  function clearAll() {
    setPersisted(EMPTY_PERSISTED)
    setResult('')
    setMiss([])
    setNotes('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addPutt(sessionId, {
        result: result || null,
        miss_direction: miss.length > 0 ? miss : null,
        putt_length: persisted.putt_length || null,
        green_speed: persisted.green_speed || null,
        slope: persisted.slope || null,
        break: persisted.break || null,
        notes: notes || null,
      })
      // Reset per-putt fields; persisted fields stay
      setResult('')
      setMiss([])
      setNotes('')
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-[#1a1a1a]">Log a Putt</h3>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-[#4a4a4a] min-h-[44px] px-2"
        >
          Clear All
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Result — radio-style, two large buttons, always resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Result</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="result"
                value="Made 🎯"
                checked={result === 'Made 🎯'}
                onChange={() => { setResult('Made 🎯'); setMiss([]) }}
                className="sr-only peer"
              />
              <span className={`flex items-center justify-center min-h-[52px] text-base font-semibold rounded-xl border-2 select-none transition-colors ${
                result === 'Made 🎯'
                  ? 'bg-[#c9a84c] border-[#c9a84c] text-white'
                  : 'bg-white border-[#1a4731] text-[#1a4731]'
              }`}>
                Made 🎯
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                name="result"
                value="Missed"
                checked={result === 'Missed'}
                onChange={() => setResult('Missed')}
                className="sr-only peer"
              />
              <span className={`flex items-center justify-center min-h-[52px] text-base font-semibold rounded-xl border-2 select-none transition-colors ${
                result === 'Missed'
                  ? 'bg-[#8b0000] border-[#8b0000] text-white'
                  : 'bg-white border-[#1a4731] text-[#1a4731]'
              }`}>
                Missed
              </span>
            </label>
          </div>
        </div>

        {/* Miss Direction — only visible when Missed, always resets */}
        {result === 'Missed' && (
          <div>
            <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Miss Direction</label>
            <ToggleGroup options={MISS_OPTIONS} selected={miss} onChange={setMiss} />
          </div>
        )}

        {/* Putt Length — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Putt Length</label>
          <select
            value={persisted.putt_length}
            onChange={e => setPersisted(p => ({ ...p, putt_length: e.target.value }))}
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="">— select —</option>
            {PUTT_LENGTH_OPTIONS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Green Speed — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Green Speed</label>
          <select
            value={persisted.green_speed}
            onChange={e => setPersisted(p => ({ ...p, green_speed: e.target.value }))}
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="">— select —</option>
            {GREEN_SPEED_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Slope — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Slope</label>
          <select
            value={persisted.slope}
            onChange={e => setPersisted(p => ({ ...p, slope: e.target.value }))}
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="">— select —</option>
            {SLOPE_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Break — persists */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Break</label>
          <select
            value={persisted.break}
            onChange={e => setPersisted(p => ({ ...p, break: e.target.value }))}
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="">— select —</option>
            {BREAK_OPTIONS.map(b => (
              <option key={b} value={b}>{b}</option>
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
          {isPending ? 'Saving…' : 'Log Putt'}
        </button>
      </form>
    </div>
  )
}
