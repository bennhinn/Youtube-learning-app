import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the user's session (includes access token)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  const accessToken = sessionData.session.provider_token // Google access token

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 })
  }

  try {
    // Fetch subscriptions from YouTube API
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('YouTube API error:', errorData)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: response.status })
    }

    const data = await response.json()

    // Process and store subscriptions
    const subscriptions = data.items.map((item: any) => ({
      youtube_channel_id: item.snippet.resourceId.channelId,
      title: item.snippet.title,
      thumbnail_url: item.snippet.thumbnails.default?.url,
      description: item.snippet.description,
    }))

    // Insert/update channels and subscriptions in Supabase
    await storeSubscriptions(user.id, subscriptions)

    // Update last fetched timestamp in profile
    await supabase
      .from('profiles')
      .update({ youtube_subscriptions_last_fetched: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ success: true, count: subscriptions.length })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function storeSubscriptions(userId: string, subscriptions: any[]) {
  const supabase = await createClient()

  for (const sub of subscriptions) {
    // Upsert channel
    await supabase
      .from('channels')
      .upsert({
        youtube_channel_id: sub.youtube_channel_id,
        title: sub.title,
        thumbnail_url: sub.thumbnail_url,
        description: sub.description,
        last_fetched: new Date().toISOString(),
      }, { onConflict: 'youtube_channel_id' })

    // Insert subscription link
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        channel_id: sub.youtube_channel_id,
        subscribed_at: new Date().toISOString(), // You might want to preserve original subscribe date later
        last_checked: new Date().toISOString(),
      }, { onConflict: 'user_id, channel_id' })
  }
}