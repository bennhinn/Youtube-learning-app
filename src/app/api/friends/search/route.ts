import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  if (!q) {
    return NextResponse.json({ users: [] })
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get IDs of existing friends (accepted or pending) to exclude them
  const { data: existingFriendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  const excludedIds = new Set<string>()
  excludedIds.add(user.id)
  existingFriendships?.forEach(f => {
    excludedIds.add(f.user_id)
    excludedIds.add(f.friend_id)
  })

  // Search by email OR display_name (case-insensitive)
  const { data: users, error: searchError } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
    .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
    .limit(20)

  if (searchError) {
    return NextResponse.json({ error: searchError.message }, { status: 500 })
  }

  return NextResponse.json({ users })
}