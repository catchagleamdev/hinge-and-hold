'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addShot } from '@/app/session/[id]/actions'

const CONTACT_OPTIONS = ['Fat', 'Pure', 'Thin']
const MISS_DIRECTION_OPTIONS = ['Left', 'Right', 'Long', 'Short']
const PROXIMITY_OPTIONS = ['Tap In', '1–3 ft', '3–6 ft', '6 ft+']
const LIE_SURFACE_OPTIONS = ['Fairway', 'Fringe', 'Rough']
const LIE_SLOPE_OPTIONS = ['Flat', 'Uphill', 'Downhill']
const BALL_POSITION_OPTIONS = ['Level', 'Above Feet', 'Below Feet']

type Club = { id: string; label: string; isDefault: boolean }

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
  lie_surface: string
  lie_slope: string[]
  ball_position: string[]
}

const EMPTY_PERSISTED: Persisted = {
  lie_surface: '',
  lie_slope: [],
  ball_position: [],
}

export default function ShotForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Club state — custom labels + selection persist for the session, survive shot submit
  const [clubs, setClubs] = useState<Club[]>([
    { id: 'gw', label: 'GW', isDefault: true },
    { id: 'sw', label: 'SW', isDefault: true },
    { id: 'lw', label: 'LW', isDefault: true },
  ])
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [addInputValue, setAddInputValue] = useState('')

  // Persisted across shots
  const [persisted, setPersisted] = useState<Persisted>(EMPTY_PERSISTED)

  // Per-shot (resets after every submit)
  const [contact, setContact] = useState<string[]>([])
  const [result, setResult] = useState('')
  const [missDirection, setMissDirection] = useState('')
  const [proximity, setProximity] = useState('')
  const [notes, setNotes] = useState('')

  function clearAll() {
    setPersisted(EMPTY_PERSISTED)
    setSelectedClub(null)
    setEditingClubId(null)
    setEditingLabel('')
    setShowAddInput(false)
    setAddInputValue('')
    setContact([])
    setResult('')
    setMissDirection('')
    setProximity('')
    setNotes('')
  }

  function confirmEditClub() {
    const newLabel = editingLabel.trim()
    if (!newLabel || !editingClubId) return
    const oldClub = clubs.find(c => c.id === editingClubId)
    setClubs(prev => prev.map(c => c.id === editingClubId ? { ...c, label: newLabel } : c))
    if (oldClub && selectedClub === oldClub.label) setSelectedClub(newLabel)
    setEditingClubId(null)
    setEditingLabel('')
  }

  function confirmAddClub() {
    const label = addInputValue.trim()
    if (!label) return
    const id = `custom_${Date.now()}`
    setClubs(prev => [...prev, { id, label, isDefault: false }])
    setSelectedClub(label)
    setShowAddInput(false)
    setAddInputValue('')
  }

  function removeCustomClub(id: string) {
    const club = clubs.find(c => c.id === id)
    if (club && selectedClub === club.label) setSelectedClub(null)
    setClubs(prev => prev.filter(c => c.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addShot(sessionId, {
        contact: contact.length > 0 ? contact : null,
        miss_direction:
          result === 'Lip Out 🥲' ? ['Lip Out'] :
          result === 'Miss' && missDirection ? [missDirection] :
          null,
        proximity: result === 'Holed! 🎯' ? 'Holed!' : (proximity || null),
        lie_surface: persisted.lie_surface || null,
        lie_slope: persisted.lie_slope.length > 0 ? persisted.lie_slope : null,
        ball_position: persisted.ball_position.length > 0 ? persisted.ball_position : null,
        club: selectedClub || null,
        notes: notes || null,
      })
      setContact([])
      setResult('')
      setMissDirection('')
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

        {/* Result — resets */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Result</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Miss', 'Holed! 🎯', 'Lip Out 🥲'] as const).map(opt => (
              <label key={opt} className="cursor-pointer">
                <input
                  type="radio"
                  name="shot-result"
                  value={opt}
                  checked={result === opt}
                  onChange={() => {
                    setResult(opt)
                    if (opt !== 'Miss') setMissDirection('')
                  }}
                  className="sr-only peer"
                />
                <span className={`flex items-center justify-center min-h-[44px] text-base rounded-xl border-2 select-none transition-colors ${
                  result === opt && opt === 'Holed! 🎯'
                    ? 'bg-[#c9a84c] border-[#c9a84c] text-white'
                    : result === opt
                    ? 'bg-[#1a4731] border-[#1a4731] text-[#f5e6c8]'
                    : 'bg-white border-[#1a4731] text-[#1a4731]'
                }`}>
                  {opt}
                </span>
              </label>
            ))}
          </div>

          {/* Miss direction — only when Miss selected */}
          {result === 'Miss' && (
            <div className="mt-2">
              <RadioGroup
                options={MISS_DIRECTION_OPTIONS}
                selected={missDirection}
                onChange={setMissDirection}
                cols="grid-cols-4"
              />
            </div>
          )}
        </div>

        {/* Proximity — resets, 2×2 grid */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Proximity</label>
          <RadioGroup options={PROXIMITY_OPTIONS} selected={proximity} onChange={setProximity} />
        </div>

        {/* Surface — persists, 3 buttons */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Surface</label>
          <RadioGroup
            options={LIE_SURFACE_OPTIONS}
            selected={persisted.lie_surface}
            onChange={v => setPersisted(p => ({ ...p, lie_surface: v }))}
          />
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

        {/* Club — persists, full custom management */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4a4a] mb-2">Club</label>
          <div className="flex flex-wrap gap-2">
            {clubs.map(club =>
              editingClubId === club.id ? (
                <div key={club.id} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={e => setEditingLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmEditClub() } }}
                    autoFocus
                    className="w-24 min-h-[44px] border border-[#1a4731] rounded-xl px-2 text-sm text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                  />
                  <button
                    type="button"
                    onClick={confirmEditClub}
                    className="min-h-[44px] px-3 bg-[#1a4731] text-[#f5e6c8] rounded-xl text-sm font-semibold"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingClubId(null); setEditingLabel('') }}
                    className="min-h-[44px] px-2 text-[#4a4a4a] text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div key={club.id} className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedClub(selectedClub === club.label ? null : club.label)}
                    className={`min-h-[44px] px-4 text-base rounded-xl border-2 select-none transition-colors ${
                      selectedClub === club.label
                        ? 'bg-[#1a4731] border-[#1a4731] text-[#f5e6c8]'
                        : 'bg-white border-[#1a4731] text-[#1a4731]'
                    }`}
                  >
                    {club.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingClubId(club.id); setEditingLabel(club.label) }}
                    className="min-h-[44px] px-1.5 text-sm text-[#4a4a4a] hover:text-[#1a4731] select-none"
                    aria-label={`Edit ${club.label}`}
                  >
                    ✏️
                  </button>
                  {!club.isDefault && (
                    <button
                      type="button"
                      onClick={() => removeCustomClub(club.id)}
                      className="w-5 h-5 flex items-center justify-center bg-[#8b0000] text-white text-[10px] rounded-full"
                      aria-label={`Remove ${club.label}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            )}

            {/* Add custom club */}
            {showAddInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={addInputValue}
                  onChange={e => setAddInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmAddClub() } }}
                  placeholder="e.g. MG4 54"
                  autoFocus
                  className="w-28 min-h-[44px] border border-[#1a4731] rounded-xl px-2 text-sm text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                />
                <button
                  type="button"
                  onClick={confirmAddClub}
                  className="min-h-[44px] px-3 bg-[#1a4731] text-[#f5e6c8] rounded-xl text-sm font-semibold"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddInput(false); setAddInputValue('') }}
                  className="min-h-[44px] px-2 text-[#4a4a4a] text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="min-h-[44px] px-4 text-base rounded-xl border-2 border-dashed border-[#1a4731] text-[#1a4731] bg-white select-none"
              >
                + Add
              </button>
            )}
          </div>
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
