// @ts-nocheck
export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <a href="/home" className="text-[#f5e6c8] text-base">← Back</a>
        <a href="/field-guide" className="text-[#f5e6c8] text-sm font-medium">Field Guide</a>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-[#1a4731] mb-3">Pitching Sessions</h1>
        <p className="text-[#4a4a4a] text-base leading-relaxed">
          Pitching sessions coming soon.<br />Master chipping first.
        </p>
      </main>
    </div>
  )
}
