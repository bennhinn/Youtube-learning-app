import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/channels/search?q=piano gospel

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ channels: [] })

  // ── Get a valid YouTube token (with auto-refresh) ──
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('youtube_access_token, youtube_refresh_token, youtube_token_updated_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.youtube_access_token) {
    console.error('[channel-search] No token found:', profileError?.message)
    return NextResponse.json({ error: 'YouTube not connected' }, { status: 401 })
  }

  // Check if token needs refresh
  let accessToken = profile.youtube_access_token
  const ageMinutes = (Date.now() - new Date(profile.youtube_token_updated_at ?? 0).getTime()) / 60_000

  if (ageMinutes >= 55 && profile.youtube_refresh_token) {
    const clientId     = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (clientId && clientSecret) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          grant_type: 'refresh_token', refresh_token: profile.youtube_refresh_token,
          client_id: clientId, client_secret: clientSecret,
        }),
      })

      if (refreshRes.ok) {
        const tokens = await refreshRes.json()
        accessToken  = tokens.access_token
        await supabase.from('profiles').update({
          youtube_access_token:     tokens.access_token,
          youtube_token_updated_at: new Date().toISOString(),
          ...(tokens.refresh_token ? { youtube_refresh_token: tokens.refresh_token } : {}),
        }).eq('id', user.id)
        console.log('[channel-search] Token refreshed')
      } else {
        console.warn('[channel-search] Token refresh failed — using stale token')
      }
    }
  }

  // ── Search YouTube for channels ──
  // Use type=channel to get channel results
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=8`

  let res: Response
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  } catch (e: any) {
    console.error('[channel-search] Network error:', e.message)
    return NextResponse.json({ channels: [] })
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`
    console.error('[channel-search] YouTube error:', msg)
    // Return the error so the frontend can show it rather than silently showing nothing
    return NextResponse.json({ channels: [], error: msg }, { status: res.status })
  }

  // YouTube search with type=channel returns items where id.kind === "youtube#channel"
  // and id.channelId contains the channel ID
  const channels = (body?.items ?? [])
    .filter((item: any) => item?.id?.channelId && item?.snippet?.title)
    .map((item: any) => ({
      channel_id:    item.id.channelId,
      channel_title: item.snippet.title,
      thumbnail:     item.snippet.thumbnails?.default?.url ?? null,
      description:   item.snippet.description ?? '',
    }))

  console.log(`[channel-search] "${q}" → ${channels.length} channels`)
  return NextResponse.json({ channels })
}