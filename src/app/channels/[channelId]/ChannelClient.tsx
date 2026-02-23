'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Play, Eye, Users, X,
  Bell, Share2, Bookmark, ListVideo, AlertCircle
} from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'

type Tab = 'videos' | 'playlists' | 'about'

interface Video {
  id: { videoId: string }
  snippet: {
    title: string
    description: string
    publishedAt: string
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
  }
}

interface Playlist {
  id: string
  snippet: {
    title: string
    thumbnails: { high?: { url: string }; medium?: { url: string } }
  }
  contentDetails?: { itemCount: number }
}

export default function ChannelClient({ channelId }: { channelId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('videos')
  const [channel, setChannel] = useState<any>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchChannel = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/youtube/channel/${channelId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch channel')
        setChannel(data)
      } catch (err: any) {
        setError(err.message || 'Could not load channel')
      }
      setLoading(false)
    }
    fetchChannel()
  }, [channelId])

  useEffect(() => {
    if (!channel) return
    if (activeTab === 'videos') {
      fetch(`/api/youtube/channel/${channelId}/videos`)
        .then(r => r.json())
        .then(d => setVideos(d.items || []))
        .catch(console.error)
    } else if (activeTab === 'playlists') {
      fetch(`/api/youtube/channel/${channelId}/playlists`)
        .then(r => r.json())
        .then(d => setPlaylists(d.items || []))
        .catch(console.error)
    }
  }, [activeTab, channelId, channel])

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = activeVideo ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeVideo])

  const fmt = (n: number) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toLocaleString()
  }

  const fmtDate = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
    if (days < 1) return 'Today'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  const thumb = (v: Video) =>
    v.snippet.thumbnails.high?.url ||
    v.snippet.thumbnails.medium?.url ||
    v.snippet.thumbnails.default?.url || ''

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: '#080b12', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: "'Syne', sans-serif" }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(168,85,247,0.15)', borderTopColor: '#a855f7', animation: 'spin 0.75s linear infinite' }} />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !channel) {
    return (
      <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', padding: '52px 20px', fontFamily: "'Syne', sans-serif" }}>
        <Link href="/subscriptions" style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, textDecoration: 'none', fontSize: 13 }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40 }}>
          <AlertCircle size={44} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Couldn't load channel</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>{error}</p>
          <Link href="/subscriptions" style={{ display: 'inline-block', marginTop: 24, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', borderRadius: 30, padding: '10px 24px', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            Go back
          </Link>
        </div>
      </div>
    )
  }

  const snippet = channel.snippet
  const stats = channel.statistics
  const bannerUrl = channel.brandingSettings?.image?.bannerExternalUrl
  const avatarUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url
  const subCount = parseInt(stats?.subscriberCount ?? '0')
  const videoCount = parseInt(stats?.videoCount ?? '0')
  const viewCount = parseInt(stats?.viewCount ?? '0')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        .ch-root {
          background: #080b12;
          min-height: 100vh;
          color: white;
          font-family: 'Syne', sans-serif;
          max-width: 390px;
          margin: 0 auto;
          position: relative;
        }

        .tab-bar {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 20px;
          overflow-x: auto;
          scrollbar-width: none;
          position: sticky;
          top: 0;
          background: rgba(8,11,18,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 20;
        }
        .tab-bar::-webkit-scrollbar { display: none; }

        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          font-weight: 600;
          padding: 12px 16px;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Syne', sans-serif;
          transition: color 0.2s, border-color 0.2s;
          letter-spacing: 0.02em;
        }
        .tab-btn.active {
          color: #a855f7;
          border-bottom-color: #a855f7;
        }

        .video-row {
          display: flex;
          gap: 12px;
          padding: 12px 20px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .video-row:active { background: rgba(255,255,255,0.05); }

        .pl-row {
          display: flex;
          gap: 12px;
          padding: 12px 20px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pl-row:active { background: rgba(255,255,255,0.05); }

        /* Bottom sheet */
        .sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 100;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: fadeIn 0.2s ease;
        }
        .sheet {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          width: 100%;
          max-width: 390px;
          background: #0d0f1a;
          border-radius: 24px 24px 0 0;
          border-top: 1px solid rgba(255,255,255,0.08);
          z-index: 101;
          animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1);
          max-height: 92vh;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sheet::-webkit-scrollbar { display: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to   { transform: translateX(-50%) translateY(0);    }
        }

        .act-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          font-size: 11px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          padding: 0 12px;
          transition: color 0.15s, transform 0.15s;
          letter-spacing: 0.02em;
        }
        .act-btn:active { color: #a855f7; transform: scale(0.92); }

        .sub-btn {
          flex: 1;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 30px;
          padding: 11px;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          box-shadow: 0 0 22px rgba(168,85,247,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .sub-btn:active { transform: scale(0.97); box-shadow: 0 0 14px rgba(168,85,247,0.3); }

        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .icon-circle:active { background: rgba(255,255,255,0.14); }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 5px 12px;
        }

        .drag-pill {
          width: 36px;
          height: 4px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
          margin: 12px auto 0;
        }

        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
        }
      `}</style>

      {/* ── Video player bottom sheet ── */}
      {activeVideo && (
        <>
          <div className="sheet-overlay" onClick={() => setActiveVideo(null)} />
          <div className="sheet">
            <div className="drag-pill" />

            {/* 16:9 embed */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', marginTop: 14 }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Title + channel */}
            <div style={{ padding: '16px 20px 0' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: 'white' }}>
                {activeVideo.snippet.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                {avatarUrl && (
                  <img src={avatarUrl} alt={snippet.title} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {snippet.title}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  · {fmtDate(activeVideo.snippet.publishedAt)}
                </span>
              </div>
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
              <button
                className="act-btn"
                onClick={() => setSaved(s => !s)}
                style={{ color: saved ? '#a855f7' : undefined }}
              >
                <Bookmark size={22} fill={saved ? '#a855f7' : 'none'} color={saved ? '#a855f7' : 'rgba(255,255,255,0.55)'} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <button className="act-btn">
                <Share2 size={22} />
                Share
              </button>
              <button className="act-btn">
                <Bell size={22} />
                Notify
              </button>
              <button
                className="act-btn"
                onClick={() => setActiveVideo(null)}
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                <X size={22} />
                Close
              </button>
            </div>

            {/* Description */}
            {activeVideo.snippet.description && (
              <div style={{ padding: '14px 20px 40px' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                  {activeVideo.snippet.description.slice(0, 260)}
                  {activeVideo.snippet.description.length > 260 ? '…' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Main page ── */}
      <div style={{ background: '#080b12', minHeight: '100vh', position: 'relative' }}>
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', top: 320, right: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        <div className="ch-root" style={{ zIndex: 1, position: 'relative', paddingBottom: 100 }}>

          {/* Floating back button */}
          <div style={{ position: 'absolute', top: 52, left: 20, zIndex: 30 }}>
            <Link
              href="/subscriptions"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(8,11,18,0.6)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '6px 14px',
                color: 'white', fontSize: 12, fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} /> Back
            </Link>
          </div>

          {/* ── Banner ── */}
          <div style={{ height: 148, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#0c1929)' }}>
            {bannerUrl ? (
              <img src={bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 60%,rgba(168,85,247,0.4) 0%,transparent 55%), radial-gradient(ellipse at 80% 25%,rgba(6,182,212,0.3) 0%,transparent 50%)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 30%,rgba(8,11,18,0.88) 100%)' }} />
          </div>

          {/* ── Channel identity ── */}
          <div style={{ padding: '0 20px', marginTop: -42, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
              {/* Avatar */}
              <div style={{ width: 76, height: 76, borderRadius: '50%', border: '3px solid #080b12', outline: '2px solid rgba(168,85,247,0.4)', overflow: 'hidden', background: '#080b12', flexShrink: 0, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={snippet.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'white' }}>{snippet.title.charAt(0)}</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {snippet.title}
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {snippet.customUrl ? `@${snippet.customUrl.replace('@', '')}` : ''} · {fmt(subCount)} subscribers
                </p>
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { icon: <Users size={12} color="#a855f7" />, val: fmt(subCount), label: 'subs' },
                { icon: <Play size={12} color="#06b6d4" />, val: videoCount.toLocaleString(), label: 'videos' },
                { icon: <Eye size={12} color="#f59e0b" />, val: fmt(viewCount), label: 'views' },
              ].map(s => (
                <div key={s.label} className="stat-pill">
                  {s.icon}
                  <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Subscribe / action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <button className="sub-btn">Subscribe</button>
              <button className="icon-circle"><Bell size={17} color="white" /></button>
              <button className="icon-circle"><Share2 size={16} color="white" /></button>
            </div>
          </div>

          {/* ── Tab bar (sticky) ── */}
          <div className="tab-bar">
            {(['videos', 'playlists', 'about'] as Tab[]).map(tab => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── VIDEOS ── */}
          {activeTab === 'videos' && (
            <div style={{ paddingTop: 8 }}>
              {videos.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '48px 20px' }}>No videos yet.</p>
                : videos.map(video => (
                  <div
                    key={video.id.videoId}
                    className="video-row"
                    onClick={() => setActiveVideo(video)}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={thumb(video)}
                        alt={video.snippet.title}
                        style={{ width: 120, height: 67, borderRadius: 10, objectFit: 'cover', display: 'block', background: 'rgba(255,255,255,0.05)' }}
                      />
                      {/* Play overlay */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(0,0,0,0.15)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(168,85,247,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(168,85,247,0.6)' }}>
                          <Play size={14} color="white" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.35,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                      }}>
                        {video.snippet.title}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        {snippet.title} · {fmtDate(video.snippet.publishedAt)}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── PLAYLISTS ── */}
          {activeTab === 'playlists' && (
            <div style={{ paddingTop: 8 }}>
              {playlists.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '48px 20px' }}>No playlists found.</p>
                : playlists.map(pl => (
                  <div key={pl.id} className="pl-row">
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={pl.snippet.thumbnails.high?.url || pl.snippet.thumbnails.medium?.url}
                        alt={pl.snippet.title}
                        style={{ width: 120, height: 67, borderRadius: 10, objectFit: 'cover', display: 'block', background: 'rgba(255,255,255,0.05)' }}
                      />
                      {/* Playlist badge */}
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 34, borderRadius: '0 10px 10px 0', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <ListVideo size={12} color="white" />
                        <span style={{ fontSize: 9, color: 'white', fontFamily: "'DM Mono',monospace" }}>{pl.contentDetails?.itemCount ?? '?'}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {pl.snippet.title}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(168,85,247,0.6)', fontWeight: 600 }}>
                        {pl.contentDetails?.itemCount ?? '?'} videos
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── ABOUT ── */}
          {activeTab === 'about' && (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {snippet.description && (
                <div className="card-glass" style={{ padding: 18 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>About</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{snippet.description}</p>
                </div>
              )}

              <div className="card-glass" style={{ padding: 18 }}>
                <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Stats</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Subscribers', val: subCount.toLocaleString(), color: '#a855f7' },
                    { label: 'Videos', val: videoCount.toLocaleString(), color: '#06b6d4' },
                    { label: 'Total views', val: viewCount.toLocaleString(), color: '#f59e0b' },
                    { label: 'Joined', val: new Date(snippet.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), color: '#10b981' },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
        <BottomNavClient />
      </div>
    </>
  )
}