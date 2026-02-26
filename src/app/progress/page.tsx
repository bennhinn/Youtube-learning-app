// app/progress/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Clock, Calendar } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch recent progress with video details
  const { data: progress } = await supabase
    .from('progress')
    .select(`
      watched_at,
      video:video_id (
        youtube_video_id,
        title,
        thumbnail_url,
        channel_title,
        duration
      )
    `)
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .limit(20)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', padding: '52px 20px 100px' }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>Watch History</h1>
      {progress?.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>No videos watched yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {progress?.map((p) => {
            const video = Array.isArray(p.video) ? p.video[0] : p.video
            if (!video) return null
            return (
              <div key={p.watched_at} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 12 }}>
                {video.thumbnail_url && (
                  <img src={video.thumbnail_url} alt={video.title} style={{ width: 80, height: 45, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{video.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0' }}>{video.channel_title}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    <span><Clock size={12} /> {formatDuration(video.duration)}</span>
                    <span><Eye size={12} /> Watched {formatDate(p.watched_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <BottomNavClient />
    </div>
  )
}