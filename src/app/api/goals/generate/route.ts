import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Types for YouTube API responses
interface YouTubeSearchItem {
  id: {
    videoId: string
  }
  snippet: {
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      high?: { url: string }
    }
    channelId: string
    channelTitle: string
  }
}

interface YouTubeVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      high?: { url: string }
    }
    channelId: string
    channelTitle: string
  }
  contentDetails: {
    duration: string
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
  }
}

interface VideoResult {
  youtube_video_id: string
  title: string
  description: string
  thumbnail_url: string
  channel_id: string
  channel_title: string
  duration: number
  view_count: number
  like_count: number
  score?: number
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keywords } = await request.json()
  if (!keywords) {
    return NextResponse.json({ error: 'Keywords required' }, { status: 400 })
  }

  // Get user's subscribed channel IDs
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('channel_id')
    .eq('user_id', user.id)

  const subscribedChannelIds = subscriptions?.map(s => s.channel_id) || []

  // ── Try session provider_token first, fall back to stored token ──
  const { data: sessionData } = await supabase.auth.getSession()
  let accessToken = sessionData.session?.provider_token

  if (!accessToken) {
    // Fall back to token saved in profiles during OAuth callback
    const { data: profile } = await supabase
      .from('profiles')
      .select('youtube_access_token')
      .eq('id', user.id)
      .single()

    accessToken = profile?.youtube_access_token ?? null
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'YouTube not connected' }, { status: 401 })
  }

  try {
    // Split keywords (comma-separated) and trim
    const keywordList = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    const searchQuery = keywordList.join(' ')

    // Search YouTube videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=20&videoEmbeddable=true`

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!searchRes.ok) {
      const errorData = await searchRes.json()
      console.error('YouTube search error:', errorData)
      return NextResponse.json({ error: 'YouTube search failed' }, { status: searchRes.status })
    }

    const searchData = await searchRes.json() as { items: YouTubeSearchItem[] }

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ videos: [] })
    }

    // Get video details (duration, statistics) via videos.list
    const videoIds = searchData.items.map((item) => item.id.videoId).join(',')
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}`

    const detailsRes = await fetch(videoDetailsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!detailsRes.ok) {
      console.error('Video details fetch failed')
      return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 })
    }

    const detailsData = await detailsRes.json() as { items: YouTubeVideoItem[] }

    // Combine and rank
    let videos: (VideoResult & { score: number })[] = detailsData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration)
      const viewCount = item.statistics?.viewCount ? parseInt(item.statistics.viewCount) : 0
      const likeCount = item.statistics?.likeCount ? parseInt(item.statistics.likeCount) : 0

      return {
        youtube_video_id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channel_id: item.snippet.channelId,
        channel_title: item.snippet.channelTitle,
        duration,
        view_count: viewCount,
        like_count: likeCount,
        score: 0,
      }
    })

    // Calculate scores
    videos = videos.map((video) => ({
      ...video,
      score: (subscribedChannelIds.includes(video.channel_id) ? 100 : 0) +
             (video.view_count ? Math.log10(video.view_count + 1) * 10 : 0) +
             (video.like_count ? Math.log10(video.like_count + 1) * 5 : 0)
    }))

    // Sort by score descending
    videos.sort((a, b) => b.score - a.score)

    // Remove score before sending to client
    const result: VideoResult[] = videos.map(({ score, ...rest }) => rest)

    return NextResponse.json({ videos: result })
  } catch (error) {
    console.error('Error generating path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper to convert ISO 8601 duration (e.g., PT1H2M10S) to seconds
function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const match = duration.match(regex)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}