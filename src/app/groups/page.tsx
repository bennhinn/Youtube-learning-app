import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Lock, Globe, Plus, ArrowLeft, Sparkles } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import JoinGroupButton from './[id]/JoinGroupButton' // optional, if you want direct join

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Fetch memberships using admin client (bypass RLS)
  const { data: memberships } = await adminClient
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', user.id)

  const memberGroupIds = memberships?.map(m => m.group_id) || []
  const roleMap = Object.fromEntries(memberships?.map(m => [m.group_id, m.role]) || [])

  // Fetch groups the user is a member of (by IDs)
  const { data: myGroups } = await adminClient
    .from('groups')
    .select('*')
    .in('id', memberGroupIds.length ? memberGroupIds : [0]) // use array with dummy
    .order('created_at', { ascending: false })

  // Fetch discoverable public groups (excluding member groups)
  let query = adminClient
    .from('groups')
    .select('*')
    .eq('is_public', true)

  if (memberGroupIds.length > 0) {
    query = query.not('id', 'in', `(${memberGroupIds.join(',')})`)
  }

  const { data: discoverGroups } = await query.limit(10)

  const GROUP_GRADIENTS = [
    'linear-gradient(135deg,#a855f7,#7c3aed)',
    'linear-gradient(135deg,#06b6d4,#0e7490)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#ef4444,#dc2626)',
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .groups-root { background: #080b12; min-height: 100vh; color: white; font-family: 'Syne', sans-serif; max-width: 390px; margin: 0 auto; position: relative; overflowX: hidden; }
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
          transition: background 0.15s, transform 0.15s;
        }
        .card-glass:active { background: rgba(255,255,255,0.07); transform: scale(0.98); }
        .group-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          text-decoration: none;
        }
        .group-avatar {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 22px;
          font-weight: 800;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .group-avatar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.12);
          border-radius: inherit;
        }
        .fab-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(168,85,247,0.5);
          transition: transform 0.15s, box-shadow 0.15s;
          flex-shrink: 0;
        }
        .fab-btn:active { transform: scale(0.93); box-shadow: 0 0 12px rgba(168,85,247,0.3); }
        .role-badge {
          font-size: 9px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 20px;
        }
        .section-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          font-weight: 600;
          margin: 0 0 12px;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeSlideUp 0.3s ease forwards; }
      `}</style>

      <div className="groups-root">
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: '#06b6d4', top: 300, right: -40, opacity: 0.08, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: '#f59e0b', bottom: 200, left: -20, opacity: 0.07, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100vh', paddingBottom: 120 }}>

          {/* Header */}
          <div style={{ padding: '52px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 12px' }}>
                <ArrowLeft size={14} /> Back
              </Link>
              <Link href="/groups/new" className="fab-btn" aria-label="Create group">
                <Plus size={20} color="white" />
              </Link>
            </div>

            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              Learning together
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Groups
            </h1>
          </div>

          {/* Stats bar */}
          <div style={{ padding: '0 20px', marginBottom: 28 }}>
            <div className="card-glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={15} color="#a855f7" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{myGroups?.length ?? 0}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>joined</p>
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={15} color="#06b6d4" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{discoverGroups?.length ?? 0}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>to discover</p>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <Link href="/groups/new" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#a855f7', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> New
              </Link>
            </div>
          </div>

          {/* My Groups */}
          {myGroups && myGroups.length > 0 && (
            <div style={{ padding: '0 20px', marginBottom: 28 }} className="animate-in">
              <p className="section-label">Your groups</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myGroups.map((group, i) => {
                  const role = roleMap[group.id]
                  const gradient = GROUP_GRADIENTS[i % GROUP_GRADIENTS.length]
                  const initial = group.name.charAt(0).toUpperCase()
                  return (
                    <Link key={group.id} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card-glass group-card">
                        <div className="group-avatar" style={{ background: gradient }}>
                          {initial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {group.name}
                            </p>
                            {role === 'admin' && (
                              <span className="role-badge" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
                                admin
                              </span>
                            )}
                            {role === 'moderator' && (
                              <span className="role-badge" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4' }}>
                                mod
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {group.is_public
                              ? <Globe size={11} color="rgba(255,255,255,0.3)" />
                              : <Lock size={11} color="rgba(255,255,255,0.3)" />
                            }
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                              {group.is_public ? 'Public' : 'Private'}
                            </span>
                            {group.description && (
                              <>
                                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>·</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {group.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Discover */}
          {discoverGroups && discoverGroups.length > 0 && (
            <div style={{ padding: '0 20px', marginBottom: 28, animationDelay: '0.08s' }} className="animate-in">
              <p className="section-label">Discover</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {discoverGroups.map((group, i) => {
                  const gradient = GROUP_GRADIENTS[(i + 2) % GROUP_GRADIENTS.length]
                  const initial = group.name.charAt(0).toUpperCase()
                  return (
                    <Link key={group.id} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card-glass group-card">
                        <div className="group-avatar" style={{ background: gradient }}>
                          {initial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {group.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Globe size={11} color="#06b6d4" />
                            <span style={{ fontSize: 11, color: '#06b6d4', fontWeight: 600 }}>Public</span>
                            {group.description && (
                              <>
                                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>·</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {group.description?.substring(0, 35)}{group.description?.length > 35 ? '…' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#06b6d4', flexShrink: 0 }}>
                          Join
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!myGroups || myGroups.length === 0) && (!discoverGroups || discoverGroups.length === 0) && (
            <div style={{ padding: '0 20px' }}>
              <div className="card-glass" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={28} color="#a855f7" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No groups yet</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Create a group or discover public ones to learn with others.
                  </p>
                </div>
                <Link href="/groups/new" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', borderRadius: 14, padding: '10px 24px', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
                  <Plus size={16} /> Create a Group
                </Link>
              </div>
            </div>
          )}

        </div>
        <BottomNavClient />
      </div>
    </>
  )
}