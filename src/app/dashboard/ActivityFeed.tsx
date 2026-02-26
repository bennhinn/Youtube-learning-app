'use client'

import { useState, useEffect } from 'react'
import { Eye, Target, CheckCircle, Users } from 'lucide-react'

interface Activity {
  id: number
  action_type: string
  target_type: string
  target_id: string
  metadata: any
  created_at: string
  user: {
    id: string
    display_name: string | null
    email: string
    avatar_url: string | null
  }
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; verb: (meta: any) => string }> = {
  watch: {
    icon: <Eye size={12} />,
    color: '#06b6d4',
    verb: (meta) => `watched "${meta?.title || 'a video'}"`,
  },
  create_goal: {
    icon: <Target size={12} />,
    color: '#a855f7',
    verb: (meta) => `created goal "${meta?.name || 'a goal'}"`,
  },
  complete_goal: {
    icon: <CheckCircle size={12} />,
    color: '#10b981',
    verb: () => 'completed a goal 🎉',
  },
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 16px', alignItems: 'center' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', animation: 'actshimmer 1.4s ease infinite', backgroundSize: '200% 100%' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 12, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'actshimmer 1.4s ease infinite' }} />
        <div style={{ height: 10, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'actshimmer 1.4s ease infinite' }} />
      </div>
    </div>
  )
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/feed')
      .then(res => res.json())
      .then(data => setActivities(data.activities || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div style={{ padding: '0 20px', marginBottom: 24 }}>
      <style>{`
        @keyframes actshimmer {
          from { background-position: -200% center }
          to   { background-position:  200% center }
        }
      `}</style>

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
          Friend Activity
        </h3>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Live
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {loading ? (
          <>
            <SkeletonRow />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
            <SkeletonRow />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
            <SkeletonRow />
          </>
        ) : activities.length === 0 ? (
          <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#a855f7" />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontFamily: "'Syne', sans-serif" }}>
              No friend activity yet
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
              Add friends to see what they're watching
            </p>
          </div>
        ) : (
          activities.map((act, i) => {
            const cfg = ACTION_CONFIG[act.action_type] ?? {
              icon: <Users size={12} />,
              color: '#ffffff',
              verb: () => 'did something',
            }
            const name = act.user.display_name || act.user.email.split('@')[0]
            const initial = name.charAt(0).toUpperCase()

            return (
              <div key={act.id}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />}
                <div style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start' }}>

                  {/* Avatar */}
                  <div style={{ flexShrink: 0, position: 'relative' }}>
                    {act.user.avatar_url ? (
                      <img
                        src={act.user.avatar_url}
                        alt={name}
                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `2px solid ${cfg.color}40` }}
                      />
                    ) : (
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${cfg.color}55, ${cfg.color}15)`,
                        border: `2px solid ${cfg.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: cfg.color,
                        fontFamily: "'Syne', sans-serif",
                      }}>
                        {initial}
                      </div>
                    )}
                    {/* Action badge */}
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: `${cfg.color}22`,
                      border: `1.5px solid ${cfg.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: cfg.color,
                    }}>
                      {cfg.icon}
                    </div>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: 'rgba(255,255,255,0.85)', fontFamily: "'Syne', sans-serif" }}>
                      <span style={{ fontWeight: 700, color: 'white' }}>{name}</span>
                      {' '}
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>{cfg.verb(act.metadata)}</span>
                    </p>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: "'DM Mono', monospace", marginTop: 4, display: 'block' }}>
                      {formatTime(act.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}