import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// ── Types ──────────────────────────────────────────────────────────────────

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    description: string
    thumbnails: { default?: { url: string }; high?: { url: string }; medium?: { url: string } }
    channelId: string
    channelTitle: string
    publishedAt: string
  }
}

interface YouTubeVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: { default?: { url: string }; high?: { url: string }; medium?: { url: string } }
    channelId: string
    channelTitle: string
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
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[generate] Auth failed:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { keywords } = body
  if (!keywords?.trim()) return NextResponse.json({ error: 'Keywords required' }, { status: 400 })

  console.log(`[generate] User ${user.id} | Keywords: "${keywords}"`)

  // ── Get a valid YouTube token ──
  let accessToken: string | null
  try {
    accessToken = await getValidYouTubeToken(supabase, user.id)
  } catch (err: any) {
    console.error('[generate] Token error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 401 })
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'YouTube not connected — please sign out and sign back in' }, { status: 401 })
  }

  // ── Load trusted + subscribed channels ──
  const [{ data: trustedRows }, { data: subscriptions }] = await Promise.all([
    supabase.from('trusted_channels').select('channel_id').eq('user_id', user.id),
    supabase.from('subscriptions').select('channel_id').eq('user_id', user.id),
  ])

  const trustedChannelIds    = new Set(trustedRows?.map((r: any) => r.channel_id) ?? [])
  const subscribedChannelIds = new Set(subscriptions?.map((s: any) => s.channel_id) ?? [])
  console.log(`[generate] Trusted: ${trustedChannelIds.size} | Subscribed: ${subscribedChannelIds.size}`)

  // ── Parallel search per keyword ──
  const uniqueKeywords = [...new Set(
    keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
  )] as string[]
  console.log(`[generate] Keywords:`, uniqueKeywords)

  const searchResults = await Promise.all(
    uniqueKeywords.map(kw => searchYouTube(kw, accessToken!, 15))
  )

  // Surface errors to client
  const allFailed = searchResults.every(r => r.error)
  if (allFailed) {
    const msg = searchResults[0]?.error ?? 'Unknown search error'
    console.error('[generate] All searches failed:', msg)
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid credentials')) {
      return NextResponse.json({ error: 'YouTube token expired — please sign out and sign back in' }, { status: 401 })
    }
    if (msg.includes('403') || msg.toLowerCase().includes('quota')) {
      return NextResponse.json({ error: 'YouTube API quota exceeded — try again later' }, { status: 429 })
    }
    return NextResponse.json({ error: `YouTube search failed: ${msg}` }, { status: 500 })
  }

  // Deduplicate across keywords
  const seenIds  = new Set<string>()
  const allItems: YouTubeSearchItem[] = []
  for (const result of searchResults) {
    for (const item of result.items ?? []) {
      if (item?.id?.videoId && !seenIds.has(item.id.videoId)) {
        seenIds.add(item.id.videoId)
        allItems.push(item)
      }
    }
  }
  console.log(`[generate] Unique search results: ${allItems.length}`)

  if (allItems.length === 0) {
    return NextResponse.json({ videos: [], debug: 'YouTube returned 0 search results' })
  }

  // ── Fetch full video details ──
  const detailItems = await fetchVideoDetails(allItems.map(i => i.id.videoId), accessToken!)
  console.log(`[generate] Detail items: ${detailItems.length}`)

  if (detailItems.length === 0) {
    return NextResponse.json({ videos: [], debug: 'Video details fetch returned 0 items' })
  }

  // Channel frequency map
  const channelFreq: Record<string, number> = {}
  for (const item of detailItems) {
    channelFreq[item.snippet.channelId] = (channelFreq[item.snippet.channelId] ?? 0) + 1
  }

  // Score all videos
  const scored = detailItems.map(item => {
    const duration  = parseDuration(item.contentDetails?.duration ?? '')
    const viewCount = parseInt(item.statistics?.viewCount ?? '0', 10)
    const likeCount = parseInt(item.statistics?.likeCount ?? '0', 10)
    const isTrusted = trustedChannelIds.has(item.snippet.channelId)
    const thumbnail =
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url || ''

    return {
      youtube_video_id: item.id,
      title:            item.snippet.title,
      description:      item.snippet.description ?? '',
      thumbnail_url:    thumbnail,
      channel_id:       item.snippet.channelId,
      channel_title:    item.snippet.channelTitle,
      duration,
      view_count:       viewCount,
      like_count:       likeCount,
      is_trusted:       isTrusted,
      score: scoreVideo({ viewCount, likeCount, duration, publishedAt: item.snippet.publishedAt,
                          channelId: item.snippet.channelId, channelFreq, isTrusted,
                          isSubscribed: subscribedChannelIds.has(item.snippet.channelId) }),
    }
  })

  // Hard filters — very permissive to support niche topics
  const filtered = scored.filter(v => v.duration >= 60 && v.view_count >= 50)
  console.log(`[generate] After filters: ${filtered.length}/${scored.length}`)

  filtered.sort((a, b) => b.score - a.score)
  const result: VideoResult[] = filtered.slice(0, 20).map(({ score, ...rest }) => rest as VideoResult)

  console.log(`[generate] Returning ${result.length} videos`)
  return NextResponse.json({ videos: result })
}

// ── Token helper ───────────────────────────────────────────────────────────
// NOTE: provider_token is NEVER in server-side Supabase sessions (not stored in
// the cookie). We always read from the profiles table and refresh when needed.

async function getValidYouTubeToken(supabase: any, userId: string): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('youtube_access_token, youtube_refresh_token, youtube_token_updated_at')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`Could not load profile: ${error.message}`)
  if (!profile?.youtube_access_token) return null

  const updatedAt  = profile.youtube_token_updated_at ? new Date(profile.youtube_token_updated_at).getTime() : 0
  const ageMinutes = (Date.now() - updatedAt) / 60_000
  console.log(`[token] Age: ${Math.round(ageMinutes)} min`)

  if (ageMinutes < 55) return profile.youtube_access_token

  if (!profile.youtube_refresh_token) {
    console.warn('[token] Stale token, no refresh token — using stale')
    return profile.youtube_access_token
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[token] GOOGLE_CLIENT_ID/SECRET missing — using stale token')
    return profile.youtube_access_token
  }

  console.log('[token] Refreshing...')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: profile.youtube_refresh_token,
      client_id: clientId, client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[token] Refresh failed:', err)
    return profile.youtube_access_token
  }

  const tokens = await res.json()
  await supabase.from('profiles').update({
    youtube_access_token:     tokens.access_token,
    youtube_token_updated_at: new Date().toISOString(),
    ...(tokens.refresh_token ? { youtube_refresh_token: tokens.refresh_token } : {}),
  }).eq('id', userId)

  console.log('[token] Refreshed OK')
  return tokens.access_token
}

// ── YouTube search ─────────────────────────────────────────────────────────

async function searchYouTube(query: string, token: string, maxResults = 15)
  : Promise<{ items?: YouTubeSearchItem[]; error?: string }> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&videoEmbeddable=true&relevanceLanguage=en`
  let res: Response
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  } catch (e: any) {
    return { error: `Network error: ${e.message}` }
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`
    console.error(`[search] "${query}" failed: ${msg}`)
    return { error: msg }
  }

  const items = (body?.items ?? []).filter((i: any) => i?.id?.videoId && i?.snippet)
  console.log(`[search] "${query}" → ${items.length} items`)
  return { items }
}

// ── Video details ──────────────────────────────────────────────────────────

async function fetchVideoDetails(videoIds: string[], token: string): Promise<YouTubeVideoItem[]> {
  const results: YouTubeVideoItem[] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50)
    const url   = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(',')}`
    let res: Response
    try { res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }) }
    catch (e: any) { console.error('[details] Network error:', e.message); continue }

    const body = await res.json().catch(() => null)
    if (!res.ok) { console.error('[details] API error:', body?.error?.message ?? `HTTP ${res.status}`); continue }

    results.push(...(body?.items ?? []).filter((i: any) => i?.id && i?.snippet && i?.contentDetails))
  }
  return results
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreVideo({ viewCount, likeCount, duration, publishedAt, channelId, channelFreq, isTrusted, isSubscribed }: {
  viewCount: number; likeCount: number; duration: number; publishedAt: string
  channelId: string; channelFreq: Record<string, number>; isTrusted: boolean; isSubscribed: boolean
}): number {
  // Quality: like/view ratio when available (YouTube hid public likes Nov 2021), else log-views
  const likeRatio    = viewCount > 0 && likeCount > 0 ? likeCount / viewCount : null
  const qualityScore = likeRatio !== null
    ? Math.min(likeRatio * 1000, 100)
    : Math.min(Math.log10(viewCount + 1) * 18, 100)

  // Channel trust
  let channelTrust = 0
  if      (isTrusted)    channelTrust = 100
  else if (isSubscribed) channelTrust = 60
  const freq = channelFreq[channelId] ?? 0
  if      (freq >= 3) channelTrust = Math.min(channelTrust + 30, 100)
  else if (freq >= 2) channelTrust = Math.min(channelTrust + 15, 100)

  // Duration bell curve
  const mins = duration / 60
  let durationScore =
    mins < 1  ? 0   :
    mins < 3  ? 30  :
    mins < 5  ? 60  :
    mins < 25 ? 100 :
    mins < 45 ? 80  :
    mins < 90 ? 60  : 40

  // Recency
  const ageMonths = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  const recencyScore =
    ageMonths < 6  ? 100 :
    ageMonths < 12 ? 85  :
    ageMonths < 24 ? 65  :
    ageMonths < 48 ? 45  : 25

  // Popularity
  const popularityScore = Math.min(Math.log10(viewCount + 1) * 14, 100)

  return qualityScore * 0.35 + channelTrust * 0.25 + durationScore * 0.20 +
         recencyScore * 0.10 + popularityScore * 0.10
}

// ── Duration parser ────────────────────────────────────────────────────────

function parseDuration(iso: string): number {
  if (!iso) return 0
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return parseInt(m[1] ?? '0') * 3600 + parseInt(m[2] ?? '0') * 60 + parseInt(m[3] ?? '0')
}