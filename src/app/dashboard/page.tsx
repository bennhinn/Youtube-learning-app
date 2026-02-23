import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import {
  BookOpen,
  Play,
  Check,
  Clock,
  Bell,
  ChevronRight,
  Download,
  Plus,
  Tv,
  Flame,
  Home,
  Target,
  User,
  Calendar,
  LogOut,
} from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import SyncButton from './SyncButton'

// ─── Goal accent colours cycling ─────────────────────────────────────────────
const GOAL_COLORS = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']

// Helper to compute streak (consecutive days with watched videos)
async function getStreak(userId: string) {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: progress } = await supabase
    .from('progress')
    .select('watched_at')
    .eq('user_id', userId)
    .gte('watched_at', thirtyDaysAgo.toISOString())
    .order('watched_at', { ascending: false })

  if (!progress || progress.length === 0) return 0

  const watchedDays = new Set(
    progress.map((p) => new Date(p.watched_at).toDateString())
  )
  let streak = 0
  let current = new Date()
  while (watchedDays.has(current.toDateString())) {
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('id, name, progress_percent, target_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Fetch subscriptions with channel details (for stories)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      id,
      channel:channel_id (
        youtube_channel_id,
        title,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .limit(8)

  // Flatten channel data (handle array return from join)
  const channels = subscriptions
    ?.map((sub) => (Array.isArray(sub.channel) ? sub.channel[0] : sub.channel))
    .filter((c) => c && c.youtube_channel_id) || []

  const { count: subscriptionCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: watchedCount } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch recently watched videos (last 3)
  const { data: recentProgress } = await supabase
    .from('progress')
    .select(`
      watched_at,
      video:video_id (
        youtube_video_id,
        title,
        thumbnail_url,
        channel_title
      )
    `)
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .limit(3)

  const recentVideos = recentProgress
    ?.map((p) => (Array.isArray(p.video) ? p.video[0] : p.video))
    .filter(Boolean) || []

  const streak = await getStreak(user.id)

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'there'
  const initials = displayName.slice(0, 2).toUpperCase()
  const topGoal = goals?.[0]

  const lastSynced = profile?.youtube_subscriptions_last_fetched
    ? (() => {
        const diff = Date.now() - new Date(profile.youtube_subscriptions_last_fetched).getTime()
        const hours = Math.floor(diff / 36e5)
        const mins = Math.floor(diff / 6e4)
        if (hours >= 24) return `${Math.floor(hours / 24)}d ago`
        if (hours >= 1) return `${hours}h ago`
        return `${mins}m ago`
      })()
    : 'Never'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .learntube * { box-sizing: border-box; }
        .learntube ::-webkit-scrollbar { display: none; }
        .learntube { scrollbar-width: none; }
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }
        .btn-primary {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 14px;
          padding: 10px 0;
          color: white;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(168,85,247,0.5);
        }
        .btn-ghost {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 10px 16px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
        }
        .scroll-x {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .scroll-x::-webkit-scrollbar { display: none; }
        .stat-card {
          transition: transform 0.15s ease;
        }
        .stat-card:active {
          transform: scale(0.96);
        }
        .channel-story:active {
          transform: scale(0.94);
        }
        .goal-card:active {
          transform: scale(0.98);
        }
        .avatar-btn {
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .avatar-btn:hover {
          opacity: 0.85;
          transform: scale(0.97);
        }
        .icon-btn {
          transition: background 0.15s ease;
        }
        .icon-btn:hover {
          background: rgba(255,255,255,0.12) !important;
        }
      `}</style>

      <div
        className="learntube"
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: '100vh',
          margin: '0 auto',
          background: '#080b12',
          fontFamily: "'Syne', sans-serif",
          position: 'relative',
          color: 'white',
          overflowX: 'hidden',
        }}
      >
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.12, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', top: 200, left: 200, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#f59e0b', top: 600, left: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        {/* Scrollable body */}
        <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', height: '100vh', paddingBottom: 88 }}>

          {/* ── Top Bar ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '52px 20px 16px',
            gap: 12,
          }}>
            {/* Left: greeting + name — shrinks if name is long */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                {greeting}
              </p>
              <h1 style={{
                margin: '2px 0 0',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayName} 👋
              </h1>
            </div>

            {/* Right: icons — never shrink */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button
                className="icon-btn"
                aria-label="Notifications"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Bell size={16} color="white" />
              </button>

              {/* Avatar — tapping signs out */}
              <form action="/auth/signout" method="post" style={{ margin: 0 }}>
                <button
                  type="submit"
                  className="avatar-btn"
                  aria-label="Sign out"
                  title="Sign out"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: "'Syne', sans-serif",
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                >
                  {initials}
                </button>
              </form>
            </div>
          </div>

          {/* ── Hero: top active goal ── */}
          <div style={{ padding: '0 20px', marginBottom: 24 }}>
            {topGoal ? (
              <Link href={`/goals/${topGoal.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  position: 'relative',
                  height: 210,
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c0a1e 100%)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(168,85,247,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(6,182,212,0.2) 0%, transparent 50%)' }} />
                  <div style={{ position: 'relative', zIndex: 2, padding: '24px 24px 0' }}>
                    <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.85)', fontWeight: 600 }}>
                      Continue learning
                    </p>
                    <h2 style={{ margin: '6px 0 10px', fontSize: 21, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'white' }}>
                      {topGoal.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${topGoal.progress_percent ?? 0}%`, background: 'linear-gradient(90deg, #a855f7, #06b6d4)', borderRadius: 6, boxShadow: '0 0 12px #a855f7' }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#06b6d4', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                        {topGoal.progress_percent ?? 0}%
                      </span>
                    </div>
                    {topGoal.target_date && (
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        Due {new Date(topGoal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 10, padding: '0 24px 20px' }}>
                    <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Play size={16} /> Continue
                    </button>
                    <button className="btn-ghost" aria-label="Download">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/goals/new" style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 24, height: 140, background: 'rgba(168,85,247,0.06)', border: '1px dashed rgba(168,85,247,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 28 }}>+</span>
                  <p style={{ margin: 0, fontSize: 14, color: 'rgba(168,85,247,0.8)', fontWeight: 600 }}>Create your first goal</p>
                </div>
              </Link>
            )}
          </div>

          {/* ── Stats row ── */}
          <div style={{ padding: '0 20px', marginBottom: 28 }}>
            <div className="scroll-x">
              {[
                { label: 'Goals',   value: goals?.length ?? 0,    icon: BookOpen, color: '#a855f7', href: '/goals' },
                { label: 'Subs',    value: subscriptionCount ?? 0, icon: Tv,       color: '#06b6d4', href: '/subscriptions' },
                { label: 'Watched', value: watchedCount ?? 0,      icon: Check,    color: '#10b981', href: '/progress' },
                { label: 'Streak',  value: streak,                 icon: Flame,    color: '#f59e0b', href: '#' },
              ].map((stat) => (
                <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
                  <div className="stat-card" style={{ minWidth: 88, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${stat.color}18`, border: `1px solid ${stat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon size={18} color={stat.color} />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'white', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                      {stat.value}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                      {stat.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Channel stories ── */}
          {channels.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Your Channels</h3>
                <Link href="/subscriptions" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>See all</Link>
              </div>
              <div className="scroll-x" style={{ padding: '0 20px' }}>
                {channels.map((channel, i) => {
                  const color = GOAL_COLORS[i % GOAL_COLORS.length]
                  return (
                    <a
                      key={channel.youtube_channel_id}
                      href={`https://youtube.com/channel/${channel.youtube_channel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="channel-story"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'transform 0.1s', textDecoration: 'none' }}
                    >
                      {channel.thumbnail_url ? (
                        <Image
                          src={channel.thumbnail_url}
                          alt={channel.title}
                          width={56}
                          height={56}
                          style={{ borderRadius: '50%', border: `2px solid ${color}50`, objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${color}55, ${color}15)`, border: `2px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color }}>
                          {channel.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {channel.title}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── All active goals list ── */}
          {goals && goals.length > 0 && (
            <div style={{ padding: '0 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Active Goals</h3>
                <Link
                  href="/goals/new"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#a855f7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={14} /> New
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {goals.map((goal, i) => {
                  const color = GOAL_COLORS[i % GOAL_COLORS.length]
                  return (
                    <Link key={goal.id} href={`/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card-glass goal-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden', transition: 'transform 0.15s' }}>
                        {/* left glow bar */}
                        <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 3px 3px 0', background: color, boxShadow: `0 0 12px ${color}` }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</p>
                            {goal.target_date && (
                              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={10} /> {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color, textShadow: `0 0 20px ${color}88`, lineHeight: 1, marginLeft: 12, flexShrink: 0 }}>
                            {goal.progress_percent ?? 0}%
                          </span>
                        </div>
                        <div style={{ paddingLeft: 10 }}>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ height: '100%', width: `${goal.progress_percent ?? 0}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 4, boxShadow: `0 0 8px ${color}` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Recently watched ── */}
          {recentVideos.length > 0 && (
            <div style={{ padding: '0 20px', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Continue watching</h3>
              <div className="scroll-x" style={{ gap: 12 }}>
                {recentVideos.map((video) => (
                  <a
                    key={video.youtube_video_id}
                    href={`https://youtu.be/${video.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ minWidth: 140, textDecoration: 'none' }}
                  >
                    <div className="card-glass" style={{ padding: 12 }}>
                      {video.thumbnail_url ? (
                        <Image
                          src={video.thumbnail_url}
                          alt={video.title}
                          width={116}
                          height={65}
                          style={{ borderRadius: 8, width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{ height: 65, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={20} color="white" />
                        </div>
                      )}
                      <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {video.title}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{video.channel_title}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── YouTube Sync ── */}
          <div style={{ padding: '0 20px 8px' }}>
            <div className="card-glass" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>YouTube Sync</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Last synced: {lastSynced}</p>
              </div>
              <SyncButton />
            </div>
          </div>

        </div>

        {/* ── FAB ── */}
        <Link
          href="/goals/new"
          aria-label="Create new goal"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 88,
            zIndex: 50,
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            color: 'white',
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: '0 0 30px rgba(168,85,247,0.6)',
            textDecoration: 'none',
          }}
        >
          <Plus size={24} />
        </Link>

        {/* ── Bottom navigation ── */}
        <BottomNavClient />
      </div>
    </>
  )
}