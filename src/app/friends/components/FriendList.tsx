'use client'

import { UserCheck, Loader2, Users } from 'lucide-react'

interface Friend {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  friendship_created_at?: string
}

interface FriendListProps {
  friends: Friend[]
  loading: boolean
  error: string | null
  onRemove: (friendId: string) => void
  onRetry: () => void
}

export default function FriendList({ friends, loading, error, onRemove, onRetry }: FriendListProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
        <Loader2 size={30} className="animate-spin" style={{ marginBottom: 10 }} />
        <p>Loading friends…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-glass" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
        <p>{error}</p>
        <button
          onClick={onRetry}
          style={{
            marginTop: 10,
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 20,
            padding: '8px 20px',
            color: '#a855f7',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="card-glass" style={{ padding: 40, textAlign: 'center' }}>
        <Users size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No friends yet.</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
          Go to the Search tab to find people.
        </p>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ overflow: 'hidden' }}>
      {friends.map((friend) => (
        <div key={friend.id} className="friend-item">
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt={friend.display_name || friend.email} className="avatar-img" />
          ) : (
            <div className="avatar">{(friend.display_name || friend.email).charAt(0).toUpperCase()}</div>
          )}
          <div className="friend-info">
            <p className="friend-name">{friend.display_name || friend.email.split('@')[0]}</p>
            <p className="friend-email">{friend.email}</p>
          </div>
          <button className="icon-btn" onClick={() => onRemove(friend.id)} title="Remove friend">
            <UserCheck size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}