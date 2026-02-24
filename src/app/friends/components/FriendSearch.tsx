'use client'

import { useState } from 'react'
import { Search, Loader2, UserPlus } from 'lucide-react'

interface FriendSearchProps {
  onSendRequest: () => void
}

export default function FriendSearch({ onSendRequest }: FriendSearchProps) {
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
        body: JSON.stringify({ friendId }),
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
            onChange={(e) => setQuery(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && search(query)}
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
          {results.map((user) => (
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
      ) : (
        query &&
        !searching && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20 }}>
            No users found.
          </p>
        )
      )}
    </div>
  )
}