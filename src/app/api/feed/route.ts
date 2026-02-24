// app/api/feed/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all accepted friends (both directions)
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  if (friendError) {
    return NextResponse.json({ error: friendError.message }, { status: 500 })
  }

  // Extract friend IDs (the other side)
  const friendIds = friendships?.flatMap(f =>
    f.user_id === user.id ? f.friend_id : f.user_id
  ) ?? []

  if (friendIds.length === 0) {
    return NextResponse.json({ activities: [] })
  }

  // Fetch activities from friends, including user details
  const { data: activities, error: actError } = await supabase
    .from('activity_log')
    .select(`
      *,
      user:user_id (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(50)

  if (actError) {
    return NextResponse.json({ error: actError.message }, { status: 500 })
  }

  return NextResponse.json({ activities })
}