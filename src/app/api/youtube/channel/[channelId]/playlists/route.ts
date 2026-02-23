import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params
  const url = new URL(request.url)
  const pageToken = url.searchParams.get('pageToken') || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.provider_token
  if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 401 })

  try {
    const searchParams = new URLSearchParams({
      part: 'snippet,contentDetails',
      channelId,
      maxResults: '20',
    })
    if (pageToken) searchParams.set('pageToken', pageToken)

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?${searchParams}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) throw new Error('YouTube API error')
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
  }
}