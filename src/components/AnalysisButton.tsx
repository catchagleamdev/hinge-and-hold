'use client'
import { useState } from 'react'

type Shot = {
  contact: string | null
  miss_direction: string[] | null
  proximity: string | null
  lie_surface: string | null
  lie_slope: string[] | null
  ball_position: string[] | null
  club: string | null
}

export default function AnalysisButton({ shots }: { shots: Shot[] }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  if (shots.length < 5) return null

  async function runAnalysis() {
    setDismissed(false)
    setLoading(true)
    try {
      const res = await fetch('/api/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots }),
      })
      const data = await res.json()
      setAnalysis(data.analysis)
    } catch {
      setAnalysis('Analysis unavailable. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      {(!analysis || dismissed) && (
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full min-h-[44px] border-2 border-[#1a4731] text-[#1a4731] bg-white rounded-xl text-base font-medium disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Quick Analysis'}
        </button>
      )}
      {analysis && !dismissed && (
        <div className="border-2 border-[#1a4731] rounded-xl p-4 bg-white relative">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-[#4a4a4a] text-xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
          <p className="text-[#1a1a1a] text-base leading-relaxed pr-8">{analysis}</p>
        </div>
      )}
    </div>
  )
}
