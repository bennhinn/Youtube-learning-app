import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; goalId: string; contributionId: string }> }
) {
  const { id, contributionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const groupId = parseInt(id)
  const contributionIdNum = parseInt(contributionId)

  if (isNaN(groupId) || isNaN(contributionIdNum)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  // Verify group membership
  const { data: membership } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // Toggle: check if already watched
  const { data: existing } = await adminClient
    .from('group_video_watches')
    .select('id')
    .eq('contribution_id', contributionIdNum)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await adminClient
      .from('group_video_watches')
      .delete()
      .eq('id', existing.id)

    return NextResponse.json({ action: 'unwatched' })
  } else {
    const { data, error } = await adminClient
      .from('group_video_watches')
      .insert({ contribution_id: contributionIdNum, user_id: user.id })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'watched', watch: data })
  }
}