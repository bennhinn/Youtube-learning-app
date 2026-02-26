import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  const { id, goalId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const groupId = parseInt(id)
  const groupGoalId = parseInt(goalId)

  console.log('contributions route — id:', id, 'goalId:', goalId, 'parsed:', groupId, groupGoalId)

  if (isNaN(groupId) || isNaN(groupGoalId)) {
    return NextResponse.json({ error: `Invalid params: id=${id}, goalId=${goalId}` }, { status: 400 })
  }

  const { data: membership } = await adminClient
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  const body = await request.json()
  const { videoId, title, thumbnailUrl, channelTitle, channelId } = body

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  // ── Step 1: upsert channel first (videos.channel_id FK) ──────────────────
  if (channelId) {
    const { error: channelError } = await adminClient
      .from('channels')
      .upsert({
        youtube_channel_id: channelId,
        title: channelTitle || 'Unknown Channel',
        last_fetched: new Date().toISOString(),
      }, { onConflict: 'youtube_channel_id' })

    if (channelError) {
      console.error('Channel upsert error:', channelError)
      return NextResponse.json({ error: `Channel upsert failed: ${channelError.message}` }, { status: 500 })
    }
  }

  // ── Step 2: upsert video (group_goal_contributions.video_id FK) ───────────
  const { error: videoError } = await adminClient
    .from('videos')
    .upsert({
      youtube_video_id: videoId,
      title: title || 'Untitled',
      thumbnail_url: thumbnailUrl || null,
      channel_id: channelId || null,
      channel_title: channelTitle || null,
      last_fetched: new Date().toISOString(),
    }, { onConflict: 'youtube_video_id' })

  if (videoError) {
    console.error('Video upsert error:', videoError)
    return NextResponse.json({ error: `Video upsert failed: ${videoError.message}` }, { status: 500 })
  }

  // ── Step 3: insert contribution (now FK is satisfied) ─────────────────────
  const { data: contribution, error } = await adminClient
    .from('group_goal_contributions')
    .insert({
      group_goal_id: groupGoalId,
      user_id: user.id,
      video_id: videoId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Contribution insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contribution })
}