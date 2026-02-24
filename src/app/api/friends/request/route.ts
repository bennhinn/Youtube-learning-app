// app/api/friends/request/route.ts
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
  if (friendId === user.id) {
    return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 })
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Friendship already exists' }, { status: 409 })
  }

  // Create pending friendship
  const { error: insertError } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending',
    })

  if (insertError) {
    console.error(insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}