import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current user's friends (accepted)
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friendIds = friendships?.flatMap(f => 
    f.user_id === user.id ? f.friend_id : f.user_id
  ) ?? []

  // Exclude current user and existing friends/requests
  const { data: allFriendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  const excludedIds = new Set<string>()
  excludedIds.add(user.id)
  allFriendships?.forEach(f => {
    excludedIds.add(f.user_id)
    excludedIds.add(f.friend_id)
  })

  // Find users who are friends with at least one of my friends (mutual)
  if (friendIds.length === 0) {
    // If no friends, return some random users
    const { data: randomUsers } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url')
      .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
      .limit(10)
    return NextResponse.json({ suggestions: randomUsers || [] })
  }

  // Find users who are friends with my friends but not me
  const { data: suggestions, error: sugError } = await supabase
    .from('friendships')
    .select(`
      user_id,
      friend_id,
      user:user_id (id, display_name, email, avatar_url),
      friend:friend_id (id, display_name, email, avatar_url)
    `)
    .or(`user_id.in.(${friendIds.join(',')}),friend_id.in.(${friendIds.join(',')})`)
    .eq('status', 'accepted')

  if (sugError) {
    return NextResponse.json({ error: sugError.message }, { status: 500 })
  }

  // Extract potential friend profiles (the ones that are not the current user)
  const potential = new Map<string, any>()
  suggestions?.forEach(s => {
    if (s.user_id !== user.id && !excludedIds.has(s.user_id)) {
      const profile = Array.isArray(s.user) ? s.user[0] : s.user
      if (profile) potential.set(s.user_id, profile)
    }
    if (s.friend_id !== user.id && !excludedIds.has(s.friend_id)) {
      const profile = Array.isArray(s.friend) ? s.friend[0] : s.friend
      if (profile) potential.set(s.friend_id, profile)
    }
  })

  // Convert to array and limit
  const suggestionsList = Array.from(potential.values()).slice(0, 15)

  return NextResponse.json({ suggestions: suggestionsList })
}