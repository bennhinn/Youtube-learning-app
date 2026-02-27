import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// ── Types ──────────────────────────────────────────────────────────────────

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string; description: string
    thumbnails: { default?: { url: string }; high?: { url: string } }
    channelId: string; channelTitle: string
    publishedAt: string
  }
}

interface YouTubeVideoItem {
  id: string
  snippet: {
    title: string; description: string
    thumbnails: { default?: { url: string }; high?: { url: string } }
    channelId: string; channelTitle: string
    publishedAt: string
  }
  contentDetails: { duration: string }
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }
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
  is_trusted: boolean
  score?: number
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { keywords } = await request.json()
  if (!keywords) return NextResponse.json({ error: 'Keywords required' }, { status: 400 })

  // ── Get access token ──
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

  // ── Load user's trusted + subscribed channels ──
  const [{ data: trustedRows }, { data: subscriptions }] = await Promise.all([
    supabase.from('trusted_channels').select('channel_id').eq('user_id', user.id),
    supabase.from('subscriptions').select('channel_id').eq('user_id', user.id),
  ])

  const trustedChannelIds  = new Set(trustedRows?.map(r => r.channel_id) || [])
  const subscribedChannelIds = new Set(subscriptions?.map(s => s.channel_id) || [])

  try {
    // ── Parallel search per keyword ──
    const keywordList = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    const uniqueKeywords = [...new Set(keywordList)] as string[]

    const searchPromises = uniqueKeywords.map(kw =>
      searchYouTube(kw, accessToken!, 15)
    )
    const searchResults = await Promise.all(searchPromises)

    // Deduplicate by videoId — keep first occurrence
    const seenIds = new Set<string>()
    const allItems: YouTubeSearchItem[] = []
    for (const items of searchResults) {
      for (const item of items) {
        if (!seenIds.has(item.id.videoId)) {
          seenIds.add(item.id.videoId)
          allItems.push(item)
        }
      }
    }

    if (allItems.length === 0) return NextResponse.json({ videos: [] })

    // ── Fetch full details in batches of 50 ──
    const videoIds = allItems.map(i => i.id.videoId)
    const detailItems = await fetchVideoDetails(videoIds, accessToken!)

    // ── Channel frequency map (appears in results = topic specialist) ──
    const channelFreq: Record<string, number> = {}
    for (const item of detailItems) {
      channelFreq[item.snippet.channelId] = (channelFreq[item.snippet.channelId] || 0) + 1
    }

    // ── Build and score videos ──
    let videos: (VideoResult & { score: number })[] = detailItems
      .map(item => {
        const duration  = parseDuration(item.contentDetails.duration)
        const viewCount = parseInt(item.statistics?.viewCount  || '0')
        const likeCount = parseInt(item.statistics?.likeCount  || '0')
        const isTrusted = trustedChannelIds.has(item.snippet.channelId)

        return {
          youtube_video_id: item.id,
          title:            item.snippet.title,
          description:      item.snippet.description,
          thumbnail_url:    item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
          channel_id:       item.snippet.channelId,
          channel_title:    item.snippet.channelTitle,
          published_at:     item.snippet.publishedAt,
          duration,
          view_count:       viewCount,
          like_count:       likeCount,
          is_trusted:       isTrusted,
          score:            scoreVideo({
            viewCount, likeCount, duration,
            publishedAt:    item.snippet.publishedAt,
            channelId:      item.snippet.channelId,
            channelFreq,
            isTrusted,
            isSubscribed:   subscribedChannelIds.has(item.snippet.channelId),
          }),
        }
      })
      // ── Hard filters ──
      // NOTE: YouTube API returns likeCount=0 for almost all public videos since Nov 2021.
      // Never filter on like_count — it would eliminate virtually every result.
      .filter(v => v.duration > 60)          // > 1 min: removes shorts & trailers
      .filter(v => v.view_count >= 200)      // some real audience (low bar for niche topics)

    // Sort by score descending
    videos.sort((a, b) => b.score - a.score)

    // Return top 20, strip internal score
    const result: VideoResult[] = videos.slice(0, 20).map(({ score, ...rest }) => rest)

    return NextResponse.json({ videos: result })
  } catch (err) {
    console.error('Error generating path:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreVideo({
  viewCount, likeCount, duration, publishedAt,
  channelId, channelFreq, isTrusted, isSubscribed,
}: {
  viewCount: number; likeCount: number; duration: number
  publishedAt: string; channelId: string
  channelFreq: Record<string, number>; isTrusted: boolean; isSubscribed: boolean
}): number {

  // 1. Quality score — like/view ratio when available; YouTube hides likes for most
  // public videos (returns 0 via API since Nov 2021), so fall back to view-based score.
  const likeRatio    = (viewCount > 0 && likeCount > 0) ? (likeCount / viewCount) : null
  const qualityScore = likeRatio !== null
    ? Math.min(likeRatio * 1000, 100)           // like/view ratio: 10% ratio = 100pts
    : Math.min(Math.log10(viewCount + 1) * 18, 100)  // fallback: log-scale views

  // 2. Channel trust
  let channelTrust = 0
  if (isTrusted)    channelTrust  = 100
  else if (isSubscribed) channelTrust = 60
  // Frequency boost — channel appears 3+ times = likely a specialist
  const freq = channelFreq[channelId] || 0
  if (freq >= 3)    channelTrust = Math.min(channelTrust + 30, 100)
  else if (freq >= 2) channelTrust = Math.min(channelTrust + 15, 100)

  // 3. Duration fit — bell curve peaking at 8–20 min (learning sweet spot)
  let durationScore = 0
  const mins = duration / 60
  if      (mins < 3)   durationScore = 0     // too short
  else if (mins < 5)   durationScore = 40
  else if (mins < 8)   durationScore = 70
  else if (mins < 20)  durationScore = 100   // sweet spot
  else if (mins < 35)  durationScore = 80
  else if (mins < 60)  durationScore = 60
  else                 durationScore = 40    // long but still valuable

  // 4. Recency — newer content scores higher for fast-moving tech topics
  const ageMonths = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  let recencyScore = 0
  if      (ageMonths < 6)   recencyScore = 100
  else if (ageMonths < 12)  recencyScore = 85
  else if (ageMonths < 24)  recencyScore = 65
  else if (ageMonths < 48)  recencyScore = 45
  else                      recencyScore = 25

  // 5. Popularity — log scale so viral outliers don't dominate
  const popularityScore = Math.min(Math.log10(viewCount + 1) * 14, 100)

  // Weighted composite
  return (
    qualityScore    * 0.35 +
    channelTrust    * 0.25 +
    durationScore   * 0.20 +
    recencyScore    * 0.10 +
    popularityScore * 0.10
  )
}

// ── YouTube API helpers ────────────────────────────────────────────────────

async function searchYouTube(query: string, token: string, maxResults = 15): Promise<YouTubeSearchItem[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&videoEmbeddable=true&relevanceLanguage=en`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}

async function fetchVideoDetails(videoIds: string[], token: string): Promise<YouTubeVideoItem[]> {
  // Batch into chunks of 50 (API limit)
  const chunks: string[][] = []
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50))

  const results: YouTubeVideoItem[] = []
  for (const chunk of chunks) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(',')}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) continue
    const data = await res.json()
    results.push(...(data.items || []))
  }
  return results
}

// ── Duration parser ───────────────────────────────────────────────────────

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60)   +
          parseInt(match[3] || '0')
}