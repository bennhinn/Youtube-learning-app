'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, UserCheck, UserPlus, Search, Sparkles } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import FriendList from './components/FriendList'
import FriendRequests from './components/FriendRequests'
import FriendSearch from './components/FriendSearch'
import FriendSuggestions from './components/FriendSuggestions'

type Tab = 'friends' | 'requests' | 'search' | 'suggestions'

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
      fetchFriends()
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
        .tab-bar {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 20px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          font-weight: 600;
          padding: 10px 12px;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          transition: color 0.2s, border-color 0.2s;
          letter-spacing: 0.02em;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
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
          <div className="tab-bar">
            {(['friends', 'requests', 'search', 'suggestions'] as Tab[]).map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'friends' && <Users size={14} />}
                {tab === 'requests' && <UserPlus size={14} />}
                {tab === 'search' && <Search size={14} />}
                {tab === 'suggestions' && <Sparkles size={14} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'friends' && (
            <FriendList
              friends={friends}
              loading={loading}
              error={error}
              onRemove={removeFriend}
              onRetry={fetchFriends}
            />
          )}

          {activeTab === 'requests' && (
            <FriendRequests
              received={pendingReceived}
              sent={pendingSent}
              loading={loading}
              error={error}
              onAccept={acceptRequest}
              onReject={rejectRequest}
              onCancel={rejectRequest}
            />
          )}

          {activeTab === 'search' && (
            <FriendSearch onSendRequest={fetchFriends} />
          )}

          {activeTab === 'suggestions' && (
            <FriendSuggestions onSendRequest={fetchFriends} />
          )}
        </div>

        <BottomNavClient />
      </div>
    </>
  )
}