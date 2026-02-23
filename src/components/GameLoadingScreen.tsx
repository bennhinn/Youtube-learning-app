'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  { label: 'Connecting to YouTube…',    xp: 20  },
  { label: 'Fetching channel data…',    xp: 45  },
  { label: 'Loading subscriptions…',    xp: 65  },
  { label: 'Analysing content…',        xp: 82  },
  { label: 'Preparing your feed…',      xp: 96  },
]

export default function GameLoadingScreen() {
  const [stepIndex, setStepIndex]   = useState(0)
  const [xp, setXp]                 = useState(0)
  const [glitch, setGlitch]         = useState(false)
  const [dots, setDots]             = useState('.')

  // Cycle through steps
  useEffect(() => {
    const t = setInterval(() => {
      setStepIndex(i => {
        const next = Math.min(i + 1, STEPS.length - 1)
        setXp(STEPS[next].xp)
        return next
      })
    }, 900)
    return () => clearInterval(t)
  }, [])

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400)
    return () => clearInterval(t)
  }, [])

  // Random glitch bursts
  useEffect(() => {
    const burst = () => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 120)
      setTimeout(burst, 2200 + Math.random() * 1800)
    }
    const id = setTimeout(burst, 1200)
    return () => clearTimeout(id)
  }, [])

  const currentStep = STEPS[stepIndex]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes ping      { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.6);opacity:0} }
        @keyframes xp-fill   { from { width: 0% } }
        @keyframes scanline  { from { transform: translateY(-100%) } to { transform: translateY(100vh) } }
        @keyframes flicker   { 0%,100%{opacity:1} 45%{opacity:0.85} 50%{opacity:0.6} 55%{opacity:0.9} }
        @keyframes glitch-h  {
          0%   { clip-path: inset(40% 0 55% 0); transform: translate(-4px,0); }
          20%  { clip-path: inset(10% 0 80% 0); transform: translate(4px,0); }
          40%  { clip-path: inset(70% 0 10% 0); transform: translate(-2px,0); }
          60%  { clip-path: inset(20% 0 60% 0); transform: translate(3px,0); }
          80%  { clip-path: inset(55% 0 30% 0); transform: translate(-3px,0); }
          100% { clip-path: inset(0 0 0 0);     transform: translate(0,0); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg)   translateX(54px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(120deg)  translateX(54px) rotate(-120deg); }
          to   { transform: rotate(480deg)  translateX(54px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          from { transform: rotate(240deg)  translateX(54px) rotate(-240deg); }
          to   { transform: rotate(600deg)  translateX(54px) rotate(-600deg); }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgba(168,85,247,0.7); }
          100% { box-shadow: 0 0 0 20px rgba(168,85,247,0); }
        }

        .gl-text {
          position: relative;
          animation: flicker 4s linear infinite;
        }
        .gl-text::after {
          content: attr(data-text);
          position: absolute; left: 0; top: 0;
          color: #06b6d4;
          animation: glitch-h 0.12s steps(1) forwards;
        }
        .xp-bar-fill {
          transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
          animation: xp-fill 0.7s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      <div style={{
        background: '#080b12', minHeight: '100vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Syne', sans-serif", color: 'white',
        overflow: 'hidden', position: 'relative',
      }}>

        {/* Scanline effect */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2, zIndex: 2,
          background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)',
          animation: 'scanline 3s linear infinite',
        }} />

        {/* Background orbs */}
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -100, left: -80, opacity: 0.10, filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', bottom: -60, right: -60, opacity: 0.08, filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '0 32px', width: '100%', maxWidth: 360 }}>

          {/* Orbital spinner */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1px solid rgba(168,85,247,0.15)',
            }} />
            {/* Spinning dashed ring */}
            <div style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              border: '1px dashed rgba(168,85,247,0.25)',
              animation: 'spin 8s linear infinite',
            }} />
            {/* Main spinner arc */}
            <div style={{
              position: 'absolute', inset: 16, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#a855f7', borderRightColor: 'rgba(168,85,247,0.3)',
              animation: 'spin 1.1s cubic-bezier(0.4,0,0.2,1) infinite',
              boxShadow: '0 0 16px rgba(168,85,247,0.5)',
            }} />

            {/* Orbiting dots */}
            <div style={{ position: 'absolute', inset: 0, animation: 'orbit 2.2s linear infinite' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7', margin: '0 auto' }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, animation: 'orbit2 2.2s linear infinite' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 6px #06b6d4', margin: '0 auto' }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, animation: 'orbit3 2.2s linear infinite' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b', margin: '0 auto' }} />
            </div>

            {/* Centre logo tile */}
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, boxShadow: '0 0 28px rgba(168,85,247,0.6)',
              animation: 'pulse-ring 1.4s ease-out infinite',
            }}>
              L
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <h2
              className={glitch ? 'gl-text' : ''}
              data-text="LearnTube"
              style={{
                margin: '0 0 6px', fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #fff 0%, #a855f7 60%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              LearnTube
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
              Initialising system
            </p>
          </div>

          {/* XP Bar */}
          <div style={{ width: '100%' }}>
            {/* Step label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, animation: 'fadeUp 0.3s ease' }} key={stepIndex}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono', monospace" }}>
                {currentStep.label}{dots}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7', fontFamily: "'DM Mono', monospace" }}>
                {currentStep.xp} XP
              </span>
            </div>

            {/* Track */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              {/* Shimmer overlay */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'scanline 1.5s linear infinite',
              }} />
              {/* Fill */}
              <div
                className="xp-bar-fill"
                style={{
                  height: '100%',
                  width: `${xp}%`,
                  background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                  borderRadius: 6,
                  boxShadow: '0 0 10px #a855f7',
                  position: 'relative', zIndex: 0,
                }}
              />
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i <= stepIndex ? '#a855f7' : 'rgba(255,255,255,0.1)',
                  boxShadow: i <= stepIndex ? '0 0 6px #a855f7' : 'none',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>

          {/* Step log — last 3 completed steps */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {STEPS.slice(0, stepIndex + 1).slice(-3).map((s, i, arr) => (
              <div
                key={s.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: i === arr.length - 1 ? 1 : 0.35,
                  animation: 'fadeUp 0.25s ease',
                  transition: 'opacity 0.4s',
                }}
              >
                <span style={{ fontSize: 10, color: '#10b981', fontFamily: "'DM Mono', monospace" }}>
                  {i === arr.length - 1 ? '▶' : '✓'}
                </span>
                <span style={{ fontSize: 12, color: i === arr.length - 1 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}