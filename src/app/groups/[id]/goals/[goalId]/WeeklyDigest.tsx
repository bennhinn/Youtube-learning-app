'use client'

import { useState, useEffect } from 'react'
import { Trophy, Flame, Eye, MessageCircle, Video, Users, TrendingUp, Crown, Medal } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  profile: any
  contributions: number
  watches: number
  reactionsReceived: number
  score: number
}

interface MostReacted {
  title: string
  thumbnail?: string
  youtubeId: string
  channelTitle?: string
  reactionCount: number
  contributorProfile: any
  goalName?: string
}

interface DigestStats {
  totalWatches: number
  totalReactions: number
  totalComments: number
  weekVideos: number
  activeThisWeek: number
  totalMembers: number
}

interface DigestData {
  leaderboard: LeaderboardEntry[]
  mostReacted: MostReacted | null
  stats: DigestStats
}

interface WeeklyDigestProps {
  groupId: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Avatar({ profile, size = 32 }: { profile: any; size?: number }) {
  const name = profile?.display_name || profile?.email?.split('@')[0] || '?'
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, color: 'white', flexShrink: 0, fontFamily: "'Syne',sans-serif" }}>
      {name[0].toUpperCase()}
    </div>
  )
}

const RANK_CONFIG = [
  { icon: <Crown size={14} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: '1st' },
  { icon: <Medal size={14} />, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)', label: '2nd' },
  { icon: <Medal size={14} />, color: '#cd7c3a', bg: 'rgba(205,124,58,0.1)',   border: 'rgba(205,124,58,0.2)', label: '3rd' },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function WeeklyDigest({ groupId }: WeeklyDigestProps) {
  const [digest,  setDigest]  = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'leaderboard' | 'stats'>('leaderboard')

  useEffect(() => {
    fetch(`/api/groups/${groupId}/digest`)
      .then(r => r.json())
      .then(d => { setDigest(d.digest); setLoading(false) })
      .catch(() => setLoading(false))
  }, [groupId])

  if (loading) return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[80, 120, 60].map((w, i) => (
          <div key={i} style={{ height: 12, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ width: 30, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)' }} />
        </div>
      ))}
    </div>
  )

  if (!digest) return null

  const { leaderboard, mostReacted, stats } = digest
  const hasActivity = leaderboard.some(e => e.score > 0)
  if (!hasActivity) return null

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .digest-tab { transition: all 0.18s; }
        .digest-tab:hover { background: rgba(255,255,255,0.06) !important; }
        .digest-entry { transition: background 0.15s; }
        .digest-entry:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <div style={{ marginBottom: 20, animation: 'slideIn 0.3s ease forwards' }}>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>

          {/* Header inside card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.15))', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(245,158,11,0.15)' }}>
              <Trophy size={14} color="#f59e0b" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'white', fontFamily: "'Syne',sans-serif", letterSpacing: '-0.01em' }}>Group Leaderboard</p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>all time</p>
            </div>
          </div>

          {/* Tab bar inside card */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {([
              { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { key: 'stats',       label: 'Stats',       icon: '📊' },
            ] as const).map(t => (
              <button
                key={t.key}
                className="digest-tab"
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, background: 'none',
                  borderBottom: `2px solid ${tab === t.key ? '#a855f7' : 'transparent'}`,
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  padding: '11px 8px',
                  color: tab === t.key ? '#a855f7' : 'rgba(255,255,255,0.35)',
                  fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif",
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'color 0.15s',
                }}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* ── Leaderboard tab ── */}
          {tab === 'leaderboard' && (
            <div>
              {leaderboard.filter(e => e.score > 0).map((entry, i, arr) => {
                const rank  = RANK_CONFIG[i]
                const name  = entry.profile?.display_name || entry.profile?.email?.split('@')[0] || 'Someone'
                const isTop = i === 0

                return (
                  <div key={i} className="digest-entry" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px',
                    background: isTop ? 'linear-gradient(90deg,rgba(245,158,11,0.07),transparent)' : 'transparent',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    {/* Rank badge */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: rank ? rank.bg : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${rank ? rank.border : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: rank ? rank.color : 'rgba(255,255,255,0.3)',
                    }}>
                      {rank ? rank.icon : <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{i + 1}</span>}
                    </div>

                    {/* Avatar */}
                    <Avatar profile={entry.profile} size={34} />

                    {/* Name + mini stats */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: isTop ? 'white' : 'rgba(255,255,255,0.8)', fontFamily: "'Syne',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                        {isTop && <span style={{ marginLeft: 6, fontSize: 10 }}>👑</span>}
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>
                          {entry.contributions} video{entry.contributions !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>·</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>
                          {entry.watches} watched
                        </span>
                        {entry.reactionsReceived > 0 && (
                          <>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>·</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>
                              {entry.reactionsReceived} 🔥
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: rank ? rank.color : 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                        {entry.score}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>pts</p>
                    </div>
                  </div>
                )
              })}

              {/* Score formula explainer */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Contribute', pts: '+3', emoji: '🎬' },
                  { label: 'Reaction received', pts: '+2', emoji: '🔥' },
                  { label: 'Watch a video', pts: '+1', emoji: '👁' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 10, padding: '8px 4px' }}>
                    <span style={{ fontSize: 14 }}>{r.emoji}</span>
                    <span style={{ fontSize: 12, color: '#a855f7', fontFamily: "'DM Mono',monospace", fontWeight: 800 }}>{r.pts}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Syne',sans-serif", textAlign: 'center', lineHeight: 1.3 }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Stats tab ── */}
          {tab === 'stats' && (
            <div style={{ padding: 16 }}>
              {/* Stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Videos', value: stats.weekVideos, icon: <Video size={13} />, color: '#a855f7' },
                  { label: 'Watches', value: stats.totalWatches, icon: <Eye size={13} />, color: '#06b6d4' },
                  { label: 'Reactions', value: stats.totalReactions, icon: <Flame size={13} />, color: '#ef4444' },
                  { label: 'Comments', value: stats.totalComments, icon: <MessageCircle size={13} />, color: '#f59e0b' },
                  { label: 'Active', value: `${stats.activeThisWeek}/${stats.totalMembers}`, icon: <Users size={13} />, color: '#10b981' },
                  { label: 'Engagement', value: `${stats.totalMembers > 0 ? Math.round((stats.activeThisWeek / stats.totalMembers) * 100) : 0}%`, icon: <TrendingUp size={13} />, color: '#a855f7' },
                ].map(s => (
                  <div key={s.label} style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5, color: s.color }}>{s.icon}</div>
                    <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Syne',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Most reacted video */}
              {mostReacted && (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Syne',sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🔥 Most Reacted This Week
                  </p>
                  <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 12px', alignItems: 'center' }}>
                    {mostReacted.thumbnail && (
                      <img src={mostReacted.thumbnail} alt={mostReacted.title} style={{ width: 52, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne',sans-serif" }}>{mostReacted.title}</p>
                      {mostReacted.channelTitle && (
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>{mostReacted.channelTitle}</p>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ef4444', fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{mostReacted.reactionCount}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: "'Syne',sans-serif" }}>reactions</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}