import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Check if video exists in our database and is recent (last_fetched < 24h)
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const { data: cachedVideo, error: cacheError } = await supabase
    .from('videos')
    .select('*')
    .eq('youtube_video_id', videoId)
    .gte('last_fetched', oneDayAgo.toISOString())
    .maybeSingle()

  if (!cacheError && cachedVideo) {
    // Return cached video
    return NextResponse.json(cachedVideo)
  }

  // 2. No fresh cache – fetch from YouTube API
  // Get access token (session first, then fallback to stored token)
  const { data: sessionData } = await supabase.auth.getSession()
  let accessToken = sessionData.session?.provider_token

  if (!accessToken) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('youtube_access_token')
      .eq('id', user.id)
      .single()
    accessToken = profile?.youtube_access_token
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'No YouTube access token' }, { status: 401 })
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet,statistics,contentDetails')
    url.searchParams.set('id', videoId)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json(
        { error: err.error?.message || 'YouTube API error' },
        { status: res.status }
      )
    }

    const data = await res.json()
    const item = data.items?.[0]

    if (!item) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 3. Parse video data to match our schema
    const snippet = item.snippet
    const statistics = item.statistics
    const contentDetails = item.contentDetails

    // Convert ISO 8601 duration to seconds
    const duration = parseDuration(contentDetails.duration)

    const videoData = {
      youtube_video_id: item.id,
      title: snippet.title,
      description: snippet.description,
      thumbnail_url: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
      channel_id: snippet.channelId,
      channel_title: snippet.channelTitle,
      duration,
      view_count: parseInt(statistics?.viewCount || '0'),
      like_count: parseInt(statistics?.likeCount || '0'),
      last_fetched: new Date().toISOString(),
    }

    // 4. Upsert into videos table (cache)
    const { error: upsertError } = await supabase
      .from('videos')
      .upsert(videoData, { onConflict: 'youtube_video_id' })

    if (upsertError) {
      console.warn('Failed to cache video:', upsertError)
      // Continue – return fetched data even if caching fails
    }

    return NextResponse.json(videoData)
  } catch (err: any) {
    console.error('Video fetch error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

// Helper to parse ISO 8601 duration (PT1H2M10S) into seconds
function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const match = duration.match(regex)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}