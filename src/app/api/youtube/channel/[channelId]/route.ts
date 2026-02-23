import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get token from session
    const { data: sessionData } = await supabase.auth.getSession()
    let accessToken = sessionData.session?.provider_token

    // Fallback to stored token in profiles
    if (!accessToken) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('youtube_access_token')
        .eq('id', user.id)
        .single()
      accessToken = profile?.youtube_access_token
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'No YouTube access token' }, { status: 401 })
    }

    // Fetch channel data from YouTube API
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      const errorData = await res.json()
      console.error('YouTube API error:', errorData)
      return NextResponse.json(
        { error: 'YouTube API error', details: errorData },
        { status: res.status }
      )
    }

    const data = await res.json()
    const channel = data.items?.[0] || null

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Channel API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}