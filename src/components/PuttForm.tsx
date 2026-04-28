'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPutt } from '@/app/putting/[id]/actions'

const MISS_OPTIONS = ['High', 'Low', 'Left', 'Right', 'Long', 'Short']
const GREEN_SPEED_OPTIONS = ['Slow', 'Medium', 'Fast']
const SLOPE_OPTIONS = ['Flat', 'Uphill', 'Downhill']
const BREAK_OPTIONS = ['Straight', 'Left', 'Right']
const MISS_DISTANCE_OPTIONS = ['Inches', '< 1 ft', '1–3 ft', '3 ft+']
const DEFAULT_PUTT_LENGTH_OPTIONS = ['3–4 ft', '4–6 ft', '6–8 ft', '8 ft+']

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

function RadioGroup({
  options,
  selected,
  onChange,
  cols,
}: {
  options: string[]
  selected: string
  onChange: (value: string) => void
  cols?: string
}) {
  const gridCols = cols ?? (
    options.length === 3 ? 'grid-cols-3' :
    options.length === 4 ? 'grid-cols-2' :
    'grid-cols-3'
  )
  return (
    <div className={`grid ${gridCols} gap-2`}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(selected === opt ? '' : opt)}
          className={`flex items-center justify-center min-h-[44px] text-base rounded-xl border-2 select-none transition-colors ${
            selected === opt
              ? 'bg-[#1a4731] border-[#1a4731] text-[#f5e6c8]'
              : 'bg-white border-[#1a4731] text-[#1a4731]'
          }`}
        >
          {opt}
        </button>
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

  // Putt length options — default set plus any custom additions
  const [puttLengthOptions, setPuttLengthOptions] = useState<string[]>(DEFAULT_PUTT_LENGTH_OPTIONS)
  const [showPuttLengthAdd, setShowPuttLengthAdd] = useState(false)
  const [puttLengthAddValue, setPuttLengthAddValue] = useState('')

  // Resets on every submit
  const [result, setResult] = useState('')
  const [miss, setMiss] = useState<string[]>([])
  const [missDistance, setMissDistance] = useState('')
  const [notes, setNotes] = useState('')

  function clearAll() {
    setPersisted(EMPTY_PERSISTED)
    setShowPuttLengthAdd(false)
    setPuttLengthAddValue('')
    setResult('')
    setMiss([])
    setMissDistance('')
    setNotes('')
  }

  function confirmAddPuttLength() {
    const label = puttLengthAddValue.trim()
    if (!label) return
    setPuttLengthOptions(prev => prev.includes(label) ? prev : [...prev, label])
    setPersisted(p => ({ ...p, putt_length: label }))
    setShowPuttLengthAdd(false)
    setPuttLengthAddValue('')
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
        miss_distance: result === 'Missed' ? (missDistance || null) : null,
        notes: notes || null,
      })
      setResult('')
      setMiss([])
      setMissDistance('')
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

        {/* Result — radio-style, three buttons, always resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Result</label>
          <div className="grid grid-cols-3 gap-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="result"
                value="Made 🎯"
                checked={result === 'Made 🎯'}
                onChange={() => { setResult('Made 🎯'); setMiss([]); setMissDistance('') }}
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
                value="Lip Out"
                checked={result === 'Lip Out'}
                onChange={() => { setResult('Lip Out'); setMissDistance('') }}
                className="sr-only peer"
              />
              <span className={`flex items-center justify-center min-h-[52px] text-base font-semibold rounded-xl border-2 select-none transition-colors ${
                result === 'Lip Out'
                  ? 'bg-[#c9a84c] border-[#c9a84c] text-white'
                  : 'bg-white border-[#1a4731] text-[#1a4731]'
              }`}>
                Lip Out
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

        {/* Miss Direction — visible when Missed or Lip Out, always resets */}
        {(result === 'Missed' || result === 'Lip Out') && (
          <div>
            <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Miss Direction</label>
            <ToggleGroup options={MISS_OPTIONS} selected={miss} onChange={setMiss} />
          </div>
        )}

        {/* Miss Distance — visible only when Missed, always resets */}
        {result === 'Missed' && (
          <div>
            <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Miss Distance</label>
            <RadioGroup
              options={MISS_DISTANCE_OPTIONS}
              selected={missDistance}
              onChange={setMissDistance}
            />
          </div>
        )}

        {/* Putt Length — persists, buttons + Add custom */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Putt Length</label>
          <div className="space-y-2">
            <RadioGroup
              options={puttLengthOptions}
              selected={persisted.putt_length}
              onChange={v => setPersisted(p => ({ ...p, putt_length: v }))}
              cols="grid-cols-2"
            />
            {showPuttLengthAdd ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={puttLengthAddValue}
                  onChange={e => setPuttLengthAddValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmAddPuttLength() } }}
                  placeholder="e.g. 2–3 ft"
                  autoFocus
                  className="flex-1 min-h-[44px] border border-[#1a4731] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                />
                <button
                  type="button"
                  onClick={confirmAddPuttLength}
                  className="min-h-[44px] px-4 bg-[#1a4731] text-[#f5e6c8] rounded-xl text-sm font-semibold"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPuttLengthAdd(false); setPuttLengthAddValue('') }}
                  className="min-h-[44px] px-3 text-[#4a4a4a] text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPuttLengthAdd(true)}
                className="w-full min-h-[44px] text-base rounded-xl border-2 border-dashed border-[#1a4731] text-[#1a4731] bg-white select-none"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Green Speed — persists, 3 buttons */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Green Speed</label>
          <RadioGroup
            options={GREEN_SPEED_OPTIONS}
            selected={persisted.green_speed}
            onChange={v => setPersisted(p => ({ ...p, green_speed: v }))}
          />
        </div>

        {/* Slope — persists, 3 buttons */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Slope</label>
          <RadioGroup
            options={SLOPE_OPTIONS}
            selected={persisted.slope}
            onChange={v => setPersisted(p => ({ ...p, slope: v }))}
          />
        </div>

        {/* Break — persists, 3 buttons */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Break</label>
          <RadioGroup
            options={BREAK_OPTIONS}
            selected={persisted.break}
            onChange={v => setPersisted(p => ({ ...p, break: v }))}
          />
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
