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

  // Find the pending request where current user is the receiver (friend_id)
  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .eq('user_id', friendId)
    .eq('friend_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (findError || !friendship) {
    return NextResponse.json({ error: 'No pending request found' }, { status: 404 })
  }

  // Update using the composite key
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', friendId)
    .eq('friend_id', user.id)

  if (updateError) {
    console.error(updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}