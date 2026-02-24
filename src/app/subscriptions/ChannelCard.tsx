'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface ChannelCardProps {
  channel: {
    youtube_channel_id: string
    title: string
    thumbnail_url: string | null
    description: string | null
  }
  color: string
}

export default function ChannelCard({ channel, color }: ChannelCardProps) {
  const handleExternalClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(`https://www.youtube.com/channel/${channel.youtube_channel_id}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ position: 'relative', minWidth: 0, width: '100%', overflow: 'hidden' }}>
      {/* External link button */}
      <button
        onClick={handleExternalClick}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        aria-label="Open on YouTube"
      >
        <ExternalLink size={14} color="white" />
      </button>

      {/* Internal link to channel page */}
      <Link href={`/channels/${channel.youtube_channel_id}`} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
        <div
          className="channel-card card-glass"
          style={{
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Subtle colored top glow */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 80, height: 2, borderRadius: '0 0 8px 8px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: 0.6,
          }} />

          {/* Avatar */}
          {channel.thumbnail_url ? (
            <div style={{ width: 60, height: 60, borderRadius: '50%', border: `2px solid ${color}50`, overflow: 'hidden', boxShadow: `0 0 16px ${color}30`, flexShrink: 0 }}>
              <img
                src={channel.thumbnail_url}
                alt={channel.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}40, ${color}15)`,
              border: `2px solid ${color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color,
              boxShadow: `0 0 16px ${color}30`,
              flexShrink: 0,
            }}>
              {channel.title.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name */}
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center', lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            width: '100%',
            wordBreak: 'break-word',
          }}>
            {channel.title}
          </p>

          {/* Description snippet */}
          {channel.description && (
            <p style={{
              margin: 0, fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center', lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              width: '100%',
              wordBreak: 'break-word',
            }}>
              {channel.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}