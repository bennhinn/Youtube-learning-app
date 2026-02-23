'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TopBarProps {
  title?: string
  showMenu?: boolean
  initials?: string
}

const PURPLE = '#a855f7'
const CYAN = '#06b6d4'

export default function TopBar({ title = 'LearnTube', showMenu = false, initials = 'U' }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'rgba(8, 11, 18, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left: menu + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showMenu && (
          <button
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <Menu style={{ width: 20, height: 20 }} />
          </button>
        )}

        {/* Logo mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: 'white',
              boxShadow: `0 0 16px rgba(168,85,247,0.5)`,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            L
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: `linear-gradient(135deg, #ffffff 0%, ${PURPLE} 60%, ${CYAN} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: "'Syne', system-ui, sans-serif",
            }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Right: theme toggle + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.55)',
              transition: 'all 0.2s',
            }}
          >
            {theme === 'dark'
              ? <Sun style={{ width: 16, height: 16 }} />
              : <Moon style={{ width: 16, height: 16 }} />
            }
          </button>
        )}

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            color: 'white',
            boxShadow: `0 0 16px rgba(168,85,247,0.45)`,
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}