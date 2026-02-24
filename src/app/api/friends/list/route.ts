import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all friendships involving current user (no 'id' column)
  const { data: friendships, error: fError } = await supabase
    .from('friendships')
    .select(`
      status,
      created_at,
      user_id,
      friend_id,
      user:user_id (id, display_name, email, avatar_url),
      friend:friend_id (id, display_name, email, avatar_url)
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  if (fError) {
    return NextResponse.json({ error: fError.message }, { status: 500 })
  }

  const accepted = []
  const pendingSent = []
  const pendingReceived = []

  for (const f of friendships) {
    // The joined fields might be arrays, but should be single objects
    const userProfile = Array.isArray(f.user) ? f.user[0] : f.user
    const friendProfile = Array.isArray(f.friend) ? f.friend[0] : f.friend

    // Determine the "other" user (the friend)
    const other = f.user_id === user.id ? friendProfile : userProfile
    const record = {
      id: other.id,                       // this is the friend's user id, not friendship id
      display_name: other.display_name,
      email: other.email,
      avatar_url: other.avatar_url,
      friendship_created_at: f.created_at,
    }

    if (f.status === 'accepted') {
      accepted.push(record)
    } else if (f.status === 'pending') {
      if (f.user_id === user.id) {
        pendingSent.push(record)
      } else {
        pendingReceived.push(record)
      }
    }
  }

  return NextResponse.json({
    friends: accepted,
    pendingSent,
    pendingReceived,
  })
}