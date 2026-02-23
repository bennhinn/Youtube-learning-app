'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Tv, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/subscriptions', icon: Tv, label: 'Subscriptions' },
  { href: '/profile', icon: User, label: 'Profile' },
]

const PURPLE = '#a855f7'
const PURPLE_GLOW = 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.9))'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '10px 8px 28px',
        background: 'rgba(8, 11, 18, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        zIndex: 9999,
      }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href

        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 16px',
              textDecoration: 'none',
            }}
          >
            <Icon
              style={{
                width: 24,
                height: 24,
                color: isActive ? PURPLE : 'rgba(255,255,255,0.3)',
                filter: isActive ? PURPLE_GLOW : 'none',
                transition: 'color 0.2s, filter 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? PURPLE : 'rgba(255,255,255,0.3)',
                letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </span>
            {/* Active dot */}
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: isActive ? PURPLE : 'transparent',
                boxShadow: isActive ? `0 0 8px ${PURPLE}` : 'none',
                transition: 'all 0.2s',
              }}
            />
          </Link>
        )
      })}
    </nav>
  )
}