'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Member {
  profile: {
    id: string
    display_name: string | null
    email: string
    avatar_url: string | null
  }
  role: string
}

export default function MemberAvatars({ members, groupId }: { members: Member[]; groupId: number }) {
  const [showAll, setShowAll] = useState(false)

  const displayMembers = showAll ? members : members.slice(0, 5)

  return (
    <div style={{ padding: '0 16px', marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
          {members.length} members
        </span>
        {members.length > 5 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
          >
            See all <ChevronRight size={12} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {displayMembers.map(({ profile, role }) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.id}`}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div style={{ position: 'relative' }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.email.split('@')[0]} // fixed: provides fallback
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(168,85,247,0.3)' }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#a855f7,#06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    border: '2px solid rgba(168,85,247,0.3)',
                  }}
                >
                  {(profile.display_name || profile.email).charAt(0).toUpperCase()}
                </div>
              )}
              {role === 'admin' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    border: '2px solid #080b12',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                  }}
                >
                  👑
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.display_name || profile.email.split('@')[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}