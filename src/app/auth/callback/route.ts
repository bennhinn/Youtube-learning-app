import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=auth', request.url))
    }

    // Store tokens in profiles table for later use
    if (data.session?.provider_token) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: data.session.user.id,
          youtube_access_token: data.session.provider_token,
          youtube_refresh_token: data.session.provider_refresh_token ?? null,
          youtube_token_updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (upsertError) {
        console.error('Failed to save YouTube token to profile:', upsertError)
        // Continue anyway – the session still has the token
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}