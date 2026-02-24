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

  const { data: users, error: searchError } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .ilike('email', `%${q}%`)
    .neq('id', user.id)
    .limit(10)

  if (searchError) {
    return NextResponse.json({ error: searchError.message }, { status: 500 })
  }

  return NextResponse.json({ users })
}