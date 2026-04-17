'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'hh-method-banner-collapsed'

export default function MethodBanner() {
  // Start collapsed to avoid flash; useEffect sets real state from localStorage
  const [expanded, setExpanded] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    // First visit (null) → expanded. Return visit → use stored value.
    setExpanded(stored === null ? true : stored !== 'true')
    setReady(true)
  }, [])

  function toggle() {
    const next = !expanded
    setExpanded(next)
    // Store collapsed=true when collapsed, collapsed=false when expanded
    localStorage.setItem(STORAGE_KEY, next ? 'false' : 'true')
  }

  if (!ready) {
    // Render the collapsed header shell while hydrating to avoid layout shift
    return (
      <div className="bg-white rounded-2xl border border-[#1a4731]/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
          <span className="text-[#1a4731] text-base font-semibold">The Hinge &amp; Hold Method</span>
          <svg className="w-5 h-5 text-[#1a4731] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#1a4731]/30 overflow-hidden">
      {/* Header row — tap anywhere to toggle */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] text-left"
      >
        <span className="text-[#1a4731] text-base font-semibold">The Hinge &amp; Hold Method</span>
        <svg
          className="w-5 h-5 text-[#1a4731] flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-l-4 border-[#1a4731] bg-[#f5e6c8] mx-3 mb-3 rounded-r-xl px-4 py-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-[#1a4731] tracking-widest uppercase mb-2">
              The Foundation — remember these before every session
            </p>
            <ul className="space-y-1.5">
              {[
                'Weight on front foot — always',
                'Hands ahead — straight line at address',
                'Decide: low (ball back foot) or high (ball front foot) — never middle',
                'Hinge early, hold through — hands continue to the target',
                'Open stance — aim body left, face at target',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[#1a1a1a] text-sm leading-snug">
                  <span className="flex-shrink-0">✅</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#1a4731]/20 pt-3 space-y-1">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1.5">Contact tells you everything:</p>
            <p className="text-sm text-[#1a1a1a] leading-snug">
              <span className="font-semibold text-[#8b0000]">Fat</span> = weight drifted back. Drive harder, stay forward.
            </p>
            <p className="text-sm text-[#1a1a1a] leading-snug">
              <span className="font-semibold text-[#4a4a4a]">Thin</span> = hands flipped. Hold the hinge through impact.
            </p>
            <p className="text-sm text-[#1a1a1a] leading-snug">
              <span className="font-semibold text-[#1a4731]">Pure</span> = you did it right. Remember what that felt like.
            </p>
          </div>

          <p className="text-xs italic text-[#4a4a4a] pt-1">
            Based on Phil Mickelson's short game method. Tap Field Guide for shot-specific rules.
          </p>
        </div>
      )}
    </div>
  )
}
