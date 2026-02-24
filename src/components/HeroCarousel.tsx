'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Play, Download, ChevronLeft, ChevronRight, BookOpen, Target, Zap, Flame, Star, Layers } from 'lucide-react'

interface Goal {
  id: string
  name: string
  progress_percent: number | null
  target_date: string | null
}

const THEMES = [
  { bg: 'radial-gradient(ellipse at 20% 50%, #4c1d95 0%, #1e1b4b 40%, #080b12 80%)', accent: '#a855f7', glow: 'rgba(168,85,247,0.4)', secondary: '#06b6d4', icon: BookOpen, label: 'LEARNING PATH' },
  { bg: 'radial-gradient(ellipse at 80% 30%, #164e63 0%, #0c1929 40%, #080b12 80%)', accent: '#06b6d4', glow: 'rgba(6,182,212,0.4)', secondary: '#10b981', icon: Target, label: 'GOAL TRACK' },
  { bg: 'radial-gradient(ellipse at 30% 70%, #78350f 0%, #1c1008 40%, #080b12 80%)', accent: '#f59e0b', glow: 'rgba(245,158,11,0.4)', secondary: '#ef4444', icon: Flame, label: 'ON FIRE' },
  { bg: 'radial-gradient(ellipse at 60% 20%, #064e3b 0%, #0a1f17 40%, #080b12 80%)', accent: '#10b981', glow: 'rgba(16,185,129,0.4)', secondary: '#06b6d4', icon: Zap, label: 'IN PROGRESS' },
  { bg: 'radial-gradient(ellipse at 10% 80%, #7f1d1d 0%, #1a0a0a 40%, #080b12 80%)', accent: '#ef4444', glow: 'rgba(239,68,68,0.4)', secondary: '#f59e0b', icon: Star, label: 'PRIORITY' },
  { bg: 'radial-gradient(ellipse at 50% 0%, #1e3a5f 0%, #0d1b2a 40%, #080b12 80%)', accent: '#3b82f6', glow: 'rgba(59,130,246,0.4)', secondary: '#a855f7', icon: Layers, label: 'DEEP DIVE' },
]

export default function HeroCarousel({ goals }: { goals: Goal[] }) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [direction, setDirection] = useState<'right' | 'left'>('right')
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef<number | null>(null)
  const total = goals.length

  const go = useCallback((next: number, dir: 'right' | 'left') => {
    if (animating || next === current) return
    setDirection(dir)
    setPrev(current)
    setAnimating(true)
    setCurrent(next)
    setTimeout(() => { setPrev(null); setAnimating(false) }, 480)
  }, [animating, current])

  const advance = useCallback(() => go((current + 1) % total, 'right'), [current, total, go])
  const goBack  = useCallback(() => go((current - 1 + total) % total, 'left'), [current, total, go])

  useEffect(() => {
    if (paused || total <= 1) return
    timerRef.current = setTimeout(advance, 5000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, paused, advance, total])

  if (!goals.length) {
    return (
      <Link href="/goals/new" style={{ textDecoration: 'none', display: 'block', margin: '0 20px 24px' }}>
        <div style={{ height: 240, borderRadius: 20, background: 'rgba(168,85,247,0.05)', border: '1px dashed rgba(168,85,247,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🎯</span>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(168,85,247,0.8)', fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Create your first learning goal</p>
        </div>
      </Link>
    )
  }

  const goal = goals[current]
  const prevGoal = prev !== null ? goals[prev] : null
  const theme = THEMES[current % THEMES.length]
  const prevTheme = prev !== null ? THEMES[prev % THEMES.length] : null

  return (
    <>
      <style>{`
        @keyframes slideInR  { from{transform:translateX(105%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideInL  { from{transform:translateX(-105%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideOutL { from{transform:translateX(0);opacity:1} to{transform:translateX(-105%);opacity:0} }
        @keyframes slideOutR { from{transform:translateX(0);opacity:1} to{transform:translateX(105%);opacity:0} }
        @keyframes fadeUp { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes barFill { from{width:0%} }
        @keyframes timerBar { from{width:0%} to{width:100%} }
        .slide-enter-r { animation: slideInR  0.48s cubic-bezier(0.22,1,0.36,1) forwards }
        .slide-enter-l { animation: slideInL  0.48s cubic-bezier(0.22,1,0.36,1) forwards }
        .slide-exit-l  { animation: slideOutL 0.48s cubic-bezier(0.22,1,0.36,1) forwards }
        .slide-exit-r  { animation: slideOutR 0.48s cubic-bezier(0.22,1,0.36,1) forwards }
        .reveal-1 { animation: fadeUp 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both }
        .reveal-2 { animation: fadeUp 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both }
        .reveal-3 { animation: fadeUp 0.5s 0.25s cubic-bezier(0.22,1,0.36,1) both }
        .reveal-4 { animation: fadeUp 0.5s 0.35s cubic-bezier(0.22,1,0.36,1) both }
        .bar-fill  { animation: barFill 0.9s 0.4s ease-out both }
        .hero-btn-white {
          flex:1; display:flex; align-items:center; justify-content:center; gap:7px;
          background:white; border:none; border-radius:10px; padding:13px 0;
          color:#080b12; font-size:14px; font-weight:800; font-family:'Syne',sans-serif;
          cursor:pointer; width:100%; transition:transform 0.12s,opacity 0.12s;
        }
        .hero-btn-white:active { transform:scale(0.96); opacity:0.9 }
        .hero-btn-outline {
          display:flex; align-items:center; justify-content:center;
          background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25);
          border-radius:10px; padding:13px 20px; color:white; cursor:pointer;
          backdrop-filter:blur(8px); transition:transform 0.12s,background 0.15s;
        }
        .hero-btn-outline:active { transform:scale(0.96); background:rgba(255,255,255,0.22) }
        .nav-btn {
          width:32px; height:32px; border-radius:50%;
          background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.18);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; backdrop-filter:blur(12px);
          transition:background 0.15s,transform 0.12s;
        }
        .nav-btn:active { transform:scale(0.88); background:rgba(255,255,255,0.18) }
      `}</style>

      <div
        style={{ position: 'relative', height: 300, marginBottom: 24, overflow: 'hidden' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; setPaused(true) }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(dx) > 40) dx < 0 ? advance() : goBack()
          touchStartX.current = null
          setTimeout(() => setPaused(false), 2500)
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Auto-advance timer bar */}
        {total > 1 && !paused && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 20, background: 'rgba(255,255,255,0.07)' }}>
            <div key={`timer-${current}`} style={{ height: '100%', background: theme.accent, animation: 'timerBar 5s linear forwards', boxShadow: `0 0 8px ${theme.accent}` }} />
          </div>
        )}

        {/* Exiting slide */}
        {prevGoal && prevTheme && (
          <div key={`exit-${prev}`} className={direction === 'right' ? 'slide-exit-l' : 'slide-exit-r'} style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <Slide goal={prevGoal} theme={prevTheme} fresh={false} />
          </div>
        )}

        {/* Entering slide */}
        <div key={`enter-${current}`} className={animating ? (direction === 'right' ? 'slide-enter-r' : 'slide-enter-l') : ''} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          <Slide goal={goal} theme={theme} fresh={animating || prev === null} />
        </div>

        {/* Nav arrows */}
        {total > 1 && (
          <>
            <button className="nav-btn" onClick={() => { goBack(); setPaused(true); setTimeout(() => setPaused(false), 3000) }} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
              <ChevronLeft size={14} color="white" />
            </button>
            <button className="nav-btn" onClick={() => { advance(); setPaused(true); setTimeout(() => setPaused(false), 3000) }} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
              <ChevronRight size={14} color="white" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 10 }}>
            {goals.map((_, i) => (
              <button key={i} onClick={() => go(i, i > current ? 'right' : 'left')} style={{ width: i === current ? 22 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: i === current ? 'white' : 'rgba(255,255,255,0.3)', transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1),background 0.3s' }} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function Slide({ goal, theme, fresh }: { goal: Goal; theme: typeof THEMES[0]; fresh: boolean }) {
  const Icon = theme.icon
  const pct = goal.progress_percent ?? 0
  const r = fresh ? { label: 'reveal-1', title: 'reveal-2', bar: 'reveal-3', btns: 'reveal-4' } : { label: '', title: '', bar: '', btns: '' }

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: theme.bg }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.5) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, background: 'linear-gradient(to top,rgba(8,11,18,0.75),transparent)' }} />
      <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: theme.accent, top: -70, right: -40, opacity: 0.13, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: theme.secondary, bottom: 20, left: 10, opacity: 0.1, filter: 'blur(50px)' }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '32px 24px 46px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {/* Badge */}
        <div className={r.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `${theme.accent}20`, border: `1px solid ${theme.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={theme.accent} />
          </div>
          <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{theme.label}</span>
        </div>

        {/* Bottom block */}
        <div>
          <div className={r.title}>
            <h2 style={{ margin: '0 0 4px', fontFamily: "'Syne',sans-serif", fontSize: goal.name.length > 30 ? 19 : 23, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'white', textShadow: '0 2px 24px rgba(0,0,0,0.55)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
              {goal.name}
            </h2>
            {goal.target_date && (
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>
                Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          <div className={r.bar} style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em' }}>PROGRESS</span>
              <span style={{ fontSize: 12, color: theme.accent, fontFamily: "'DM Mono',monospace", fontWeight: 700, textShadow: `0 0 14px ${theme.glow}` }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div className={fresh ? 'bar-fill' : ''} style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${theme.accent}70,${theme.accent})`, borderRadius: 4, boxShadow: `0 0 10px ${theme.glow}` }} />
            </div>
          </div>

          <div className={r.btns} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Link href={`/goals/${goal.id}`} style={{ flex: 1, textDecoration: 'none' }}>
              <button className="hero-btn-white">
                <Play size={14} fill="#080b12" color="#080b12" /> Continue
              </button>
            </Link>
            <button className="hero-btn-outline">
              <Download size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}