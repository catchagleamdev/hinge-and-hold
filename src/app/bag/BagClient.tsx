'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Club = {
  id: string
  label: string
  notes: string | null
  sort_order: number
}

type Props = {
  initialClubs: Club[]
  userId: string
}

export default function BagClient({ initialClubs, userId }: Props) {
  const [clubs, setClubs] = useState<Club[]>(initialClubs)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLabel, setAddLabel] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  async function handleAdd() {
    const label = addLabel.trim()
    if (!label) return
    setSaving(true)
    const maxOrder = clubs.length > 0 ? Math.max(...clubs.map(c => c.sort_order)) + 1 : 0
    const { data, error } = await supabase
      .from('user_clubs')
      .insert({ user_id: userId, label, notes: addNotes.trim() || null, sort_order: maxOrder })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setClubs(prev => [...prev, data])
      setAddLabel('')
      setAddNotes('')
      setShowAddForm(false)
    }
  }

  function startEdit(club: Club) {
    setEditingId(club.id)
    setEditLabel(club.label)
    setEditNotes(club.notes ?? '')
  }

  async function confirmEdit() {
    const label = editLabel.trim()
    if (!label || !editingId) return
    setSaving(true)
    const { error } = await supabase
      .from('user_clubs')
      .update({ label, notes: editNotes.trim() || null })
      .eq('id', editingId)
    setSaving(false)
    if (!error) {
      setClubs(prev => prev.map(c =>
        c.id === editingId ? { ...c, label, notes: editNotes.trim() || null } : c
      ))
      setEditingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this club from your bag?')) return
    await supabase.from('user_clubs').delete().eq('id', id)
    setClubs(prev => prev.filter(c => c.id !== id))
  }

  async function moveUp(index: number) {
    if (index === 0) return
    const updated = [...clubs]
    const tmp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = tmp
    const reordered = updated.map((c, i) => ({ ...c, sort_order: i }))
    setClubs(reordered)
    await Promise.all(
      reordered.map(c => supabase.from('user_clubs').update({ sort_order: c.sort_order }).eq('id', c.id))
    )
  }

  async function moveDown(index: number) {
    if (index === clubs.length - 1) return
    const updated = [...clubs]
    const tmp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = tmp
    const reordered = updated.map((c, i) => ({ ...c, sort_order: i }))
    setClubs(reordered)
    await Promise.all(
      reordered.map(c => supabase.from('user_clubs').update({ sort_order: c.sort_order }).eq('id', c.id))
    )
  }

  return (
    <div className="space-y-3">
      {clubs.length === 0 && !showAddForm && (
        <p className="text-center text-[#4a4a4a] py-8">Your bag is empty. Add your first club below.</p>
      )}

      {clubs.map((club, index) =>
        editingId === club.id ? (
          <div key={club.id} className="bg-white rounded-2xl border border-[#1a4731]/20 p-4 space-y-3">
            <input
              type="text"
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              placeholder="Club label (e.g. GW)"
              className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
            />
            <input
              type="text"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Notes (optional, e.g. 8° bounce)"
              className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmEdit}
                disabled={saving}
                className="flex-1 min-h-[44px] bg-[#1a4731] text-[#f5e6c8] rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="min-h-[44px] px-4 border border-[#1a4731] text-[#1a4731] rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={club.id}
            className="bg-white rounded-2xl border border-[#1a4731]/20 px-4 py-3 flex items-center gap-3"
          >
            <div className="flex flex-col gap-0.5 mr-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-xs text-[#4a4a4a] disabled:opacity-30 leading-none"
                aria-label="Move up"
              >▲</button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === clubs.length - 1}
                className="text-xs text-[#4a4a4a] disabled:opacity-30 leading-none"
                aria-label="Move down"
              >▼</button>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[#1a1a1a] text-base font-semibold">{club.label}</span>
              {club.notes && (
                <span className="text-[#4a4a4a] text-sm ml-2">— {club.notes}</span>
              )}
            </div>

            <button
              onClick={() => startEdit(club)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
              aria-label={`Edit ${club.label}`}
            >✏️</button>
            <button
              onClick={() => handleDelete(club.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
              aria-label={`Delete ${club.label}`}
            >🗑️</button>
          </div>
        )
      )}

      {showAddForm ? (
        <div className="bg-white rounded-2xl border border-[#1a4731]/20 p-4 space-y-3">
          <input
            type="text"
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            placeholder="Club label (e.g. GW)"
            autoFocus
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          />
          <input
            type="text"
            value={addNotes}
            onChange={e => setAddNotes(e.target.value)}
            placeholder="Notes (optional, e.g. 8° bounce)"
            className="w-full min-h-[44px] border border-[#1a4731] rounded-xl px-3 text-base text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !addLabel.trim()}
              className="flex-1 min-h-[44px] bg-[#1a4731] text-[#f5e6c8] rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add Club'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddLabel(''); setAddNotes('') }}
              className="min-h-[44px] px-4 border border-[#1a4731] text-[#1a4731] rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full min-h-[56px] border-2 border-dashed border-[#1a4731] text-[#1a4731] text-base font-semibold rounded-2xl"
        >
          + Add Club
        </button>
      )}
    </div>
  )
}
