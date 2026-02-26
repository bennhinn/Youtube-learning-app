import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/groups/[id]/goals/[goalId]/contributions/[contributionId]/comments
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; goalId: string; contributionId: string }> }
) {
  const { contributionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: comments, error } = await adminClient
    .from('contribution_comments')
    .select(`
      *,
      user:user_id (id, display_name, email, avatar_url)
    `)
    .eq('contribution_id', parseInt(contributionId))
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments })
}

// POST /api/groups/[id]/goals/[goalId]/contributions/[contributionId]/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; goalId: string; contributionId: string }> }
) {
  const { id, contributionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const groupId = parseInt(id)
  const contributionIdNum = parseInt(contributionId)

  // Verify group membership
  const { data: membership } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const body = await request.json()
  const content = body.content?.trim()
  const parentId = body.parent_id || null

  if (!content || content.length === 0) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: 'Comment too long' }, { status: 400 })
  }

  const { data: comment, error } = await adminClient
    .from('contribution_comments')
    .insert({
      contribution_id: contributionIdNum,
      user_id: user.id,
      content,
      parent_id: parentId,
    })
    .select(`*, user:user_id (id, display_name, email, avatar_url)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment })
}

// DELETE /api/groups/[id]/goals/[goalId]/contributions/[contributionId]/comments
// Pass { comment_id } in body
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; goalId: string; contributionId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const commentId = body.comment_id
  if (!commentId) return NextResponse.json({ error: 'comment_id required' }, { status: 400 })

  const adminClient = createAdminClient()

  // Only allow deleting own comments
  const { data: comment } = await adminClient
    .from('contribution_comments')
    .select('user_id')
    .eq('id', commentId)
    .maybeSingle()

  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  if (comment.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await adminClient.from('contribution_comments').delete().eq('id', commentId)
  return NextResponse.json({ deleted: true })
}