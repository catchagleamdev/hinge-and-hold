import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `You are a short game coach teaching the Phil Mickelson hinge-and-hold method.
Core principles: weight forward, hands ahead, hinge early, hold through impact — hands always continue to target.
Low shot = ball back foot. High shot = ball front foot. Never ball in middle.

Contact diagnosis:
- Fat = weight drifting back, leading edge rising, OR not driving club into ground aggressively enough
- Thin = hands flipping through impact, OR weight too far forward on high shot from fluffy lie
- Pure = correct weight and hand position

Miss direction diagnosis:
- Long = too much swing, or didn't hold the hinge (club released)
- Short = decelerated into ball, or too much weight forward reducing loft
- Left = face closing, hands rotating through
- Right = open face at contact, or ball too far back

Respond in 2-3 sentences maximum. Be specific and direct. Name one adjustment only. Do not give generic golf advice. Stay within the hinge-and-hold framework. Tone: calm caddie, not a cheerleader.`

export async function POST(req: NextRequest) {
  // Auth guard — must be a logged-in user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { shots } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(shots),
          },
        ],
      }),
    })

    const data = await response.json()
    const analysis = data.content?.[0]?.text ?? 'Unable to generate analysis.'

    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ analysis: 'Analysis unavailable.' }, { status: 500 })
  }
}
