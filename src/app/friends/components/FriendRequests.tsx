'use client'

import { UserPlus, Check, X, Loader2 } from 'lucide-react'

interface Friend {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  friendship_created_at?: string
}

interface FriendRequestsProps {
  received: Friend[]
  sent: Friend[]
  loading: boolean
  error: string | null
  onAccept: (friendId: string) => void
  onReject: (friendId: string) => void
  onCancel: (friendId: string) => void
}

export default function FriendRequests({
  received,
  sent,
  loading,
  error,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestsProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
        <Loader2 size={30} className="animate-spin" style={{ marginBottom: 10 }} />
        <p>Loading requests…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-glass" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
        <p>{error}</p>
      </div>
    )
  }

  if (received.length === 0 && sent.length === 0) {
    return (
      <div className="card-glass" style={{ padding: 40, textAlign: 'center' }}>
        <UserPlus size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No pending requests.</p>
      </div>
    )
  }

  return (
    <>
      {received.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Received requests</h3>
          <div className="card-glass" style={{ overflow: 'hidden' }}>
            {received.map((friend) => (
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="icon-btn accept-btn"
                    onClick={() => onAccept(friend.id)}
                    title="Accept"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="icon-btn reject-btn"
                    onClick={() => onReject(friend.id)}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Sent requests</h3>
          <div className="card-glass" style={{ overflow: 'hidden' }}>
            {sent.map((friend) => (
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
                <button
                  className="icon-btn reject-btn"
                  onClick={() => onCancel(friend.id)}
                  title="Cancel request"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}