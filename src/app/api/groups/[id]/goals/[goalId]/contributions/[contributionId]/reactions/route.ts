import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

const VALID_REACTIONS = ['insightful', 'must_watch', 'discuss', 'watched'] as const
type ReactionType = typeof VALID_REACTIONS[number]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; goalId: string; contributionId: string }> }
) {
  const { id, goalId, contributionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const reactionType = body.reaction_type as ReactionType

  if (!VALID_REACTIONS.includes(reactionType)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  const contributionIdNum = parseInt(contributionId)
  if (isNaN(contributionIdNum)) {
    return NextResponse.json({ error: 'Invalid contribution id' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Verify user is a member of this group
  const groupId = parseInt(id)
  const { data: membership } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // Check if reaction already exists → toggle
  const { data: existing } = await adminClient
    .from('contribution_reactions')
    .select('id')
    .eq('contribution_id', contributionIdNum)
    .eq('user_id', user.id)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    await adminClient
      .from('contribution_reactions')
      .delete()
      .eq('id', existing.id)

    return NextResponse.json({ action: 'removed', reaction_type: reactionType })
  } else {
    // Add reaction
    const { data, error } = await adminClient
      .from('contribution_reactions')
      .insert({
        contribution_id: contributionIdNum,
        user_id: user.id,
        reaction_type: reactionType,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Reaction insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ action: 'added', reaction: data })
  }
}