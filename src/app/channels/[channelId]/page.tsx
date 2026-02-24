import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChannelClient from './ChannelClient'

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user is already subscribed
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('channel_id')
    .eq('user_id', user.id)
    .eq('channel_id', channelId)
    .maybeSingle()

  const isSubscribed = !!subscription

  return <ChannelClient channelId={channelId} isSubscribed={isSubscribed} />
}