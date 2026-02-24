// app/api/friends/accept/route.ts
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

  // Find the pending request where current user is the friend (receiver)
  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_id', friendId)
    .eq('friend_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (findError || !friendship) {
    return NextResponse.json({ error: 'No pending request found' }, { status: 404 })
  }

  // Update to accepted
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendship.id)

  if (updateError) {
    console.error(updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}