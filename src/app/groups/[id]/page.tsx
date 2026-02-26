import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Crown, Calendar, Globe, Lock, Users, Target } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import JoinGroupButton from './JoinGroupButton'
import LeaveGroupButton from './LeaveGroupButton'
import MemberAvatars from './MemberAvatars'

const GOAL_COLORS = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const groupId = parseInt(id)

  const { data: group } = await adminClient
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) redirect('/groups')

  const { data: membership } = await adminClient
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  const isMember = !!membership
  const isAdmin = membership?.role === 'admin'

  const { data: members } = await adminClient
    .from('group_members')
    .select(`role, user:user_id (id, display_name, email, avatar_url)`)
    .eq('group_id', groupId)
    .order('role', { ascending: false })

  const membersWithProfiles = members?.map(m => ({
    ...m,
    profile: Array.isArray(m.user) ? m.user[0] : m.user,
  })) || []

  const { data: goals } = await adminClient
    .from('group_goals')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  const adminProfile = membersWithProfiles.find(m => m.role === 'admin')?.profile
  const initial = group.name.charAt(0).toUpperCase()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .gd-root {
          background: #080b12; min-height: 100vh; color: white;
          font-family: 'Syne', sans-serif; max-width: 390px; margin: 0 auto; position: relative;
        }
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }
        .section-label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); font-weight: 600; margin: 0 0 12px;
        }

        /* ── Animations ────────────────────────────────────── */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.8); }
          65%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes avatarPop {
          from { opacity: 0; transform: scale(0.7) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .ani   { animation: fadeSlideUp 0.35s ease both; }
        .ani-2 { animation: fadeSlideUp 0.35s ease 0.1s both; }
        .ani-3 { animation: fadeSlideUp 0.35s ease 0.2s both; }
        .hero-ani { animation: heroIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        /* Staggered pill pop-in */
        .pill-ani { animation: popIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both; }
        .pill-ani:nth-child(1) { animation-delay: 0.2s; }
        .pill-ani:nth-child(2) { animation-delay: 0.28s; }
        .pill-ani:nth-child(3) { animation-delay: 0.36s; }

        /* Staggered goal rows */
        .goal-item { animation: fadeSlideUp 0.3s ease both; }
        .goal-item:nth-child(1) { animation-delay: 0.05s; }
        .goal-item:nth-child(2) { animation-delay: 0.10s; }
        .goal-item:nth-child(3) { animation-delay: 0.15s; }
        .goal-item:nth-child(4) { animation-delay: 0.20s; }
        .goal-item:nth-child(5) { animation-delay: 0.25s; }

        /* Member rows stagger */
        .member-item { animation: fadeSlideUp 0.3s ease both; }
        .member-item:nth-child(1) { animation-delay: 0.05s; }
        .member-item:nth-child(2) { animation-delay: 0.10s; }
        .member-item:nth-child(3) { animation-delay: 0.15s; }
        .member-item:nth-child(4) { animation-delay: 0.20s; }

        /* Interactions */
        .goal-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; cursor: pointer;
          transition: background 0.18s, transform 0.18s;
        }
        .goal-row:hover  { background: rgba(168,85,247,0.07); }
        .goal-row:active { transform: scale(0.98); background: rgba(168,85,247,0.12); }

        .member-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 14px;
          transition: background 0.15s;
        }
        .member-row:hover { background: rgba(255,255,255,0.04); }

        /* Stat pills — subtle glow on hover */
        .stat-pill { transition: transform 0.18s, box-shadow 0.18s; }
        .stat-pill:hover { transform: translateY(-2px); }
      `}</style>

      <div className="gd-root">
        {/* Orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: '#a855f7', top: -60, left: -60, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100vh', paddingBottom: 120 }}>

          {/* Sticky top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '52px 20px 16px',
            position: 'sticky', top: 0, zIndex: 20,
            background: 'rgba(8,11,18,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Link href="/groups" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', flexShrink: 0 }}>
              <ArrowLeft size={20} />
            </Link>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {group.is_public ? <Globe size={10} /> : <Lock size={10} />}
                {group.is_public ? 'Public' : 'Private'} · {membersWithProfiles.length} member{membersWithProfiles.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Hero card */}
          <div style={{ padding: '20px 20px 0' }} className="hero-ani">
            <div style={{
              borderRadius: 24, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0c0a1e 100%)',
              border: '1px solid rgba(168,85,247,0.2)',
              boxShadow: '0 0 40px rgba(168,85,247,0.1)',
              padding: '24px 24px 20px',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%,rgba(168,85,247,0.2) 0%,transparent 55%), radial-gradient(ellipse at 80% 20%,rgba(6,182,212,0.15) 0%,transparent 50%)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white', boxShadow: '0 0 24px rgba(168,85,247,0.4)', flexShrink: 0 }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{group.name}</h1>
                    {adminProfile && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Crown size={10} color="#f59e0b" /> Created by {adminProfile.display_name || adminProfile.email?.split('@')[0]}
                      </p>
                    )}
                  </div>
                </div>

                {group.description && (
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                    {group.description}
                  </p>
                )}

                {/* ── Stats row — flexWrap fixes pill clipping ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { icon: <Users size={13} color="#a855f7" />, val: membersWithProfiles.length, label: 'members', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.2)', glow: 'rgba(168,85,247,0.2)' },
                    { icon: <Target size={13} color="#06b6d4" />, val: goals?.length ?? 0, label: 'goals', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.2)', glow: 'rgba(6,182,212,0.2)' },
                  ].map(s => (
                    <div key={s.label} className="stat-pill pill-ani" style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.icon}
                      <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{s.val}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                    </div>
                  ))}
                  {/* Public/Private pill — always gets its own row space due to flexWrap */}
                  <div className="stat-pill pill-ani" style={{ background: group.is_public ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${group.is_public ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {group.is_public ? <Globe size={13} color="#10b981" /> : <Lock size={13} color="#f59e0b" />}
                    <span style={{ fontSize: 11, color: group.is_public ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{group.is_public ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Join button */}
          {!isMember && group.is_public && (
            <div style={{ padding: '16px 20px 0' }} className="ani">
              <JoinGroupButton groupId={groupId} />
            </div>
          )}

          {/* Member avatars */}
          {isMember && (
            <div style={{ padding: '20px 20px 0' }} className="ani-2">
              <MemberAvatars members={membersWithProfiles} groupId={groupId} />
            </div>
          )}

          {/* Goals */}
          {isMember && (
            <div style={{ padding: '24px 20px 0' }} className="ani-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="section-label" style={{ margin: 0 }}>Group Goals</p>
                {isAdmin && (
                  <Link href={`/groups/${id}/goals/new`} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#a855f7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> New Goal
                  </Link>
                )}
              </div>

              {!goals || goals.length === 0 ? (
                <div className="card-glass" style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={20} color="#a855f7" />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                    {isAdmin ? 'No goals yet — create the first one!' : 'No goals yet.'}
                  </p>
                </div>
              ) : (
                <div className="card-glass" style={{ overflow: 'hidden' }}>
                  {goals.map((goal, i) => {
                    const color = GOAL_COLORS[i % GOAL_COLORS.length]
                    return (
                      <div key={goal.id} className="goal-item">
                        {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />}
                        <Link href={`/groups/${id}/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
                          <div className="goal-row">
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.18s', }}>
                              <Calendar size={17} color={color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</p>
                              {goal.description && (
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {goal.description}
                                </p>
                              )}
                            </div>
                            {goal.target_date && (
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>
                                {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Members */}
          {isMember && membersWithProfiles.length > 0 && (
            <div style={{ padding: '24px 20px 0' }} className="ani-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="section-label" style={{ margin: 0 }}>Members · {membersWithProfiles.length}</p>
                <LeaveGroupButton groupId={groupId} />
              </div>
              <div className="card-glass" style={{ overflow: 'hidden' }}>
                {membersWithProfiles.map(({ profile, role }, i) => {
                  const name = profile.display_name || profile.email?.split('@')[0] || '?'
                  const memberInitial = name.charAt(0).toUpperCase()
                  return (
                    <div key={profile.id} className="member-item">
                      {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />}
                      <div className="member-row">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(168,85,247,0.2)' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                            {memberInitial}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                            {role === 'admin' && <Crown size={12} color="#f59e0b" />}
                          </div>
                          <p style={{ margin: '1px 0 0', fontSize: 11, color: role === 'admin' ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.3)', fontWeight: role === 'admin' ? 600 : 400 }}>
                            {role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'Member'}
                          </p>
                        </div>
                        {profile.id === user.id && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>you</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
        <BottomNavClient />
      </div>
    </>
  )
}