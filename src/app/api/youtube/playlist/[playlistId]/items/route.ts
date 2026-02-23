import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  const { playlistId } = await params
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'Failed to fetch playlist items' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ items: data.items || [] })
  } catch (err) {
    console.error('Playlist items error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}