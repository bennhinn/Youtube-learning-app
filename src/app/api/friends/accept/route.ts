import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendId } = await request.json()
  if (!friendId) {
    return NextResponse.json({ error: 'friendId required' }, { status: 400 })
  }

  // Verify the pending request exists first
  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .eq('user_id', friendId)
    .eq('friend_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (findError) {
    console.error('Find error:', findError)
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!friendship) {
    console.error(`No pending request from ${friendId} to ${user.id}`)
    return NextResponse.json({ error: 'No pending request found' }, { status: 404 })
  }

  // Update status to accepted
  const { data: updated, error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', friendId)
    .eq('friend_id', user.id)
    .select()

  if (updateError) {
    console.error('Update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // If updated is empty array, RLS blocked it silently
  if (!updated || updated.length === 0) {
    console.error('Update returned no rows — likely blocked by RLS policy')
    return NextResponse.json(
      { error: 'Update blocked — check RLS policies on friendships table' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}