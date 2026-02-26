import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const groupId = parseInt(id)

  // Check if group exists and is public
  const { data: group } = await adminClient
    .from('groups')
    .select('is_public')
    .eq('id', groupId)
    .single()

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  if (!group.is_public) return NextResponse.json({ error: 'Group is private' }, { status: 403 })

  // Check if already a member
  const { data: existing } = await adminClient
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }

  const { error } = await adminClient
    .from('group_members')
    .insert({ group_id: groupId, user_id: user.id, role: 'member' })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}