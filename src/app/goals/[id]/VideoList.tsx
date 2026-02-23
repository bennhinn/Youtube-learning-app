'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Clock, Eye, Play, ChevronRight,
  BookOpen, Flame, Trophy, HelpCircle, Lightbulb,
  Save, X, SkipForward
} from 'lucide-react'

interface VideoItem {
  position: number
  status: string
  video: {
    youtube_video_id: string
    title: string
    description: string
    thumbnail_url: string
    channel_title: string
    duration: number
    view_count: number
    like_count: number
  }
}

interface VideoListProps {
  goalId: string
  initialItems: VideoItem[]
}

type Comprehension = 'confused' | 'got_it' | 'can_teach'

const COMPREHENSION_OPTIONS: { value: Comprehension; label: string; emoji: string; color: string }[] = [
  { value: 'confused',   label: 'Confused',      emoji: '😕', color: '#ef4444' },
  { value: 'got_it',     label: 'Got it',         emoji: '👍', color: '#f59e0b' },
  { value: 'can_teach',  label: 'Could teach it', emoji: '🔥', color: '#10b981' },
]

export default function VideoList({ goalId, initialItems }: VideoListProps) {
  const [items, setItems]               = useState(initialItems)
  const [loading, setLoading]           = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem['video'] | null>(
    items.length > 0 ? items[0].video : null
  )

  // Notes
  const [note, setNote]             = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)
  const notesCache                  = useRef<Record<string, string>>({})
  const noteDebounce                = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Comprehension
  const [comprehension, setComprehension]   = useState<Comprehension | null>(null)
  const comprehensionCache                  = useRef<Record<string, Comprehension>>({})

  // Auto-advance
  const [showUpNext, setShowUpNext]         = useState(false)
  const [upNextVideo, setUpNextVideo]       = useState<VideoItem['video'] | null>(null)
  const [countdown, setCountdown]           = useState(5)
  const countdownRef                        = useRef<ReturnType<typeof setInterval> | null>(null)

  // Session recap
  const [sessionWatched, setSessionWatched] = useState<string[]>([])
  const [showRecap, setShowRecap]           = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', s > 0 ? `${s}s` : ''].filter(Boolean).join(' ')
  }

  // Estimated time remaining (unwatched videos)
  const remainingSeconds = items
    .filter(i => i.status !== 'watched')
    .reduce((acc, i) => acc + (i.video.duration || 0), 0)

  const watchedCount   = items.filter(i => i.status === 'watched').length
  const totalVideos    = items.length
  const progressPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0

  const currentItem = items.find(i => i.video.youtube_video_id === selectedVideo?.youtube_video_id)
  const isWatched   = currentItem?.status === 'watched'

  const getNextVideo = useCallback((afterId: string) => {
    const idx = items.findIndex(i => i.video.youtube_video_id === afterId)
    return idx >= 0 && idx < items.length - 1 ? items[idx + 1].video : null
  }, [items])

  // ── Load note + comprehension when video changes ──────────────────────────
  useEffect(() => {
    if (!selectedVideo) return
    const vid = selectedVideo.youtube_video_id

    // Note
    if (notesCache.current[vid] !== undefined) {
      setNote(notesCache.current[vid])
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from('notes')
          .select('content')
          .eq('user_id', user.id)
          .eq('video_id', vid)
          .eq('goal_id', goalId)
          .maybeSingle()
          .then(({ data }) => {
            const content = data?.content || ''
            notesCache.current[vid] = content
            setNote(content)
          })
      })
    }

    // Comprehension
    if (comprehensionCache.current[vid] !== undefined) {
      setComprehension(comprehensionCache.current[vid] || null)
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from('progress')
          .select('comprehension')
          .eq('user_id', user.id)
          .eq('video_id', vid)
          .order('watched_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => {
            const rating = (data?.comprehension as Comprehension) || null
            comprehensionCache.current[vid] = rating as any
            setComprehension(rating)
          })
      })
    }

    setNoteSaved(false)
  }, [selectedVideo?.youtube_video_id])

  // ── Auto-save note (debounced 1.5s) ───────────────────────────────────────
  const handleNoteChange = (val: string) => {
    setNote(val)
    setNoteSaved(false)
    if (noteDebounce.current) clearTimeout(noteDebounce.current)
    noteDebounce.current = setTimeout(() => saveNote(val), 1500)
  }

  const saveNote = async (content: string) => {
    if (!selectedVideo) return
    setNoteSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notes').upsert({
      user_id: user.id,
      video_id: selectedVideo.youtube_video_id,
      goal_id: goalId,
      content,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id,goal_id' })
    notesCache.current[selectedVideo.youtube_video_id] = content
    setNoteSaving(false)
    setNoteSaved(true)
  }

  // ── Save comprehension rating ─────────────────────────────────────────────
  const saveComprehension = async (rating: Comprehension) => {
    if (!selectedVideo) return
    setComprehension(rating)
    comprehensionCache.current[selectedVideo.youtube_video_id] = rating
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('progress')
      .update({ comprehension: rating })
      .eq('user_id', user.id)
      .eq('video_id', selectedVideo.youtube_video_id)
  }

  // ── Mark as watched (original logic untouched) ────────────────────────────
  const markAsWatched = async (videoId: string, position: number) => {
    setLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('learning_paths')
        .update({ status: 'watched' })
        .eq('goal_id', goalId)
        .eq('video_id', videoId)

      if (updateError) throw updateError

      const { error: progressError } = await supabase
        .from('progress')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          video_id: videoId,
          watched_at: new Date().toISOString(),
        })

      if (progressError) console.warn('Progress insert warning:', progressError)

      setItems(prev =>
        prev.map(item =>
          item.video.youtube_video_id === videoId
            ? { ...item, status: 'watched' }
            : item
        )
      )

      // Track session
      const newSession = [...sessionWatched, videoId]
      setSessionWatched(newSession)

      // Show session recap if 3+ watched this session
      if (newSession.length >= 3 && newSession.length % 3 === 0) {
        setShowRecap(true)
      }

      // Auto-advance: find next video
      const next = getNextVideo(videoId)
      if (next) {
        setUpNextVideo(next)
        setCountdown(5)
        setShowUpNext(true)
        countdownRef.current = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) {
              clearInterval(countdownRef.current!)
              setShowUpNext(false)
              setSelectedVideo(next)
              return 5
            }
            return c - 1
          })
        }, 1000)
      }

      router.refresh()
    } catch (error) {
      console.error('Error marking as watched:', error)
      alert('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const cancelAutoAdvance = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowUpNext(false)
  }

  const goToNext = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowUpNext(false)
    if (upNextVideo) setSelectedVideo(upNextVideo)
  }

  // ── Session recap data ────────────────────────────────────────────────────
  const sessionItems = items.filter(i => sessionWatched.includes(i.video.youtube_video_id))
  const sessionDuration = sessionItems.reduce((acc, i) => acc + (i.video.duration || 0), 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        .vl-layout { display: flex; gap: 16px; align-items: flex-start; }
        .vl-player  { flex: 1 1 0; min-width: 0; }
        .vl-sidebar {
          width: 280px; flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; overflow: hidden;
          max-height: 600px; display: flex; flex-direction: column;
        }
        @media (max-width: 640px) {
          .vl-layout   { flex-direction: column; gap: 12px; }
          .vl-sidebar  { width: 100%; max-height: none; }
          .vl-player-card { border-radius: 16px !important; }
        }

        .playlist-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; cursor: pointer;
          transition: background 0.15s;
          border-left: 2px solid transparent;
        }
        .playlist-item:active { background: rgba(255,255,255,0.04); }

        .comprehension-btn {
          flex: 1; border: 1px solid; border-radius: 12px;
          padding: 10px 8px; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 600;
          transition: all 0.15s;
        }
        .comprehension-btn:hover { transform: translateY(-1px); }

        .note-area {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 12px;
          color: white; font-size: 13px; line-height: 1.6;
          font-family: 'Syne', sans-serif; resize: vertical;
          min-height: 90px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .note-area::placeholder { color: rgba(255,255,255,0.2); }
        .note-area:focus {
          border-color: rgba(168,85,247,0.4);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.08);
        }

        /* Modal backdrop */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: #0f1220; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 28px 24px;
          width: 100%; max-width: 360px;
          box-shadow: 0 0 60px rgba(168,85,247,0.2);
        }

        /* Up Next bar */
        .upnext-bar {
          position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
          z-index: 80; background: rgba(15,18,32,0.95);
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: 16px; padding: 14px 18px;
          display: flex; align-items: center; gap: 14px;
          box-shadow: 0 0 30px rgba(168,85,247,0.25);
          max-width: 420px; width: calc(100% - 40px);
          backdrop-filter: blur(16px);
        }
      `}</style>

      <div className="vl-layout">

        {/* ── Player area ── */}
        <div className="vl-player">
          {selectedVideo ? (
            <div className="vl-player-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>

              {/* iframe */}
              <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.youtube_video_id}`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              </div>

              {/* Video info */}
              <div style={{ padding: '16px 16px 0' }}>
                <h2 style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1.35, fontFamily: "'Syne', sans-serif" }}>
                  {selectedVideo.title}
                </h2>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Syne', sans-serif" }}>
                  {selectedVideo.channel_title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {selectedVideo.duration > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                        <Clock size={11} />{formatDuration(selectedVideo.duration)}
                      </span>
                    )}
                    {selectedVideo.view_count > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                        <Eye size={11} />{selectedVideo.view_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (currentItem && !isWatched) markAsWatched(selectedVideo.youtube_video_id, currentItem.position)
                    }}
                    disabled={loading || isWatched}
                    style={{
                      background: isWatched ? 'rgba(16,185,129,0.12)' : 'linear-gradient(135deg, #10b981, #059669)',
                      border: isWatched ? '1px solid rgba(16,185,129,0.3)' : 'none',
                      borderRadius: 12, padding: '10px 18px', color: isWatched ? '#10b981' : 'white',
                      fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                      cursor: isWatched ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: isWatched ? 'none' : '0 0 18px rgba(16,185,129,0.35)',
                      opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                    }}
                  >
                    <CheckCircle size={14} />
                    {isWatched ? 'Watched' : loading ? 'Saving…' : 'Mark as Watched'}
                  </button>
                </div>
              </div>

              {/* ── Comprehension rating ── */}
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'Syne', sans-serif" }}>
                  How well did you understand this?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COMPREHENSION_OPTIONS.map(opt => {
                    const isActive = comprehension === opt.value
                    return (
                      <button
                        key={opt.value}
                        className="comprehension-btn"
                        onClick={() => saveComprehension(opt.value)}
                        style={{
                          background: isActive ? `${opt.color}18` : 'rgba(255,255,255,0.03)',
                          borderColor: isActive ? `${opt.color}60` : 'rgba(255,255,255,0.08)',
                          color: isActive ? opt.color : 'rgba(255,255,255,0.4)',
                          boxShadow: isActive ? `0 0 12px ${opt.color}30` : 'none',
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Notes ── */}
              <div style={{ padding: '0 16px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'Syne', sans-serif" }}>
                    Your Notes
                  </p>
                  <span style={{ fontSize: 10, color: noteSaving ? '#f59e0b' : noteSaved ? '#10b981' : 'transparent', fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 4 }}>
                    {noteSaving ? <><Save size={10} /> Saving…</> : noteSaved ? <><CheckCircle size={10} /> Saved</> : ''}
                  </span>
                </div>
                <textarea
                  className="note-area"
                  placeholder="Jot down key takeaways, questions, or ideas…"
                  value={note}
                  onChange={e => handleNoteChange(e.target.value)}
                  onBlur={() => {
                    if (noteDebounce.current) clearTimeout(noteDebounce.current)
                    saveNote(note)
                  }}
                />
              </div>

            </div>
          ) : (
            <div style={{ height: 200, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Play size={30} color="rgba(168,85,247,0.35)" />
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: "'Syne', sans-serif" }}>No videos in this path</p>
            </div>
          )}
        </div>

        {/* ── Playlist sidebar ── */}
        <div className="vl-sidebar">
          {/* Header with progress + ETA */}
          <div style={{ padding: '13px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Syne', sans-serif" }}>Playlist</h3>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
                {watchedCount}/{totalVideos}
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #a855f7, #06b6d4)', transition: 'width 0.4s ease', boxShadow: '0 0 6px #a855f7' }} />
            </div>
            {/* ETA */}
            {remainingSeconds > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={11} color="#06b6d4" />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono', monospace" }}>
                  ~{formatDuration(remainingSeconds)} remaining
                </span>
              </div>
            )}
            {remainingSeconds === 0 && totalVideos > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Trophy size={11} color="#f59e0b" />
                <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                  Goal complete! 🎉
                </span>
              </div>
            )}
          </div>

          {/* Scrollable list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.map((item, index) => {
              const isSelected    = selectedVideo?.youtube_video_id === item.video.youtube_video_id
              const isItemWatched = item.status === 'watched'
              const rating        = comprehensionCache.current[item.video.youtube_video_id]
              return (
                <div
                  key={item.video.youtube_video_id}
                  className="playlist-item"
                  onClick={() => setSelectedVideo(item.video)}
                  style={{
                    background: isSelected ? 'rgba(168,85,247,0.1)' : 'transparent',
                    borderLeftColor: isSelected ? '#a855f7' : 'transparent',
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 500,
                    background: isItemWatched ? 'rgba(16,185,129,0.15)' : isSelected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isItemWatched ? 'rgba(16,185,129,0.4)' : isSelected ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    color: isItemWatched ? '#10b981' : isSelected ? '#a855f7' : 'rgba(255,255,255,0.4)',
                  }}>
                    {isItemWatched ? '✓' : index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'white' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.35, fontFamily: "'Syne', sans-serif" }}>
                      {item.video.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif", flex: 1 }}>
                        {item.video.channel_title}
                      </p>
                      {/* Comprehension dot */}
                      {isItemWatched && rating && (
                        <span style={{ fontSize: 11, flexShrink: 0 }}>
                          {COMPREHENSION_OPTIONS.find(o => o.value === rating)?.emoji}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Auto-advance "Up Next" bar ── */}
      {showUpNext && upNextVideo && (
        <div className="upnext-bar">
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
            {countdown}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Syne', sans-serif" }}>Up next</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif" }}>
              {upNextVideo.title}
            </p>
          </div>
          <button onClick={goToNext} style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 10, padding: '7px 12px', color: '#a855f7', fontSize: 12, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <SkipForward size={13} /> Play
          </button>
          <button onClick={cancelAutoAdvance} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Session Recap Modal ── */}
      {showRecap && (
        <div className="modal-backdrop" onClick={() => setShowRecap(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            {/* Trophy */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: "'Syne', sans-serif" }}>
                Session Complete!
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: "'Syne', sans-serif" }}>
                You've watched {sessionWatched.length} videos this session
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Videos',   value: sessionWatched.length, color: '#a855f7', icon: '▶' },
                { label: 'Time',     value: formatDuration(sessionDuration) || '—', color: '#06b6d4', icon: '⏱' },
                { label: 'Progress', value: `${progressPercent}%`, color: '#10b981', icon: '📈' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: "'Syne', sans-serif" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Watched list */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              {sessionItems.map((item, i) => (
                <div key={item.video.youtube_video_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < sessionItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <CheckCircle size={14} color="#10b981" />
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif" }}>
                    {item.video.title}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRecap(false)}
              style={{ width: '100%', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', border: 'none', borderRadius: 14, padding: '13px', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: 'pointer', boxShadow: '0 0 24px rgba(168,85,247,0.4)' }}
            >
              Keep Learning 🚀
            </button>
          </div>
        </div>
      )}
    </>
  )
}