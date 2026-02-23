import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChannelClient from './ChannelClient'

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ChannelClient channelId={channelId} />
}