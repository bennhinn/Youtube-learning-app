import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Target, Play, Users } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import AddVideoButton from './AddVideoButton'
import ContributionsList from './ContributionsList'
import WeeklyDigest from './WeeklyDigest'

export default async function GroupGoalPage({ params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { id, goalId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const groupId     = parseInt(id)
  const groupGoalId = parseInt(goalId)

  const { data: goal } = await adminClient
    .from('group_goals')
    .select('*')
    .eq('id', groupGoalId)
    .eq('group_id', groupId)
    .single()

  if (!goal) redirect(`/groups/${groupId}`)

  const { data: membership } = await adminClient
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect(`/groups/${groupId}`)

  // Total member count for watch percentage
  const { count: totalMembers } = await adminClient
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  // Contributions with reactions, watches (+ watcher profiles), and comments (+ commenter profiles)
  const { data: contributions } = await adminClient
    .from('group_goal_contributions')
    .select(`
      *,
      user:user_id (id, display_name, email, avatar_url),
      video:video_id (youtube_video_id, title, thumbnail_url, channel_title),
      reactions:contribution_reactions (reaction_type, user_id),
      watches:group_video_watches (user_id, user:user_id (id, display_name, email, avatar_url)),
      comments:contribution_comments (
        id, contribution_id, user_id, parent_id, content, created_at,
        user:user_id (id, display_name, email, avatar_url)
      )
    `)
    .eq('group_goal_id', groupGoalId)
    .order('contributed_at', { ascending: false })

  const dueDate = goal.target_date
    ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const uniqueContributors = new Set(contributions?.map(c => {
    const p = Array.isArray(c.user) ? c.user[0] : c.user
    return p?.id
  })).size

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .gg-root { background: #080b12; min-height: 100vh; color: white; font-family: 'Syne', sans-serif; max-width: 390px; margin: 0 auto; }
        .card-glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; backdrop-filter: blur(12px); }
        .section-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); font-weight: 600; margin: 0 0 12px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .ani { animation: fadeUp 0.3s ease forwards; }
        .ani-2 { animation: fadeUp 0.3s ease 0.08s both; }
      `}</style>

      <div className="gg-root">
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: '#a855f7', top: -60, left: -60, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100vh', paddingBottom: 120 }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '52px 20px 16px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,11,18,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href={`/groups/${groupId}`} style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', flexShrink: 0 }}>
              <ArrowLeft size={20} />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Group Goal</p>
            </div>
            <AddVideoButton groupId={groupId} goalId={groupGoalId} />
          </div>

          {/* Hero */}
          <div style={{ padding: '20px 20px 0' }} className="ani">
            <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#0c0a1e 100%)', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 40px rgba(168,85,247,0.1)', padding: '24px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%,rgba(168,85,247,0.2) 0%,transparent 55%), radial-gradient(ellipse at 80% 20%,rgba(6,182,212,0.15) 0%,transparent 50%)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
                    <Target size={26} color="#a855f7" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{goal.name}</h1>
                    {goal.description && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{goal.description}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {dueDate && (
                    <div style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={12} color="#06b6d4" />
                      <span style={{ fontSize: 11, color: '#06b6d4', fontWeight: 600 }}>Due {dueDate}</span>
                    </div>
                  )}
                  <div style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Play size={12} color="#a855f7" />
                    <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{contributions?.length ?? 0} videos</span>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={12} color="#10b981" />
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{uniqueContributors} contributor{uniqueContributors !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
                  
          {/* Weekly Digest */}
         <WeeklyDigest groupId={groupId} />

          {/* Contributions */}
          <div style={{ padding: '24px 20px 0' }} className="ani-2">
            <p className="section-label">Contributions</p>

            {!contributions || contributions.length === 0 ? (
              <div className="card-glass" style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={20} color="#a855f7" />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No videos contributed yet.</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Be the first to add a video to this goal.</p>
              </div>
            ) : (
              <ContributionsList
                contributions={contributions}
                groupId={groupId}
                goalId={groupGoalId}
                currentUserId={user.id}
                totalMembers={totalMembers ?? 1}
              />
            )}
          </div>

        </div>
        <BottomNavClient />
      </div>
    </>
  )
}