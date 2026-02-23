// app/api/youtube/channel/[channelId]/videos/route.ts
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
  const maxResults = request.nextUrl.searchParams.get('maxResults') || '20'

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('channelId', channelId)
    url.searchParams.set('type', 'video')
    url.searchParams.set('order', 'date')
    url.searchParams.set('maxResults', maxResults)
    url.searchParams.set('key', YT_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 300 } })

    if (!res.ok) {
      const err = await res.json()
      console.error('YouTube videos error:', err)
      return NextResponse.json({ error: err.error?.message || 'YouTube API error' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Videos fetch error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}