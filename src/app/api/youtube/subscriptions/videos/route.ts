// app/api/youtube/subscriptions/videos/route.ts
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's youtube token
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('youtube_access_token')
    .eq('id', user.id)
    .single()

  if (!profile?.youtube_access_token) {
    return NextResponse.json({ error: 'No YouTube token' }, { status: 401 })
  }

  // Get subscribed channel IDs from DB
  const { data: subs } = await adminClient
    .from('subscriptions')
    .select('channel_id')
    .eq('user_id', user.id)
    .limit(20)

  const channelIds = subs?.map(s => s.channel_id) || []
  if (channelIds.length === 0) {
    return NextResponse.json({ videos: [] })
  }

  // Fetch recent videos from each channel via YouTube API
  const apiKey = process.env.YOUTUBE_API_KEY
  const allVideos: any[] = []

  // Fetch in batches of 5 channels to avoid too many parallel requests
  const batchSize = 5
  for (let i = 0; i < Math.min(channelIds.length, 15); i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize)
    await Promise.all(batch.map(async (channelId) => {
      try {
        // Get channel's uploads playlist
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`
        )
        const channelData = await channelRes.json()
        const channel = channelData.items?.[0]
        if (!channel) return

        const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads
        const channelAvatar = channel.snippet?.thumbnails?.default?.url
        if (!uploadsId) return

        // Get recent videos from uploads playlist
        const playlistRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=3&key=${apiKey}`
        )
        const playlistData = await playlistRes.json()
        const items = playlistData.items || []

        // Get video details (duration, view count)
        const videoIds = items.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean)
        if (videoIds.length === 0) return

        const detailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`
        )
        const detailsData = await detailsRes.json()
        const detailsMap = Object.fromEntries(
          (detailsData.items || []).map((v: any) => [v.id, v])
        )

        items.forEach((item: any) => {
          const snippet = item.snippet
          const videoId = snippet?.resourceId?.videoId
          if (!videoId) return
          const details = detailsMap[videoId]
          const viewCount = parseInt(details?.statistics?.viewCount || '0')

          allVideos.push({
            id: videoId,
            title: snippet.title,
            thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
            channelTitle: snippet.channelTitle,
            channelId,
            channelAvatar,
            publishedAt: snippet.publishedAt,
            timeAgo: timeAgo(snippet.publishedAt),
            duration: details?.contentDetails?.duration ? formatDuration(details.contentDetails.duration) : null,
            viewCount,
            viewCountFormatted: viewCount > 0 ? formatViewCount(viewCount) : null,
          })
        })
      } catch (err) {
        console.error(`Error fetching videos for channel ${channelId}:`, err)
      }
    }))
  }

  // Sort by publish date, newest first
  allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return NextResponse.json({ videos: allVideos.slice(0, 30) })
}