import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import VideoList from './VideoList'
import { ArrowLeft, Calendar, BookOpen, CheckCircle, Clock, Flame } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

// Streak for this specific goal
async function getGoalStreak(userId: string, videoIds: string[]) {
  if (!videoIds.length) return 0
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: progress } = await supabase
    .from('progress')
    .select('watched_at')
    .eq('user_id', userId)
    .in('video_id', videoIds)
    .gte('watched_at', thirtyDaysAgo.toISOString())
    .order('watched_at', { ascending: false })

  if (!progress?.length) return 0
  const watchedDays = new Set(progress.map(p => new Date(p.watched_at).toDateString()))
  let streak = 0
  const current = new Date()
  while (watchedDays.has(current.toDateString())) {
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

export default async function GoalDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  // Fetch goal details and verify ownership
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (goalError || !goal) {
    console.error('Goal fetch error:', goalError)
    redirect('/dashboard')
  }

  // Fetch learning path videos with video details
  const { data: rawPathItems, error: pathError } = await supabase
    .from('learning_paths')
    .select(`
      position,
      status,
      video:video_id (
        youtube_video_id,
        title,
        description,
        thumbnail_url,
        channel_title,
        duration,
        view_count,
        like_count
      )
    `)
    .eq('goal_id', id)
    .order('position', { ascending: true })

  if (pathError) console.error('Path fetch error:', pathError)

  // Transform data: ensure video is a single object, not an array
  const pathItems = rawPathItems?.map((item: any) => ({
    position: item.position,
    status: item.status,
    video: Array.isArray(item.video) ? item.video[0] : item.video,
  })) || []

  // Calculate progress
  const totalVideos    = pathItems.length
  const watchedVideos  = pathItems.filter(item => item.status === 'watched').length
  const progressPercent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0

  // Estimated time remaining
  const remainingSeconds = pathItems
    .filter(item => item.status !== 'watched')
    .reduce((acc, item) => acc + (item.video?.duration || 0), 0)

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : ''].filter(Boolean).join(' ') || '<1m'
  }

  // Goal-specific streak
  const videoIds = pathItems.map(i => i.video?.youtube_video_id).filter(Boolean)
  const streak = await getGoalStreak(user.id, videoIds)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        .keyword-pill {
          background: rgba(168,85,247,0.1);
          border: 1px solid rgba(168,85,247,0.25);
          border-radius: 20px; padding: 3px 10px;
          font-size: 11px; color: #a855f7; font-weight: 600;
        }
        @media (max-width: 480px) {
          .goal-stats { flex-wrap: wrap; gap: 10px !important; }
          .goal-title { font-size: 22px !important; }
        }
      `}</style>

      <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', fontFamily: "'Syne', sans-serif", position: 'relative', overflowX: 'hidden' }}>

        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.11, filter: 'blur(90px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', top: 300, right: -60, opacity: 0.08, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#f59e0b', bottom: 100, left: -40, opacity: 0.07, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '52px 16px 100px' }}>

          {/* Back */}
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>

          {/* Goal header card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '24px 20px', marginBottom: 24, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 3px 3px 0', background: '#a855f7', boxShadow: '0 0 14px #a855f7' }} />

            <div style={{ paddingLeft: 14 }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.7)', fontWeight: 600 }}>
                Learning Goal
              </p>
              <h1 className="goal-title" style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {goal.name}
              </h1>

              {goal.description && (
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                  {goal.description}
                </p>
              )}

              {goal.keywords?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {goal.keywords.map((kw: string) => (
                    <span key={kw} className="keyword-pill">{kw}</span>
                  ))}
                </div>
              )}

              {/* Stats row */}
              <div className="goal-stats" style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={13} color="#a855f7" />
                  <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>{totalVideos} videos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} color="#10b981" />
                  <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>{watchedVideos} watched</span>
                </div>
                {remainingSeconds > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="#06b6d4" />
                    <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>~{formatDuration(remainingSeconds)} left</span>
                  </div>
                )}
                {streak > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '2px 10px' }}>
                    <Flame size={12} color="#f59e0b" />
                    <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#f59e0b', fontWeight: 600 }}>{streak} day streak</span>
                  </div>
                )}
                {goal.target_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} color="#f59e0b" />
                    <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Progress</span>
                  <span style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#a855f7', textShadow: '0 0 16px rgba(168,85,247,0.6)' }}>
                    {progressPercent}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #a855f7, #06b6d4)', borderRadius: 6, boxShadow: '0 0 12px #a855f7', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Video list */}
          <VideoList goalId={goal.id} initialItems={pathItems} />
        </div>
      </div>
    </>
  )
}