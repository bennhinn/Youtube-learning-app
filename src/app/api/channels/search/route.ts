import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/channels/search?q=fireship
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ channels: [] })

  // Get access token
  const { data: sessionData } = await supabase.auth.getSession()
  let accessToken = sessionData.session?.provider_token

  if (!accessToken) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('youtube_access_token')
      .eq('id', user.id)
      .single()
    accessToken = profile?.youtube_access_token ?? null
  }

  if (!accessToken) return NextResponse.json({ error: 'YouTube not connected' }, { status: 401 })

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=8`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) return NextResponse.json({ channels: [] })

    const data = await res.json()
    const channels = (data.items || []).map((item: any) => ({
      channel_id:    item.id.channelId,
      channel_title: item.snippet.title,
      thumbnail:     item.snippet.thumbnails?.default?.url,
    }))

    return NextResponse.json({ channels })
  } catch {
    return NextResponse.json({ channels: [] })
  }
}