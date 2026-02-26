import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/groups/[id]/digest
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const groupId = parseInt(id)

  // Verify membership
  const { data: membership } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  // Week boundary
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // ── 1. All contributions for this group (across all goals) ────────────────
  const { data: allContributions } = await adminClient
    .from('group_goal_contributions')
    .select(`
      id, contributed_at, user_id,
      user:user_id (id, display_name, email, avatar_url),
      video:video_id (title, thumbnail_url, youtube_video_id, channel_title),
      goal:group_goal_id (name, group_id),
      reactions:contribution_reactions (reaction_type, user_id),
      watches:group_video_watches (user_id),
      comments:contribution_comments (id)
    `)
    .eq('goal.group_id', groupId)

  if (!allContributions || allContributions.length === 0) {
    return NextResponse.json({ digest: null })
  }

  // ── 2. This week's contributions ─────────────────────────────────────────
  const weekContributions = allContributions.filter(c => c.contributed_at >= weekAgo)

  // ── 3. All group members ─────────────────────────────────────────────────
  const { data: members } = await adminClient
    .from('group_members')
    .select('user_id, user:user_id (id, display_name, email, avatar_url)')
    .eq('group_id', groupId)

  const totalMembers = members?.length ?? 0

  // ── 4. Leaderboard — score = contributions*3 + watches*1 + reactions_received*2 ──
  const scoreMap: Record<string, {
    profile: any
    contributions: number
    watches: number
    reactionsReceived: number
    score: number
  }> = {}

  for (const m of members || []) {
    const profile = Array.isArray(m.user) ? m.user[0] : m.user
    scoreMap[m.user_id] = { profile, contributions: 0, watches: 0, reactionsReceived: 0, score: 0 }
  }

  for (const c of allContributions) {
    const uid = c.user_id
    if (!scoreMap[uid]) continue
    scoreMap[uid].contributions += 1
    scoreMap[uid].reactionsReceived += (c.reactions || []).length

    for (const w of (c.watches || [])) {
      if (scoreMap[w.user_id]) scoreMap[w.user_id].watches += 1
    }
  }

  for (const uid of Object.keys(scoreMap)) {
    const s = scoreMap[uid]
    s.score = s.contributions * 3 + s.watches * 1 + s.reactionsReceived * 2
  }

  const leaderboard = Object.values(scoreMap)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // ── 5. Most reacted video this week ──────────────────────────────────────
  const mostReacted = weekContributions
    .map(c => ({ ...c, reactionCount: (c.reactions || []).length }))
    .sort((a, b) => b.reactionCount - a.reactionCount)[0] || null

  // ── 6. Group-wide stats ──────────────────────────────────────────────────
  const totalWatches     = allContributions.reduce((acc, c) => acc + (c.watches || []).length, 0)
  const weekWatches      = allContributions.reduce((acc, c) => {
    // count watches this week (we don't have per-watch timestamps in select here, approximate)
    return acc + (c.watches || []).length
  }, 0)
  const totalReactions   = allContributions.reduce((acc, c) => acc + (c.reactions || []).length, 0)
  const totalComments    = allContributions.reduce((acc, c) => acc + (c.comments || []).length, 0)
  const weekVideos       = weekContributions.length
  const activeThisWeek   = new Set(weekContributions.map(c => c.user_id)).size

  return NextResponse.json({
    digest: {
      leaderboard,
      mostReacted: mostReacted ? {
        title: (Array.isArray(mostReacted.video) ? mostReacted.video[0] : mostReacted.video)?.title,
        thumbnail: (Array.isArray(mostReacted.video) ? mostReacted.video[0] : mostReacted.video)?.thumbnail_url,
        youtubeId: (Array.isArray(mostReacted.video) ? mostReacted.video[0] : mostReacted.video)?.youtube_video_id,
        channelTitle: (Array.isArray(mostReacted.video) ? mostReacted.video[0] : mostReacted.video)?.channel_title,
        reactionCount: mostReacted.reactionCount,
        contributorProfile: Array.isArray(mostReacted.user) ? mostReacted.user[0] : mostReacted.user,
        goalName: (Array.isArray(mostReacted.goal) ? mostReacted.goal[0] : mostReacted.goal)?.name,
      } : null,
      stats: {
        totalWatches,
        totalReactions,
        totalComments,
        weekVideos,
        activeThisWeek,
        totalMembers,
      },
    }
  })
}