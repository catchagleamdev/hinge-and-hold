// @ts-nocheck
import BackButton from '@/components/BackButton'

export default function FieldGuidePage() {
  const sections = [
    { id: 'what-is-a-chip', label: 'What is a Chip?' },
    { id: 'what-is-a-pitch', label: 'What is a Pitch?' },
    { id: 'chip-vs-pitch', label: 'Chip vs Pitch — How to Decide' },
    { id: 'uphill-uphill', label: 'Uphill Lie + Uphill Green' },
    { id: 'uphill-downhill', label: 'Uphill Lie + Downhill Green' },
    { id: 'downhill-uphill', label: 'Downhill Lie + Uphill Green' },
    { id: 'downhill-downhill', label: 'Downhill Lie + Downhill Green' },
  ]

  return (
    <div className="min-h-screen bg-[#f5e6c8] flex flex-col">
      <header className="bg-[#1a4731] px-4 py-4 flex items-center justify-between">
        <BackButton />
        <h1 className="text-[#f5e6c8] text-lg font-bold">Field Guide</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Anchor nav */}
        <nav className="bg-white rounded-2xl border border-[#1a4731]/20 p-4 mb-8 space-y-1">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block min-h-[44px] flex items-center text-[#1a4731] text-base font-medium border-b border-[#f5e6c8] last:border-0 py-1"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          <section id="what-is-a-chip">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">What is a Chip?</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              A low-trajectory shot from just off the green. Ball spends more time rolling than flying. Hit with a 50–60° wedge, ball on back foot, weight forward. Land it early on the green and let it run to the hole.
            </p>
          </section>

          <section id="what-is-a-pitch">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">What is a Pitch?</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              A higher-trajectory shot from 10–50 yards. Ball flies most of the distance and checks on landing. Uses the hinge-and-hold method with a slightly longer backswing.
            </p>
          </section>

          <section id="chip-vs-pitch">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">Chip vs Pitch — How to Decide</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              If you can chip, chip. Less risk, more predictable. Pitch when an obstacle (bunker, rough, slope) requires height to carry.
            </p>
          </section>

          <section id="uphill-uphill">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">Uphill Lie + Uphill Green</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              Ball back foot. Weight forward. Open face slightly. Hill adds loft — ball comes out higher and softer. Take more club. Normal tempo.
            </p>
          </section>

          <section id="uphill-downhill">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">Uphill Lie + Downhill Green</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              Hardest combo. Ball back foot. More weight forward than usual. Hood the face slightly (less open). Ball must check fast — green will release it. Less club. Be aggressive into the ground.
            </p>
          </section>

          <section id="downhill-uphill">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">Downhill Lie + Uphill Green</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              Ball front foot. Weight heavily forward. Open face more than usual — slope delofts the club. More club. Ball comes out lower and hotter than expected.
            </p>
          </section>

          <section id="downhill-downhill">
            <h2 className="text-xl font-bold text-[#1a4731] mb-3">Downhill Lie + Downhill Green</h2>
            <p className="text-[#1a1a1a] text-base leading-relaxed">
              Ball front foot. Weight forward. Square or slightly open face. Ball will release — land short and let it run. Least spin, most release. Less club.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
