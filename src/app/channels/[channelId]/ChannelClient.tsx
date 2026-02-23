'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Play, Eye, Users, X,
  Bell, Share2, Bookmark, ListVideo, AlertCircle,
  ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp, List
} from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import GameLoadingScreen from '@/components/GameLoadingScreen'

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

interface VideoDetails {
  viewCount: string
  likeCount: string
  commentCount: string
  duration: string
  tags: string[]
}

interface Playlist {
  id: string
  snippet: {
    title: string
    description?: string
    thumbnails: { high?: { url: string }; medium?: { url: string } }
  }
  contentDetails?: { itemCount: number }
}

interface PlaylistItem {
  snippet: {
    title: string
    description: string
    publishedAt: string
    position: number
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
    resourceId: { videoId: string }
    videoOwnerChannelTitle?: string
  }
}

export default function ChannelClient({ channelId }: { channelId: string }) {
  const [activeTab, setActiveTab]   = useState<Tab>('videos')
  const [channel, setChannel]       = useState<any>(null)
  const [videos, setVideos]         = useState<Video[]>([])
  const [playlists, setPlaylists]   = useState<Playlist[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // Video sheet state
  const [activeVideo, setActiveVideo]           = useState<Video | null>(null)
  const [selectedVideoId, setSelectedVideoId]   = useState<string | null>(null)
  const [videoDetails, setVideoDetails]         = useState<VideoDetails | null>(null)
  const [detailsLoading, setDetailsLoading]     = useState(false)
  const [descExpanded, setDescExpanded]         = useState(false)
  const [saved, setSaved]                       = useState(false)
  const [liked, setLiked]                       = useState(false)

  // Playlist sheet state
  const [activePlaylist, setActivePlaylist]             = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems]               = useState<PlaylistItem[]>([])
  const [playlistLoading, setPlaylistLoading]           = useState(false)
  const [playlistVideoId, setPlaylistVideoId]           = useState<string | null>(null)
  const [activePlaylistVideo, setActivePlaylistVideo]   = useState<PlaylistItem | null>(null)

  useEffect(() => {
    const fetchChannel = async () => {
      setLoading(true); setError(null)
      try {
        const res = await fetch(`/api/youtube/channel/${channelId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch channel')
        setChannel(data)
      } catch (err: any) { setError(err.message || 'Could not load channel') }
      setLoading(false)
    }
    fetchChannel()
  }, [channelId])

  useEffect(() => {
    if (!channel) return
    if (activeTab === 'videos') {
      fetch(`/api/youtube/channel/${channelId}/videos`)
        .then(r => r.json()).then(d => setVideos(d.items || [])).catch(console.error)
    } else if (activeTab === 'playlists') {
      fetch(`/api/youtube/channel/${channelId}/playlists`)
        .then(r => r.json()).then(d => setPlaylists(d.items || [])).catch(console.error)
    }
  }, [activeTab, channelId, channel])

  // Lock body scroll when any sheet is open
  useEffect(() => {
    document.body.style.overflow = (activeVideo || activePlaylist) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeVideo, activePlaylist])

  // ── Shared video detail fetcher ────────────────────────────────────────────
  const fetchVideoDetails = async (videoId: string) => {
    setDetailsLoading(true); setVideoDetails(null)
    try {
      const res = await fetch(`/api/youtube/video/${videoId}`)
      if (res.ok) {
        const data = await res.json()
        const s = data.statistics || {}; const d = data.contentDetails || {}
        setVideoDetails({
          viewCount:    s.viewCount    || '0',
          likeCount:    s.likeCount    || '0',
          commentCount: s.commentCount || '0',
          duration:     parseDuration(d.duration || ''),
          tags:         (data.snippet?.tags || []).slice(0, 6),
        })
      }
    } catch (e) { console.error(e) }
    setDetailsLoading(false)
  }

  // ── Channel video handlers ─────────────────────────────────────────────────
  const handleVideoSelect = async (video: Video) => {
    setSelectedVideoId(video.id.videoId)
    setDescExpanded(false); setSaved(false); setLiked(false)
    setTimeout(() => setActiveVideo(video), 220)
    fetchVideoDetails(video.id.videoId)
  }

  const handleCloseSheet = () => {
    setActiveVideo(null); setSelectedVideoId(null); setVideoDetails(null)
  }

  // ── Playlist handlers ──────────────────────────────────────────────────────
  const handlePlaylistSelect = async (pl: Playlist) => {
    setActivePlaylist(pl); setPlaylistItems([])
    setPlaylistVideoId(null); setActivePlaylistVideo(null)
    setPlaylistLoading(true)
    try {
      const res = await fetch(`/api/youtube/playlist/${pl.id}/items`)
      const data = await res.json()
      setPlaylistItems(data.items || [])
    } catch (e) { console.error(e) }
    setPlaylistLoading(false)
  }

  const handlePlaylistVideoSelect = (item: PlaylistItem) => {
    setPlaylistVideoId(item.snippet.resourceId.videoId)
    setDescExpanded(false); setSaved(false); setLiked(false)
    setTimeout(() => setActivePlaylistVideo(item), 180)
    fetchVideoDetails(item.snippet.resourceId.videoId)
  }

  const handleClosePlaylistVideo = () => {
    setActivePlaylistVideo(null); setPlaylistVideoId(null); setVideoDetails(null)
  }

  const handleClosePlaylist = () => {
    setActivePlaylist(null); setPlaylistItems([])
    setActivePlaylistVideo(null); setPlaylistVideoId(null)
  }

  // ── Formatters ─────────────────────────────────────────────────────────────
  const parseDuration = (iso: string) => {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!m) return ''
    const h = parseInt(m[1]||'0'), min = parseInt(m[2]||'0'), s = parseInt(m[3]||'0')
    if (h > 0) return `${h}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    return `${min}:${String(s).padStart(2,'0')}`
  }
  const fmt = (n: number) => {
    if (n >= 1e9) return (n/1e9).toFixed(1)+'B'
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M'
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K'
    return n.toLocaleString()
  }
  const fmtDate = (d: string) => {
    const days = Math.floor((Date.now()-new Date(d).getTime())/864e5)
    if (days < 1) return 'Today'; if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days/7)}w ago`
    if (days < 365) return `${Math.floor(days/30)}mo ago`
    return `${Math.floor(days/365)}y ago`
  }
  const fmtLong = (d: string) =>
    new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})
  const thumb = (v: Video): string | undefined =>
    v.snippet.thumbnails.high?.url || v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url || undefined
  const plThumb = (item: PlaylistItem): string | undefined =>
    item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || undefined

  if (loading) return <GameLoadingScreen />

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
          <Link href="/subscriptions" style={{ display: 'inline-block', marginTop: 24, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', borderRadius: 30, padding: '10px 24px', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Go back</Link>
        </div>
      </div>
    )
  }

  const snippet    = channel.snippet
  const stats      = channel.statistics
  const bannerUrl  = channel.brandingSettings?.image?.bannerExternalUrl
  const avatarUrl  = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url
  const subCount   = parseInt(stats?.subscriberCount ?? '0')
  const videoCount = parseInt(stats?.videoCount ?? '0')
  const viewCount  = parseInt(stats?.viewCount ?? '0')

  // ── Shared video sheet content (reused for both channel videos + playlist videos) ──
  const VideoSheetBody = ({
    videoId, title, publishedAt, description, onClose,
    playlistContext,
  }: {
    videoId: string; title: string; publishedAt: string; description: string
    onClose: () => void; playlistContext?: { items: PlaylistItem[]; currentIndex: number }
  }) => (
    <div style={{ padding: '0 16px' }}>
      {/* Title + meta */}
      <div style={{ padding: '14px 0 12px' }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'white' }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {detailsLoading ? (
            <><div className="skeleton" style={{ width: 80, height: 12 }}/><div className="skeleton" style={{ width: 64, height: 12 }}/></>
          ) : videoDetails ? (
            <>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Eye size={12}/>{fmt(parseInt(videoDetails.viewCount))} views
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fmtLong(publishedAt)}</span>
              {videoDetails.duration && (<><span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>{videoDetails.duration}</span></>)}
            </>
          ) : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fmtDate(publishedAt)}</span>}
        </div>
      </div>

      <div className="divider"/>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 0' }}>
        <button className={`act-btn${liked?' lit':''}`} onClick={()=>setLiked(l=>!l)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThumbsUp size={17} fill={liked?'#a855f7':'none'}/>
            {videoDetails&&!detailsLoading&&<span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{fmt(parseInt(videoDetails.likeCount))}</span>}
          </div>Like
        </button>
        <button className="act-btn"><ThumbsDown size={17}/>Dislike</button>
        <button className={`act-btn${saved?' lit':''}`} onClick={()=>setSaved(s=>!s)}>
          <Bookmark size={17} fill={saved?'#a855f7':'none'} color={saved?'#a855f7':undefined}/>{saved?'Saved':'Save'}
        </button>
        <button className="act-btn"><Share2 size={17}/>Share</button>
        <button className="act-btn" onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)', flex: '0 0 44px' }}>
          <X size={17}/>Close
        </button>
      </div>

      <div className="divider"/>

      {/* Channel row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        {avatarUrl&&<img src={avatarUrl} alt={snippet.title} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(168,85,247,0.3)' }}/>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet.title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{fmt(subCount)} subscribers</p>
        </div>
        <button style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', border: 'none', borderRadius: 20, padding: '7px 16px', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", boxShadow: '0 0 14px rgba(168,85,247,0.4)', flexShrink: 0 }}>Subscribe</button>
      </div>

      <div className="divider"/>

      {/* Stats grid */}
      {(detailsLoading||videoDetails)&&(
        <div style={{ display: 'flex', gap: 8, padding: '12px 0' }}>
          {detailsLoading
            ?[1,2,3].map(i=><div key={i} className="skeleton" style={{ flex: 1, height: 64, borderRadius: 12 }}/>)
            :videoDetails&&[
              {icon:<Eye size={15} color="#06b6d4"/>,val:fmt(parseInt(videoDetails.viewCount)),label:'Views',color:'#06b6d4'},
              {icon:<ThumbsUp size={15} color="#10b981"/>,val:fmt(parseInt(videoDetails.likeCount)),label:'Likes',color:'#10b981'},
              {icon:<MessageSquare size={15} color="#f59e0b"/>,val:fmt(parseInt(videoDetails.commentCount)),label:'Comments',color:'#f59e0b'},
            ].map(s=>(
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {s.icon}
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono',monospace", color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>{s.label}</span>
              </div>
            ))
          }
        </div>
      )}

      <div className="divider"/>

      {/* Description */}
      {description&&(
        <div style={{ padding: '12px 0' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {descExpanded ? description : description.slice(0,160)+(description.length>160?'…':'')}
          </p>
          {description.length>160&&(
            <button onClick={()=>setDescExpanded(e=>!e)} style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '8px 0 0', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Syne',sans-serif" }}>
              {descExpanded?<><ChevronUp size={14}/>Show less</>:<><ChevronDown size={14}/>Show more</>}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {videoDetails&&videoDetails.tags.length>0&&(
        <><div className="divider"/>
        <div style={{ padding: '12px 0' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>Tags</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {videoDetails.tags.map(tag=><span key={tag} className="tag-pill">#{tag}</span>)}
          </div>
        </div></>
      )}

      {/* More from playlist */}
      {playlistContext && playlistContext.items.filter((_,i)=>i!==playlistContext.currentIndex).length>0 && (
        <><div className="divider"/>
        <div style={{ padding: '12px 0 40px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>More in playlist</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {playlistContext.items.filter((_,i)=>i!==playlistContext.currentIndex).slice(0,5).map(v=>(
              <div key={v.snippet.resourceId.videoId} onClick={()=>handlePlaylistVideoSelect(v)} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', flexShrink: 0, borderRadius: 8, overflow: 'hidden', width: 100, height: 56 }}>
                  <img src={plThumb(v)} alt={v.snippet.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(168,85,247,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={10} color="white" style={{ marginLeft: 1 }}/>
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: "'DM Mono',monospace", color: 'white' }}>
                    {String(v.snippet.position+1).padStart(2,'0')}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{v.snippet.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{fmtDate(v.snippet.publishedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div></>
      )}

      {/* More from channel (when not in playlist context) */}
      {!playlistContext && videos.filter(v=>v.id.videoId!==videoId).length>0&&(
        <><div className="divider"/>
        <div style={{ padding: '12px 0 40px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>More from {snippet.title}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {videos.filter(v=>v.id.videoId!==videoId).slice(0,4).map(v=>(
              <div key={v.id.videoId} onClick={()=>handleVideoSelect(v)} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', flexShrink: 0, borderRadius: 8, overflow: 'hidden', width: 100, height: 56 }}>
                  <img src={thumb(v)} alt={v.snippet.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(168,85,247,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={10} color="white" style={{ marginLeft: 1 }}/>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{v.snippet.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{fmtDate(v.snippet.publishedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div></>
      )}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse-tap { 0%{box-shadow:0 0 0 0 rgba(168,85,247,0.9)} 60%{box-shadow:0 0 0 8px rgba(168,85,247,0.25)} 100%{box-shadow:0 0 0 12px rgba(168,85,247,0)} }
        @keyframes breathe-glow { 0%,100%{box-shadow:0 0 0 2px rgba(168,85,247,0.55),0 0 14px rgba(168,85,247,0.35)} 50%{box-shadow:0 0 0 2px rgba(168,85,247,0.9),0 0 22px rgba(168,85,247,0.6)} }
        .thumb-tap{border-radius:10px;animation:pulse-tap 0.45s ease-out forwards}
        .thumb-active{border-radius:10px;animation:breathe-glow 2s ease-in-out infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
        @keyframes shimmer{from{background-position:-200% center}to{background-position:200% center}}
        .ch-root{background:#080b12;min-height:100vh;color:white;font-family:'Syne',sans-serif;max-width:390px;margin:0 auto;position:relative}
        .tab-bar{display:flex;border-bottom:1px solid rgba(255,255,255,0.07);padding:0 20px;overflow-x:auto;scrollbar-width:none;position:sticky;top:0;background:rgba(8,11,18,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:20}
        .tab-bar::-webkit-scrollbar{display:none}
        .tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,0.35);font-size:13px;font-weight:600;padding:12px 16px;cursor:pointer;white-space:nowrap;font-family:'Syne',sans-serif;transition:color 0.2s,border-color 0.2s;letter-spacing:0.02em}
        .tab-btn.active{color:#a855f7;border-bottom-color:#a855f7}
        .video-row{display:flex;gap:12px;padding:12px 20px;cursor:pointer;transition:background 0.15s;align-items:flex-start}
        .video-row:active{background:rgba(255,255,255,0.05)}
        .pl-row{display:flex;gap:12px;padding:12px 20px;cursor:pointer;transition:background 0.15s}
        .pl-row:active{background:rgba(255,255,255,0.05)}
        .pl-item-row{display:flex;gap:10px;padding:10px 16px;cursor:pointer;transition:background 0.15s;align-items:flex-start}
        .pl-item-row:active{background:rgba(255,255,255,0.05)}
        .pl-item-active{background:rgba(168,85,247,0.08);border-left:2px solid #a855f7}
        .sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:100;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:fadeIn 0.2s ease}
        .sheet{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:390px;background:#0d0f1a;border-radius:24px 24px 0 0;border-top:1px solid rgba(255,255,255,0.08);z-index:101;animation:slideUp 0.3s cubic-bezier(0.32,0.72,0,1);max-height:94vh;overflow-y:auto;scrollbar-width:none}
        .sheet::-webkit-scrollbar{display:none}
        .sheet-top{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:390px;background:#0d0f1a;border-radius:24px 24px 0 0;border-top:1px solid rgba(255,255,255,0.08);z-index:102;animation:slideUp 0.28s cubic-bezier(0.32,0.72,0,1);max-height:94vh;overflow-y:auto;scrollbar-width:none}
        .sheet-top::-webkit-scrollbar{display:none}
        .act-btn{display:flex;flex-direction:column;align-items:center;gap:5px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:rgba(255,255,255,0.7);cursor:pointer;font-size:11px;font-family:'Syne',sans-serif;font-weight:600;padding:10px 0;flex:1;transition:background 0.15s,color 0.15s,transform 0.15s;letter-spacing:0.02em}
        .act-btn:active{transform:scale(0.94);background:rgba(168,85,247,0.15)}
        .act-btn.lit{color:#a855f7;background:rgba(168,85,247,0.12);border-color:rgba(168,85,247,0.3)}
        .sub-btn{flex:1;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:30px;padding:11px;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;box-shadow:0 0 22px rgba(168,85,247,0.4);transition:transform 0.15s,box-shadow 0.15s}
        .sub-btn:active{transform:scale(0.97);box-shadow:0 0 14px rgba(168,85,247,0.3)}
        .icon-circle{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background 0.15s}
        .icon-circle:active{background:rgba(255,255,255,0.14)}
        .stat-pill{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:5px 12px}
        .drag-pill{width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:12px auto 0}
        .card-glass{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:18px}
        .divider{height:1px;background:rgba(255,255,255,0.06)}
        .skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.4s ease infinite;border-radius:6px}
        .tag-pill{background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:20px;padding:3px 10px;font-size:11px;color:rgba(168,85,247,0.8);font-weight:600;white-space:nowrap}
      `}</style>

      {/* ════ Playlist video player (z-102, on top of playlist sheet) ════ */}
      {activePlaylistVideo && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 101, backdropFilter: 'blur(4px)' }} onClick={handleClosePlaylistVideo}/>
          <div className="sheet-top">
            <div className="drag-pill"/>
            {/* Back to playlist */}
            <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={handleClosePlaylistVideo} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={12}/> Back to playlist
              </button>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono',monospace" }}>
                {activePlaylist?.snippet.title}
              </span>
            </div>
            {/* Embed */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', marginTop: 12 }}>
              <iframe
                src={`https://www.youtube.com/embed/${activePlaylistVideo.snippet.resourceId.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            <VideoSheetBody
              videoId={activePlaylistVideo.snippet.resourceId.videoId}
              title={activePlaylistVideo.snippet.title}
              publishedAt={activePlaylistVideo.snippet.publishedAt}
              description={activePlaylistVideo.snippet.description}
              onClose={handleClosePlaylistVideo}
              playlistContext={{ items: playlistItems, currentIndex: activePlaylistVideo.snippet.position }}
            />
          </div>
        </>
      )}

      {/* ════ Playlist sheet (z-101) ════ */}
      {activePlaylist && !activePlaylistVideo && (
        <>
          <div className="sheet-overlay" onClick={handleClosePlaylist}/>
          <div className="sheet">
            <div className="drag-pill"/>

            {/* Header */}
            <div style={{ padding: '16px 16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 80, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
                  {(activePlaylist.snippet.thumbnails.high?.url || activePlaylist.snippet.thumbnails.medium?.url)
                    ? <img src={activePlaylist.snippet.thumbnails.high?.url||activePlaylist.snippet.thumbnails.medium?.url} alt={activePlaylist.snippet.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ListVideo size={20} color="rgba(255,255,255,0.3)"/></div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: 'white' }}>{activePlaylist.snippet.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <List size={11}/>{activePlaylist.contentDetails?.itemCount ?? playlistItems.length} videos
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(168,85,247,0.6)', fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{snippet.title}</span>
                  </div>
                </div>
                <button onClick={handleClosePlaylist} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={15} color="rgba(255,255,255,0.5)"/>
                </button>
              </div>

              {/* Play all */}
              {playlistItems.length > 0 && (
                <button
                  onClick={()=>handlePlaylistVideoSelect(playlistItems[0])}
                  style={{ width: '100%', marginTop: 14, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', border: 'none', borderRadius: 14, padding: '12px', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: 'pointer', boxShadow: '0 0 22px rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Play size={15} fill="white"/> Play All
                </button>
              )}
            </div>

            <div className="divider"/>

            {/* Items */}
            {playlistLoading ? (
              <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i=>(
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 100, height: 56, borderRadius: 8, flexShrink: 0 }}/>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 13, width: '85%' }}/>
                      <div className="skeleton" style={{ height: 11, width: '50%' }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : playlistItems.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '40px 20px' }}>No videos in this playlist.</p>
            ) : (
              <div style={{ paddingBottom: 40 }}>
                {playlistItems.map((item, index) => {
                  const vid = item.snippet.resourceId.videoId
                  const isActive = playlistVideoId === vid
                  return (
                    <div key={vid} className={`pl-item-row${isActive?' pl-item-active':''}`} onClick={()=>handlePlaylistVideoSelect(item)}>
                      <span style={{ width: 22, textAlign: 'center', fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.25)', paddingTop: 4, flexShrink: 0 }}>
                        {String(index+1).padStart(2,'0')}
                      </span>
                      <div style={{ position: 'relative', flexShrink: 0, borderRadius: 8, overflow: 'hidden', width: 100, height: 56 }}>
                        <img src={plThumb(item)} alt={item.snippet.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: 'rgba(255,255,255,0.05)' }}/>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive?'rgba(168,85,247,0.2)':'rgba(0,0,0,0.15)', transition: 'background 0.2s' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive?'rgba(168,85,247,0.95)':'rgba(168,85,247,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isActive?'0 0 18px rgba(168,85,247,0.9)':'0 0 12px rgba(168,85,247,0.5)' }}>
                            <Play size={12} color="white" style={{ marginLeft: 1 }}/>
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isActive?'white':'rgba(255,255,255,0.85)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                          {item.snippet.title}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 10, color: isActive?'rgba(168,85,247,0.7)':'rgba(255,255,255,0.3)' }}>
                          {item.snippet.videoOwnerChannelTitle||snippet.title} · {fmtDate(item.snippet.publishedAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════ Channel video sheet ════ */}
      {activeVideo && (
        <>
          <div className="sheet-overlay" onClick={handleCloseSheet}/>
          <div className="sheet">
            <div className="drag-pill"/>
            <div style={{ position: 'relative', paddingBottom: '56.25%', marginTop: 12 }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            <VideoSheetBody
              videoId={activeVideo.id.videoId}
              title={activeVideo.snippet.title}
              publishedAt={activeVideo.snippet.publishedAt}
              description={activeVideo.snippet.description}
              onClose={handleCloseSheet}
            />
          </div>
        </>
      )}

      {/* ════ Main page ════ */}
      <div style={{ background: '#080b12', minHeight: '100vh', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.10, filter: 'blur(80px)' }}/>
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', top: 320, right: -40, opacity: 0.08, filter: 'blur(80px)' }}/>
        </div>

        <div className="ch-root" style={{ zIndex: 1, position: 'relative', paddingBottom: 100 }}>

          <div style={{ position: 'absolute', top: 52, left: 20, zIndex: 30 }}>
            <Link href="/subscriptions" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(8,11,18,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <ArrowLeft size={14}/> Back
            </Link>
          </div>

          {/* Banner */}
          <div style={{ height: 148, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#0c1929)' }}>
            {bannerUrl
              ? <img src={bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              : <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 60%,rgba(168,85,247,0.4) 0%,transparent 55%), radial-gradient(ellipse at 80% 25%,rgba(6,182,212,0.3) 0%,transparent 50%)' }}/>
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 30%,rgba(8,11,18,0.88) 100%)' }}/>
          </div>

          {/* Channel identity */}
          <div style={{ padding: '0 20px', marginTop: -42, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', border: '3px solid #080b12', outline: '2px solid rgba(168,85,247,0.4)', overflow: 'hidden', background: '#080b12', flexShrink: 0, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={snippet.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'white' }}>{snippet.title.charAt(0)}</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet.title}</h1>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {snippet.customUrl?`@${snippet.customUrl.replace('@','')} · `:''}{fmt(subCount)} subscribers
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                {icon:<Users size={12} color="#a855f7"/>,val:fmt(subCount),label:'subs'},
                {icon:<Play size={12} color="#06b6d4"/>,val:videoCount.toLocaleString(),label:'videos'},
                {icon:<Eye size={12} color="#f59e0b"/>,val:fmt(viewCount),label:'views'},
              ].map(s=>(
                <div key={s.label} className="stat-pill">
                  {s.icon}
                  <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <button className="sub-btn">Subscribe</button>
              <button className="icon-circle"><Bell size={17} color="white"/></button>
              <button className="icon-circle"><Share2 size={16} color="white"/></button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="tab-bar">
            {(['videos','playlists','about'] as Tab[]).map(tab=>(
              <button key={tab} className={`tab-btn${activeTab===tab?' active':''}`} onClick={()=>setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>

          {/* VIDEOS */}
          {activeTab==='videos'&&(
            <div style={{ paddingTop: 8 }}>
              {videos.length===0
                ?<p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '48px 20px' }}>No videos yet.</p>
                :videos.map(video=>{
                  const isSelected=selectedVideoId===video.id.videoId
                  return(
                    <div key={video.id.videoId} className="video-row" onClick={()=>handleVideoSelect(video)}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={thumb(video)} alt={video.snippet.title} style={{ width: 120, height: 67, objectFit: 'cover', display: 'block', background: 'rgba(255,255,255,0.05)' }}
                          className={isSelected&&activeVideo?'thumb-active':isSelected?'thumb-tap':''}/>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: isSelected?'rgba(168,85,247,0.12)':'rgba(0,0,0,0.15)', transition: 'background 0.2s' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(168,85,247,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isSelected?'0 0 22px rgba(168,85,247,0.9)':'0 0 16px rgba(168,85,247,0.6)', transition: 'box-shadow 0.2s' }}>
                            <Play size={14} color="white" style={{ marginLeft: 2 }}/>
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isSelected?'white':'rgba(255,255,255,0.9)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, transition: 'color 0.2s' }}>
                          {video.snippet.title}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: isSelected?'rgba(168,85,247,0.7)':'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
                          {snippet.title} · {fmtDate(video.snippet.publishedAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          )}

          {/* PLAYLISTS */}
          {activeTab==='playlists'&&(
            <div style={{ paddingTop: 8 }}>
              {playlists.length===0
                ?<p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '48px 20px' }}>No playlists found.</p>
                :playlists.map(pl=>(
                  <div key={pl.id} className="pl-row" onClick={()=>handlePlaylistSelect(pl)}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={pl.snippet.thumbnails.high?.url||pl.snippet.thumbnails.medium?.url||undefined} alt={pl.snippet.title} style={{ width: 120, height: 67, borderRadius: 10, objectFit: 'cover', display: 'block', background: 'rgba(255,255,255,0.05)' }}/>
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 34, borderRadius: '0 10px 10px 0', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <ListVideo size={12} color="white"/>
                        <span style={{ fontSize: 9, color: 'white', fontFamily: "'DM Mono',monospace" }}>{pl.contentDetails?.itemCount??'?'}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{pl.snippet.title}</p>
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(168,85,247,0.6)', fontWeight: 600 }}>{pl.contentDetails?.itemCount??'?'} videos</p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ABOUT */}
          {activeTab==='about'&&(
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {snippet.description&&(
                <div className="card-glass" style={{ padding: 18 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>About</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{snippet.description}</p>
                </div>
              )}
              <div className="card-glass" style={{ padding: 18 }}>
                <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Stats</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    {label:'Subscribers',val:subCount.toLocaleString(),color:'#a855f7'},
                    {label:'Videos',val:videoCount.toLocaleString(),color:'#06b6d4'},
                    {label:'Total views',val:viewCount.toLocaleString(),color:'#f59e0b'},
                    {label:'Joined',val:new Date(snippet.publishedAt).toLocaleDateString('en-US',{year:'numeric',month:'short'}),color:'#10b981'},
                  ].map(s=>(
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
        <BottomNavClient/>
      </div>
    </>
  )
}