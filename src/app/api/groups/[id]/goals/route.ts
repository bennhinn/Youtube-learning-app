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

  // Check if user is an admin (optional – could allow any member)
  const { data: membership } = await adminClient
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create goals' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Goal name is required' }, { status: 400 })
  }

  const { data: goal, error } = await adminClient
    .from('group_goals')
    .insert({
      group_id: groupId,
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goal })
}