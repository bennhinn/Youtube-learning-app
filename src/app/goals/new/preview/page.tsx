'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, ChevronUp, ChevronDown, Trash2, Play, Eye, Clock, BookOpen, Tag, Calendar, Sparkles } from 'lucide-react'

interface Video {
  youtube_video_id: string
  title: string
  description: string
  thumbnail_url: string
  channel_id: string
  channel_title: string
  duration: number
  view_count: number
  like_count: number
}

// ── Saving steps ───────────────────────────────────────────────────────────
const SAVE_STEPS = [
  { label: 'Creating your goal…',        xp: 20 },
  { label: 'Saving video library…',      xp: 45 },
  { label: 'Building learning path…',    xp: 72 },
  { label: 'Finalising progress data…',  xp: 90 },
  { label: 'All done!',                  xp: 100 },
]

function SavingScreen({ step }: { step: number }) {
  const [dots,   setDots]   = useState('.')
  const [glitch, setGlitch] = useState(false)
  const current = SAVE_STEPS[Math.min(step, SAVE_STEPS.length - 1)]

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const burst = () => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 120)
      setTimeout(burst, 2400 + Math.random() * 1600)
    }
    const id = setTimeout(burst, 1000)
    return () => clearTimeout(id)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes scanline   { from { transform: translateY(-100%); } to { transform: translateY(100vh); } }
        @keyframes flicker    { 0%,100%{opacity:1} 45%{opacity:0.85} 50%{opacity:0.6} 55%{opacity:0.9} }
        @keyframes glitch-h   {
          0%  { clip-path:inset(40% 0 55% 0); transform:translate(-4px,0); }
          25% { clip-path:inset(10% 0 80% 0); transform:translate(4px,0); }
          50% { clip-path:inset(70% 0 10% 0); transform:translate(-2px,0); }
          75% { clip-path:inset(20% 0 60% 0); transform:translate(3px,0); }
          100%{ clip-path:inset(0 0 0 0);     transform:translate(0,0); }
        }
        @keyframes orbit  { from{transform:rotate(0deg) translateX(54px) rotate(0deg)} to{transform:rotate(360deg) translateX(54px) rotate(-360deg)} }
        @keyframes orbit2 { from{transform:rotate(120deg) translateX(54px) rotate(-120deg)} to{transform:rotate(480deg) translateX(54px) rotate(-480deg)} }
        @keyframes orbit3 { from{transform:rotate(240deg) translateX(54px) rotate(-240deg)} to{transform:rotate(600deg) translateX(54px) rotate(-600deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(168,85,247,0.7)} 100%{box-shadow:0 0 0 20px rgba(168,85,247,0)} }
        .gl-text { position:relative; animation:flicker 4s linear infinite; }
        .gl-text::after { content:attr(data-text); position:absolute; left:0; top:0; color:#06b6d4; animation:glitch-h 0.12s steps(1) forwards; }
        .xp-fill { transition: width 0.7s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      <div style={{ background: '#080b12', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", color: 'white', overflow: 'hidden', position: 'relative' }}>

        {/* Scanline */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)', zIndex: 1 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(168,85,247,0.4),transparent)', animation: 'scanline 3s linear infinite', zIndex: 2 }} />

        {/* Orbs */}
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -100, left: -80, opacity: 0.10, filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', bottom: -60, right: -60, opacity: 0.08, filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '0 32px', width: '100%', maxWidth: 360 }}>

          {/* Orbital spinner */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(168,85,247,0.15)' }} />
            <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px dashed rgba(168,85,247,0.25)', animation: 'spin 8s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#a855f7', borderRightColor: 'rgba(168,85,247,0.3)', animation: 'spin 1.1s cubic-bezier(0.4,0,0.2,1) infinite', boxShadow: '0 0 16px rgba(168,85,247,0.5)' }} />
            <div style={{ position: 'absolute', inset: 0, animation: 'orbit 2.2s linear infinite' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7', margin: '0 auto' }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, animation: 'orbit2 2.2s linear infinite' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 6px #06b6d4', margin: '0 auto' }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, animation: 'orbit3 2.2s linear infinite' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b', margin: '0 auto' }} />
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, boxShadow: '0 0 28px rgba(168,85,247,0.6)', animation: 'pulse-ring 1.4s ease-out infinite' }}>L</div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <h2 className={glitch ? 'gl-text' : ''} data-text="Building your path" style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg,#fff 0%,#a855f7 60%,#06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Building your path
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace" }}>
              Almost ready
            </p>
          </div>

          {/* XP bar */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }} key={step}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", animation: 'fadeUp 0.3s ease' }}>
                {current.label}{step < SAVE_STEPS.length - 1 ? dots : ''}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7', fontFamily: "'DM Mono',monospace" }}>{current.xp} XP</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
              <div className="xp-fill" style={{ height: '100%', width: `${current.xp}%`, background: 'linear-gradient(90deg,#a855f7,#06b6d4)', borderRadius: 6, boxShadow: '0 0 10px #a855f7' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {SAVE_STEPS.map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= step ? '#a855f7' : 'rgba(255,255,255,0.1)', boxShadow: i <= step ? '0 0 6px #a855f7' : 'none', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          {/* Step log */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SAVE_STEPS.slice(0, step + 1).slice(-3).map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: i === arr.length - 1 ? 1 : 0.35, animation: 'fadeUp 0.25s ease' }}>
                <span style={{ fontSize: 10, color: '#10b981', fontFamily: "'DM Mono',monospace" }}>{i === arr.length - 1 ? '▶' : '✓'}</span>
                <span style={{ fontSize: 12, color: i === arr.length - 1 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>{s.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [videos,     setVideos]     = useState<Video[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saveStep,   setSaveStep]   = useState(-1)   // -1 = not saving
  const [goalName,   setGoalName]   = useState('')
  const [keywords,   setKeywords]   = useState('')
  const [targetDate, setTargetDate] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('previewVideos')
    if (stored) {
      setVideos(JSON.parse(stored))
      setGoalName(localStorage.getItem('goalName')       || '')
      setKeywords(localStorage.getItem('goalKeywords')   || '')
      setTargetDate(localStorage.getItem('goalTargetDate') || '')
      setLoading(false)
    } else {
      router.push('/goals/new')
    }
  }, [router])

  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const v = [...videos]
    if (direction === 'up'   && index > 0)              [v[index - 1], v[index]] = [v[index], v[index - 1]]
    if (direction === 'down' && index < v.length - 1)   [v[index + 1], v[index]] = [v[index], v[index + 1]]
    setVideos(v)
  }

  const removeVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index))

  // ── Optimised save — batched parallel writes ───────────────────────────
  const saveGoal = async () => {
    setSaveStep(0)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      // Ensure profile exists
      const { error: profileCheckError } = await supabase
        .from('profiles').select('id').eq('id', user.id).single()
      if (profileCheckError?.code === 'PGRST116') {
        await supabase.from('profiles').insert({ id: user.id })
      }

      if (!videos.length) throw new Error('No videos in the learning path')

      // ── Step 1: Create goal ──
      setSaveStep(0)
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: goalName.trim(),
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          target_date: targetDate || null,
          status: 'active',
          progress_percent: 0,
        })
        .select('id')
        .single()
      if (goalError) throw new Error(`Failed to create goal: ${goalError.message}`)

      // ── Step 2: Batch upsert all channels + videos in parallel ──
      setSaveStep(1)
      const uniqueChannels = [...new Map(videos.map(v => [v.channel_id, v])).values()]

      await Promise.all([
        // All channels at once
        supabase.from('channels').upsert(
          uniqueChannels.map(v => ({
            youtube_channel_id: v.channel_id,
            title: v.channel_title || 'Unknown Channel',
            last_fetched: new Date().toISOString(),
          })),
          { onConflict: 'youtube_channel_id' }
        ),
        // All videos at once
        supabase.from('videos').upsert(
          videos.map(v => ({
            youtube_video_id: v.youtube_video_id,
            title: v.title,
            description: v.description || '',
            thumbnail_url: v.thumbnail_url || '',
            channel_id: v.channel_id,
            channel_title: v.channel_title || '',
            duration: v.duration || 0,
            view_count: v.view_count || 0,
            like_count: v.like_count || 0,
            last_fetched: new Date().toISOString(),
          })),
          { onConflict: 'youtube_video_id' }
        ),
      ])

      // ── Step 3: Batch insert learning path entries ──
      setSaveStep(2)
      const seen = new Set<string>()
      const pathRows = videos
        .filter(v => { if (seen.has(v.youtube_video_id)) return false; seen.add(v.youtube_video_id); return true })
        .map((v, i) => ({ goal_id: goal.id, video_id: v.youtube_video_id, position: i, status: 'not_started' }))

      const { error: pathError } = await supabase.from('learning_paths').insert(pathRows)
      if (pathError && pathError.code !== '23505') throw new Error(`Failed to build learning path: ${pathError.message}`)

      // ── Step 4: Log activity ──
      setSaveStep(3)
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'create_goal',
        entity_type: 'goal',
        entity_id: goal.id,
        metadata: { name: goalName, video_count: videos.length },
      }).then(() => {}) // fire and forget — don't block on this

      // ── Step 5: Done ──
      setSaveStep(4)

      localStorage.removeItem('previewVideos')
      localStorage.removeItem('goalName')
      localStorage.removeItem('goalKeywords')
      localStorage.removeItem('goalTargetDate')

      // Brief pause on "All done!" so user sees it
      await new Promise(r => setTimeout(r, 700))
      router.push('/dashboard')

    } catch (error: any) {
      setSaveStep(-1)
      alert(`Failed to save goal: ${error?.message || 'Unknown error'}`)
    }
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', s > 0 ? `${s}s` : ''].filter(Boolean).join(' ')
  }

  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0)

  // ── Show saving screen ─────────────────────────────────────────────────
  if (saveStep >= 0) return <SavingScreen step={saveStep} />

  // ── Show loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: '#080b12', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", color: 'white' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(168,85,247,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading preview…</p>
      </div>
    </div>
  )

  // ── Main UI ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .video-card { transition: transform 0.15s ease; }
        .video-card:active { transform: scale(0.99); }
        .icon-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(255,255,255,0.5); transition: all 0.15s;
        }
        .icon-btn:hover:not(:disabled) { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.35); color: #a855f7; }
        .icon-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        .delete-btn {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px; width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(239,68,68,0.5); transition: all 0.15s; flex-shrink: 0;
        }
        .delete-btn:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.4); color: #ef4444; }
      `}</style>

      <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', fontFamily: "'Syne',sans-serif", position: 'relative', overflowX: 'hidden' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -100, left: -80, opacity: 0.11, filter: 'blur(90px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -60, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '56px 20px 120px' }}>
          <Link href="/goals/new" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
            <ArrowLeft size={15} /> Back to edit
          </Link>

          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.7)', fontWeight: 600 }}>Review & confirm</p>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Your Learning Path</h1>
          </div>

          {/* Goal summary */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', marginBottom: 24, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 3px 3px 0', background: '#a855f7', boxShadow: '0 0 12px #a855f7' }} />
            <div style={{ paddingLeft: 12 }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{goalName}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {keywords && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}><Tag size={12} color="#06b6d4" />{keywords}</div>}
                {targetDate && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}><Calendar size={12} color="#f59e0b" />{new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[{ icon: BookOpen, color: '#a855f7', value: `${videos.length} videos` }, { icon: Clock, color: '#06b6d4', value: formatDuration(totalDuration) || '—' }].map(({ icon: Icon, color, value }) => (
                  <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.5)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Video list */}
          {videos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {videos.map((video, index) => (
                <div key={video.youtube_video_id} className="video-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button className="icon-btn" onClick={() => moveVideo(index, 'up')} disabled={index === 0}><ChevronUp size={14} /></button>
                      <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.3)' }}>{String(index + 1).padStart(2, '0')}</span>
                      <button className="icon-btn" onClick={() => moveVideo(index, 'down')} disabled={index === videos.length - 1}><ChevronDown size={14} /></button>
                    </div>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={video.thumbnail_url} alt={video.title} style={{ width: 96, height: 56, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                        <Play size={20} color="white" fill="white" />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'white', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{video.title}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{video.channel_title}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                        {video.duration > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}><Clock size={10} />{formatDuration(video.duration)}</span>}
                        {video.view_count > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}><Eye size={10} />{video.view_count.toLocaleString()}</span>}
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => removeVideo(index)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Play size={36} color="rgba(168,85,247,0.35)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>No videos in your path</p>
              <Link href="/goals/new" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: '#a855f7', textDecoration: 'none' }}>← Go back and regenerate</Link>
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        {videos.length > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px 32px', background: 'rgba(8,11,18,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 12, justifyContent: 'flex-end', zIndex: 50 }}>
            <Link href="/goals/new" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 22px', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: "'Syne',sans-serif" }}>
              Cancel
            </Link>
            <button onClick={saveGoal} style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', border: 'none', borderRadius: 14, padding: '12px 28px', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: 'pointer', boxShadow: '0 0 28px rgba(168,85,247,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} /> Save Goal
            </button>
          </div>
        )}
      </div>
    </>
  )
}