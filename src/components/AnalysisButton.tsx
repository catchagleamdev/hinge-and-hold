'use client'
import { useState, Component, type ReactNode } from 'react'

type Shot = {
  contact: string | null
  miss_direction: string[] | null
  proximity: string | null
  lie_surface: string | null
  lie_slope: string[] | null
  ball_position: string[] | null
  club: string | null
}

// --- Error boundary (class component — only way to catch render errors in React) ---
class AnalysisErrorBoundary extends Component<
  { children: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="mt-2 border border-[#1a4731]/30 rounded-xl p-4 bg-white">
          <p className="text-[#4a4a4a] text-base">Analysis unavailable — try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Inner component ---
function AnalysisButtonInner({ shots }: { shots: Shot[] }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [shotRange, setShotRange] = useState<{ start: number; end: number } | null>(null)

  if (shots.length < 5) return null

  async function runAnalysis() {
    setDismissed(false)
    setLoading(true)

    // Always send the last 5 shots; capture the range at the moment of submission
    const last5 = shots.slice(-5)
    const end = shots.length
    const start = end - last5.length + 1
    setShotRange({ start, end })

    try {
      const res = await fetch('/api/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots: last5 }),
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
          {loading ? 'Analyzing…' : 'Analyze Last 5 Shots'}
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
          {shotRange && (
            <p className="text-[#4a4a4a] text-xs font-medium mb-2">
              Based on shots #{shotRange.start}–#{shotRange.end}
            </p>
          )}
          <p className="text-[#1a1a1a] text-base leading-relaxed pr-8">{analysis}</p>
        </div>
      )}
    </div>
  )
}

// --- Public export: inner component wrapped in error boundary ---
export default function AnalysisButton({ shots }: { shots: Shot[] }) {
  return (
    <AnalysisErrorBoundary>
      <AnalysisButtonInner shots={shots} />
    </AnalysisErrorBoundary>
  )
}
