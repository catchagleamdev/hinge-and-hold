// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Validate next — must be a simple relative path (starts with / but not //)
  // Rejects protocol-relative URLs like //evil.com that would redirect off-site
  const rawNext = searchParams.get('next') ?? '/home'
  const next = /^\/[^/]/.test(rawNext) ? rawNext : '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
