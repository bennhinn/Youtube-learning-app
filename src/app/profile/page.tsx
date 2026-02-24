import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  User, Mail, Calendar, Target, Tv, CheckCircle, Flame, 
  LogOut, Settings, Moon, Sun, ChevronRight 
} from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import ThemeToggle from '@/app/dashboard/ThemeToggle' // optional, you can move the toggle here

// Helper to compute streak (same as dashboard)
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

  const watchedDays = new Set(progress.map(p => new Date(p.watched_at).toDateString()))
  let streak = 0
  let current = new Date()
  while (watchedDays.has(current.toDateString())) {
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch stats
  const { count: goalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  const { count: subscriptionsCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: watchedCount } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const streak = await getStreak(user.id)

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .profile-root {
          background: #080b12;
          min-height: 100vh;
          color: white;
          font-family: 'Syne', sans-serif;
          max-width: 390px;
          margin: 0 auto;
          position: relative;
          padding-bottom: 100px;
        }
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 5px 12px;
        }
        .hover-glow {
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .hover-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(168,85,247,0.3);
        }
        .hover-glow:active {
          transform: scale(0.98);
        }
        .avatar-glow {
          box-shadow: 0 0 0 3px #080b12, 0 0 0 6px rgba(168,85,247,0.3), 0 0 30px rgba(168,85,247,0.5);
        }
      `}</style>

      <div className="profile-root">
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.12, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', bottom: -40, right: -40, opacity: 0.1, filter: 'blur(80px)' }} />
        </div>

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '52px 20px 20px' }}>
          {/* Header with back button? Actually bottom nav already has Profile, so we don't need back. */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Profile</h1>
          </div>

          {/* Avatar card */}
          <div className="card-glass" style={{ padding: '24px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <div className="avatar-glow" style={{ 
                width: 72, height: 72, borderRadius: '50%', 
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white'
              }}>
                {initials}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{displayName}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={13} /> {user.email}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} /> Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Goals', value: goalsCount ?? 0, icon: Target, color: '#a855f7' },
              { label: 'Subs', value: subscriptionsCount ?? 0, icon: Tv, color: '#06b6d4' },
              { label: 'Watched', value: watchedCount ?? 0, icon: CheckCircle, color: '#10b981' },
              { label: 'Streak', value: streak, icon: Flame, color: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} className="card-glass" style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${stat.color}15`, border: `1px solid ${stat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} color={stat.color} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'white' }}>{stat.value}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Quick access</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/goals" style={{ textDecoration: 'none' }}>
                <div className="card-glass hover-glow" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={16} color="#a855f7" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>My Goals</span>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                </div>
              </Link>
              <Link href="/subscriptions" style={{ textDecoration: 'none' }}>
                <div className="card-glass hover-glow" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tv size={16} color="#06b6d4" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Subscriptions</span>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                </div>
              </Link>
            </div>
          </div>

          {/* Settings section */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Settings</h3>
            <div className="card-glass" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Moon size={16} color="#f59e0b" /> Dark Mode
                </span>
                <ThemeToggle /> {/* Reuse your existing toggle or create a simple toggle */}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Settings size={16} color="#a855f7" /> Preferences
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>coming soon</span>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <form action="/auth/signout" method="post">
            <button type="submit" className="card-glass hover-glow" style={{
              width: '100%',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 20,
              padding: '14px',
              color: '#ef4444',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}>
              <LogOut size={18} /> Sign Out
            </button>
          </form>
        </div>
      </div>
      <BottomNavClient />
    </>
  )
}