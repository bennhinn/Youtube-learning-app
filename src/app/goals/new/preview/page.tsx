'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function PreviewPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [goalName, setGoalName] = useState('')
    const [keywords, setKeywords] = useState('')
    const [targetDate, setTargetDate] = useState('')

    useEffect(() => {
        const storedVideos = localStorage.getItem('previewVideos')
        const storedGoalName = localStorage.getItem('goalName')
        const storedKeywords = localStorage.getItem('goalKeywords')
        const storedTargetDate = localStorage.getItem('goalTargetDate')

        if (storedVideos) {
            setVideos(JSON.parse(storedVideos))
            setGoalName(storedGoalName || '')
            setKeywords(storedKeywords || '')
            setTargetDate(storedTargetDate || '')
            setLoading(false)
        } else {
            router.push('/goals/new')
        }
    }, [router])

    const moveVideo = (index: number, direction: 'up' | 'down') => {
        const newVideos = [...videos]
        if (direction === 'up' && index > 0) {
            [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]]
        } else if (direction === 'down' && index < videos.length - 1) {
            [newVideos[index + 1], newVideos[index]] = [newVideos[index], newVideos[index + 1]]
        }
        setVideos(newVideos)
    }

    const removeVideo = (index: number) => {
        setVideos(videos.filter((_, i) => i !== index))
    }

    const saveGoal = async () => {
        setSaving(true)
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) throw new Error(`Authentication error: ${userError.message}`)
            if (!user) throw new Error('Not authenticated')

            const { data: existingProfile, error: profileCheckError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            if (profileCheckError && profileCheckError.code === 'PGRST116') {
                const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert({ id: user.id })
                if (createProfileError) throw new Error(`Failed to create user profile: ${createProfileError.message} (Code: ${createProfileError.code})`)
            }

            if (!videos.length) throw new Error('No videos in the learning path')

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

            const insertedVideoIds = new Set()

            for (let index = 0; index < videos.length; index++) {
                const video = videos[index]
                if (insertedVideoIds.has(video.youtube_video_id)) continue

                const { error: channelError } = await supabase
                    .from('channels')
                    .upsert({
                        youtube_channel_id: video.channel_id,
                        title: video.channel_title || 'Unknown Channel',
                        last_fetched: new Date().toISOString(),
                    }, { onConflict: 'youtube_channel_id' })

                const { error: videoError } = await supabase
                    .from('videos')
                    .upsert({
                        youtube_video_id: video.youtube_video_id,
                        title: video.title,
                        description: video.description || '',
                        thumbnail_url: video.thumbnail_url || '',
                        channel_id: video.channel_id,
                        channel_title: video.channel_title || '',
                        duration: video.duration || 0,
                        view_count: video.view_count || 0,
                        like_count: video.like_count || 0,
                        last_fetched: new Date().toISOString(),
                    }, { onConflict: 'youtube_video_id' })

                if (videoError) throw new Error(`Failed to save video: ${video.title}`)

                const { error: pathError } = await supabase
                    .from('learning_paths')
                    .insert({
                        goal_id: goal.id,
                        video_id: video.youtube_video_id,
                        position: index,
                        status: 'not_started',
                    })

                if (pathError) {
                    if (pathError.code === '23505') {
                        console.warn(`Duplicate learning_path entry skipped for video ${video.youtube_video_id}`)
                    } else {
                        throw new Error(`Failed to add video to path: ${video.title}`)
                    }
                } else {
                    insertedVideoIds.add(video.youtube_video_id)
                }
            }

            localStorage.removeItem('previewVideos')
            localStorage.removeItem('goalName')
            localStorage.removeItem('goalKeywords')
            localStorage.removeItem('goalTargetDate')

            router.push('/dashboard')
        } catch (error) {
            let errorMessage = 'Unknown error occurred'
            if (error instanceof Error) {
                errorMessage = error.message
            } else if (error && typeof error === 'object') {
                if ('message' in error && typeof (error as Record<string, unknown>).message === 'string') {
                    errorMessage = (error as { message: string }).message
                } else if ('error_description' in error && typeof (error as Record<string, unknown>).error_description === 'string') {
                    errorMessage = (error as { error_description: string }).error_description
                } else {
                    try { errorMessage = JSON.stringify(error) } catch { }
                }
            } else if (typeof error === 'string') {
                errorMessage = error
            }
            console.error('Save goal error:', error)
            alert(`Failed to save goal: ${errorMessage}`)
        } finally {
            setSaving(false)
        }
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return [
            hours > 0 ? `${hours}h` : '',
            minutes > 0 ? `${minutes}m` : '',
            secs > 0 ? `${secs}s` : '',
        ].filter(Boolean).join(' ')
    }

    const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0)

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ background: '#080b12', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", color: 'white' }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid rgba(168,85,247,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading preview…</p>
                </div>
            </div>
        )
    }

    // ── Main UI ────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .video-card { transition: transform 0.15s ease; }
        .video-card:active { transform: scale(0.99); }
        @media (max-width: 420px) {
          .video-card-row { flex-wrap: wrap !important; }
          .video-card-bottom { width: 100%; padding-left: 0 !important; }
          .action-bar { flex-direction: column !important; }
          .action-bar > * { width: 100% !important; justify-content: center !important; text-align: center !important; }
        }
        .icon-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: all 0.15s;
        }
        .icon-btn:hover:not(:disabled) {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.35);
          color: #a855f7;
        }
        .icon-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        .delete-btn {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(239,68,68,0.5);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .delete-btn:hover {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.4);
          color: #ef4444;
        }
      `}</style>

            <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', fontFamily: "'Syne', sans-serif", position: 'relative', overflowX: 'hidden' }}>

                {/* Orbs */}
                <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -100, left: -80, opacity: 0.11, filter: 'blur(90px)' }} />
                    <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -60, opacity: 0.08, filter: 'blur(80px)' }} />
                </div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '56px 20px 120px' }}>

                    {/* Back */}
                    <Link href="/goals/new" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
                        <ArrowLeft size={15} /> Back to edit
                    </Link>

                    {/* Header */}
                    <div style={{ marginBottom: 28 }}>
                        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.7)', fontWeight: 600 }}>
                            Review & confirm
                        </p>
                        <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Your Learning Path
                        </h1>
                    </div>

                    {/* Goal summary card */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 20px', marginBottom: 24, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }}>
                        {/* left bar */}
                        <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 3px 3px 0', background: '#a855f7', boxShadow: '0 0 12px #a855f7' }} />
                        <div style={{ paddingLeft: 12 }}>
                            <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{goalName}</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                {keywords && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                                        <Tag size={12} color="#06b6d4" />
                                        {keywords}
                                    </div>
                                )}
                                {targetDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                                        <Calendar size={12} color="#f59e0b" />
                                        {new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            {/* Stats row */}
                            <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                {[
                                    { icon: BookOpen, color: '#a855f7', value: `${videos.length} videos` },
                                    { icon: Clock, color: '#06b6d4', value: formatDuration(totalDuration) || '—' },
                                ].map(({ icon: Icon, color, value }) => (
                                    <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Icon size={13} color={color} />
                                        <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Video list */}
                    {videos.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {videos.map((video, index) => (
                                <div
                                    key={video.youtube_video_id}
                                    className="video-card"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '12px 14px', backdropFilter: 'blur(8px)' }}
                                >
                                    {/* Responsive row */}
                                    <div className="video-card-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Order controls + number */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                            <button className="icon-btn" onClick={() => moveVideo(index, 'up')} disabled={index === 0} aria-label="Move up">
                                                <ChevronUp size={14} />
                                            </button>
                                            <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <button className="icon-btn" onClick={() => moveVideo(index, 'down')} disabled={index === videos.length - 1} aria-label="Move down">
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        {/* Thumbnail */}
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <img
                                                src={video.thumbnail_url}
                                                alt={video.title}
                                                style={{ width: 96, height: 56, borderRadius: 10, objectFit: 'cover', display: 'block' }}
                                            />
                                            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s' }}
                                                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                            >
                                                <Play size={20} color="white" fill="white" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'white', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {video.title}
                                            </p>
                                            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{video.channel_title}</p>
                                            <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                                                {video.duration > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                                                        <Clock size={10} /> {formatDuration(video.duration)}
                                                    </span>
                                                )}
                                                {video.view_count > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                                                        <Eye size={10} /> {video.view_count.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete */}
                                        <button className="delete-btn" onClick={() => removeVideo(index)} aria-label="Remove video">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>{/* end video-card-row */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.08)' }}>
                            <Play size={36} color="rgba(168,85,247,0.35)" style={{ marginBottom: 12 }} />
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>No videos in your path</p>
                            <Link href="/goals/new" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: '#a855f7', textDecoration: 'none' }}>
                                ← Go back and regenerate
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sticky bottom action bar */}
                {videos.length > 0 && (
                    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px 32px', background: 'rgba(8,11,18,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 12, justifyContent: 'flex-end', zIndex: 50, flexWrap: 'wrap' }}>
                        <Link
                            href="/goals/new"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 22px', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: "'Syne', sans-serif" }}
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={saveGoal}
                            disabled={saving}
                            style={{ background: saving ? 'rgba(168,85,247,0.5)' : 'linear-gradient(135deg, #a855f7, #7c3aed)', border: 'none', borderRadius: 14, padding: '12px 28px', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 28px rgba(168,85,247,0.5)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                        >
                            {saving ? (
                                <>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Save Goal
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}