'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Eye, Clock, RefreshCw } from 'lucide-react'

export default function VideoPicker({ groupId, goalId }: { groupId: number; goalId: number }) {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/youtube/subscriptions/videos')
      .then(res => res.json())
      .then(data => setVideos(data.videos || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const addVideo = async (video: any) => {
    setAdding(video.id)
    try {
      const res = await fetch(`/api/groups/${groupId}/goals/${goalId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnail,
          channelTitle: video.channelTitle,
          channelId: video.channelId,
        }),
      })
      if (!res.ok) throw new Error('Failed to add video')
      router.push(`/groups/${groupId}/goals/${goalId}`)
    } catch {
      alert('Could not add video')
    } finally {
      setAdding(null)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ marginBottom: 20 }}>
            {/* Thumbnail skeleton */}
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.4s ease infinite', backgroundSize: '200% 100%' }} />
            <div style={{ padding: '10px 4px', display: 'flex', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0, animation: 'shimmer 1.4s ease infinite' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 13, width: '90%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.4s ease infinite' }} />
                <div style={{ height: 11, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.4s ease infinite' }} />
              </div>
            </div>
          </div>
        ))}
        <style>{`@keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }`}</style>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={24} color="#a855f7" />
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.35)', fontFamily: "'Syne',sans-serif" }}>No videos found from your subscriptions.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {videos.map(video => {
        const isAdding = adding === video.id

        return (
          <div
            key={video.id}
            onClick={() => !adding && addVideo(video)}
            style={{
              marginBottom: 20,
              cursor: adding ? 'not-allowed' : 'pointer',
              opacity: adding && !isAdding ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Thumbnail — full width, 16:9 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#111' }}>
              <img
                src={video.thumbnail}
                alt={video.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* Duration badge */}
              {video.duration && (
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.85)', borderRadius: 4, padding: '2px 6px', fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 500, color: 'white', letterSpacing: '0.02em' }}>
                  {video.duration}
                </div>
              )}

              {/* Add overlay on active */}
              {isAdding && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(168,85,247,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                  <RefreshCw size={28} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}

              {/* Purple add ring on hover — handled via active tap overlay */}
              {!isAdding && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(168,85,247,0)', borderRadius: 12, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(168,85,247,0)')}
                />
              )}
            </div>

            {/* Metadata row below thumbnail — YouTube style */}
            <div style={{ display: 'flex', gap: 10, padding: '10px 4px 0' }}>
              {/* Channel avatar */}
              <div style={{ flexShrink: 0 }}>
                {video.channelAvatar ? (
                  <img src={video.channelAvatar} alt={video.channelTitle} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', fontFamily: "'Syne',sans-serif" }}>
                    {video.channelTitle?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.4,
                  fontFamily: "'Syne',sans-serif",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: 4,
                }}>
                  {video.title}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Mono',monospace", display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{video.channelTitle}</span>
                  {video.viewCountFormatted && (
                    <><span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{video.viewCountFormatted}</span></>
                  )}
                  {video.timeAgo && (
                    <><span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span><span>{video.timeAgo}</span></>
                  )}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}