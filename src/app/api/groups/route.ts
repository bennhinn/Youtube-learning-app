// app/api/groups/route.ts
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, isPublic } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Insert the group
  const { data: group, error: groupError } = await adminClient
    .from('groups')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      is_public: isPublic ?? true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (groupError) {
    console.error('GROUP INSERT ERROR:', JSON.stringify(groupError, null, 2))
    return NextResponse.json({ error: groupError.message }, { status: 500 })
  }

  console.log('Group created:', group.id, 'type:', typeof group.id)

  // Convert group.id to a number (ensures bigint compatibility)
  const groupId = Number(group.id)

  // Add the creator as an admin member
  const { data: memberData, error: memberError } = await adminClient
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'admin',
    })
    .select()

  if (memberError) {
    console.error('MEMBER INSERT ERROR:', JSON.stringify(memberError, null, 2))
    console.error('Error code:', memberError.code)
    console.error('Error details:', memberError.details)
    console.error('Error hint:', memberError.hint)
    // Rollback group
    await adminClient.from('groups').delete().eq('id', groupId)
    return NextResponse.json({
      error: memberError.message,
      code: memberError.code,
      details: memberError.details,
      hint: memberError.hint,
    }, { status: 500 })
  }

  console.log('Member inserted:', memberData)
  return NextResponse.json({ groupId })
}