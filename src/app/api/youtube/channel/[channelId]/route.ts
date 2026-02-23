// app/api/youtube/channel/[channelId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const YT_KEY = process.env.YOUTUBE_API_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!YT_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }

  const { channelId } = await params

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels')
    url.searchParams.set('part', 'snippet,statistics,brandingSettings,contentDetails')
    url.searchParams.set('id', channelId)
    url.searchParams.set('key', YT_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 600 } })

    if (!res.ok) {
      const err = await res.json()
      console.error('YouTube API error:', err)
      return NextResponse.json({ error: err.error?.message || 'YouTube API error' }, { status: res.status })
    }

    const data = await res.json()
    const channel = data.items?.[0]

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (err: any) {
    console.error('Channel fetch error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}