'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle, Archive, Target } from 'lucide-react'

const GOAL_COLORS = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']
const TABS = ['All', 'Active', 'Completed', 'Archived'] as const
type Tab = typeof TABS[number]

type Goal = {
  id: string
  name: string
  progress_percent: number | null
  target_date: string | null
  status: string
}

export default function GoalsList({ goals }: { goals: Goal[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('All')

  const filtered = goals.filter(g => {
    if (activeTab === 'All') return true
    return g.status === activeTab.toLowerCase()
  })

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = tab === activeTab
          const count = tab === 'All' ? goals.length : goals.filter(g => g.status === tab.toLowerCase()).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: isActive ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 30,
                padding: '7px 14px',
                color: isActive ? '#a855f7' : 'rgba(255,255,255,0.4)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: "'Syne', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 0 16px rgba(168,85,247,0.2)' : 'none',
              }}
            >
              {tab}
              <span style={{
                background: isActive ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '1px 7px',
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: isActive ? '#a855f7' : 'rgba(255,255,255,0.3)',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((goal, i) => {
            const color = GOAL_COLORS[goals.indexOf(goal) % GOAL_COLORS.length]
            return (
              <Link key={goal.id} href={`/goals/${goal.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: 16,
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                  transition: 'transform 0.15s',
                }}>
                  {/* Left glow bar */}
                  <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 3px 3px 0', background: color, boxShadow: `0 0 12px ${color}` }} />

                  <div style={{ paddingLeft: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'white', lineHeight: 1.3 }}>
                            {goal.name}
                          </p>
                          {goal.status === 'completed' && <CheckCircle size={14} color={color} />}
                          {goal.status === 'archived' && <Archive size={14} color="rgba(255,255,255,0.3)" />}
                        </div>
                        {goal.target_date && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={11} />
                            {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {/* Status pill */}
                        <span style={{
                          display: 'inline-block',
                          marginTop: 6,
                          background: goal.status === 'active' ? 'rgba(16,185,129,0.12)' : goal.status === 'completed' ? `${color}18` : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${goal.status === 'active' ? 'rgba(16,185,129,0.3)' : goal.status === 'completed' ? `${color}40` : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 20,
                          padding: '2px 8px',
                          fontSize: 10,
                          fontWeight: 600,
                          color: goal.status === 'active' ? '#10b981' : goal.status === 'completed' ? color : 'rgba(255,255,255,0.3)',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}>
                          {goal.status}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color, textShadow: `0 0 20px ${color}88`, lineHeight: 1, marginLeft: 12 }}>
                        {goal.progress_percent ?? 0}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${goal.progress_percent ?? 0}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 4, boxShadow: `0 0 8px ${color}`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Target size={36} color="rgba(168,85,247,0.4)" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            No {activeTab.toLowerCase()} goals yet
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            {activeTab === 'Active' ? 'Create a goal to start learning' : `Nothing here yet`}
          </p>
        </div>
      )}
    </div>
  )
}