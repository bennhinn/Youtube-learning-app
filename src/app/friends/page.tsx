'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, UserCheck, UserPlus, Search, X, Check, Loader2 } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'

type Tab = 'friends' | 'requests' | 'search'

interface Friend {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  friendship_created_at?: string
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingSent, setPendingSent] = useState<Friend[]>([])
  const [pendingReceived, setPendingReceived] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/friends/list')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setFriends(data.friends || [])
      setPendingSent(data.pendingSent || [])
      setPendingReceived(data.pendingReceived || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  const acceptRequest = async (friendId: string) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      })
      if (!res.ok) throw new Error('Failed to accept')
      fetchFriends() // refresh
    } catch (err) {
      console.error(err)
      alert('Could not accept request')
    }
  }

  const rejectRequest = async (friendId: string) => {
    try {
      const res = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      })
      if (!res.ok) throw new Error('Failed to reject')
      fetchFriends()
    } catch (err) {
      console.error(err)
      alert('Could not reject request')
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return
    try {
      const res = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      })
      if (!res.ok) throw new Error('Failed to remove')
      fetchFriends()
    } catch (err) {
      console.error(err)
      alert('Could not remove friend')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .friend-root {
          background: #080b12;
          min-height: 100vh;
          color: white;
          font-family: 'Syne', sans-serif;
          max-width: 390px;
          margin: 0 auto;
          position: relative;
          padding-bottom: 100px;
        }
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }
        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255,255,255,0.35);
          font-size: 14px;
          font-weight: 600;
          padding: 12px 0;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          transition: color 0.2s, border-color 0.2s;
          letter-spacing: 0.02em;
          flex: 1;
        }
        .tab-btn.active {
          color: #a855f7;
          border-bottom-color: #a855f7;
        }
        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .friend-item:last-child {
          border-bottom: none;
        }
        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .avatar-img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(168,85,247,0.3);
        }
        .friend-info {
          flex: 1;
          min-width: 0;
        }
        .friend-name {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .friend-email {
          margin: 2px 0 0;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }
        .icon-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: all 0.15s;
        }
        .icon-btn:hover {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.35);
          color: #a855f7;
        }
        .accept-btn {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          color: #10b981;
        }
        .accept-btn:hover {
          background: rgba(16,185,129,0.2);
          border-color: #10b981;
        }
        .reject-btn {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #ef4444;
        }
        .reject-btn:hover {
          background: rgba(239,68,68,0.2);
          border-color: #ef4444;
        }
      `}</style>

      <div className="friend-root">
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.12, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', bottom: 40, right: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '52px 20px 20px' }}>
          {/* Header with back button */}
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20, textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 20px' }}>Friends</h1>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
            {(['friends', 'requests', 'search'] as Tab[]).map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'friends' && <Users size={14} style={{ marginRight: 6 }} />}
                {tab === 'requests' && <UserPlus size={14} style={{ marginRight: 6 }} />}
                {tab === 'search' && <Search size={14} style={{ marginRight: 6 }} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'friends' && (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
                  <Loader2 size={30} className="animate-spin" style={{ marginBottom: 10 }} />
                  <p>Loading friends…</p>
                </div>
              ) : error ? (
                <div className="card-glass" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
                  <p>{error}</p>
                  <button onClick={fetchFriends} style={{ marginTop: 10, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, padding: '8px 20px', color: '#a855f7', cursor: 'pointer' }}>
                    Retry
                  </button>
                </div>
              ) : friends.length === 0 ? (
                <div className="card-glass" style={{ padding: 40, textAlign: 'center' }}>
                  <Users size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No friends yet.</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                    Go to the Search tab to find people.
                  </p>
                </div>
              ) : (
                <div className="card-glass" style={{ overflow: 'hidden' }}>
                  {friends.map(friend => (
                    <div key={friend.id} className="friend-item">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.display_name || friend.email} className="avatar-img" />
                      ) : (
                        <div className="avatar">
                          {(friend.display_name || friend.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="friend-info">
                        <p className="friend-name">{friend.display_name || friend.email.split('@')[0]}</p>
                        <p className="friend-email">{friend.email}</p>
                      </div>
                      <button className="icon-btn" onClick={() => removeFriend(friend.id)} title="Remove friend">
                        <UserCheck size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
              ) : error ? (
                <div className="card-glass" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>{error}</div>
              ) : (
                <>
                  {/* Received requests */}
                  {pendingReceived.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Received requests</h3>
                      <div className="card-glass" style={{ overflow: 'hidden' }}>
                        {pendingReceived.map(friend => (
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
                              <button className="icon-btn accept-btn" onClick={() => acceptRequest(friend.id)} title="Accept">
                                <Check size={16} />
                              </button>
                              <button className="icon-btn reject-btn" onClick={() => rejectRequest(friend.id)} title="Reject">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent requests */}
                  {pendingSent.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Sent requests</h3>
                      <div className="card-glass" style={{ overflow: 'hidden' }}>
                        {pendingSent.map(friend => (
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
                            <button className="icon-btn reject-btn" onClick={() => rejectRequest(friend.id)} title="Cancel request">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingReceived.length === 0 && pendingSent.length === 0 && (
                    <div className="card-glass" style={{ padding: 40, textAlign: 'center' }}>
                      <UserPlus size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
                      <p style={{ color: 'rgba(255,255,255,0.5)' }}>No pending requests.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <FriendSearch onSendRequest={() => fetchFriends()} />
          )}
        </div>

        <BottomNavClient />
      </div>
    </>
  )
}

// FriendSearch component inside same file
function FriendSearch({ onSendRequest }: { onSendRequest: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  const search = async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok) setResults(data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const sendRequest = async (friendId: string) => {
    setSending(friendId)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      onSendRequest()
      alert('Friend request sent!')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSending(null)
    }
  }

  return (
    <div>
      <div className="card-glass" style={{ padding: '16px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={18} color="rgba(255,255,255,0.3)" />
          <input
            type="text"
            placeholder="Search by email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyUp={e => e.key === 'Enter' && search(query)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: 14,
              fontFamily: "'Syne', sans-serif",
              width: '100%',
            }}
          />
          {searching && <Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.3)" />}
        </div>
        <button
          onClick={() => search(query)}
          style={{
            marginTop: 12,
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 20,
            padding: '8px 20px',
            color: '#a855f7',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Search
        </button>
      </div>

      {results.length > 0 ? (
        <div className="card-glass" style={{ overflow: 'hidden' }}>
          {results.map(user => (
            <div key={user.id} className="friend-item">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name || user.email} className="avatar-img" />
              ) : (
                <div className="avatar">{(user.display_name || user.email).charAt(0).toUpperCase()}</div>
              )}
              <div className="friend-info">
                <p className="friend-name">{user.display_name || user.email.split('@')[0]}</p>
                <p className="friend-email">{user.email}</p>
              </div>
              <button
                className="icon-btn"
                onClick={() => sendRequest(user.id)}
                disabled={sending === user.id}
              >
                {sending === user.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </button>
            </div>
          ))}
        </div>
      ) : query && !searching && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20 }}>No users found.</p>
      )}
    </div>
  )
}