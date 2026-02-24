'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Loader2, Users } from 'lucide-react'

interface Suggestion {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
}

interface FriendSuggestionsProps {
  onSendRequest: () => void
}

export default function FriendSuggestions({ onSendRequest }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/friends/suggestions')
      const data = await res.json()
      if (res.ok) setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.id !== friendId))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSending(null)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
        <Loader2 size={30} className="animate-spin" style={{ marginBottom: 10 }} />
        <p>Finding people you may know…</p>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="card-glass" style={{ padding: 40, textAlign: 'center' }}>
        <Users size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No suggestions right now.</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
          Try adding more friends or come back later.
        </p>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ overflow: 'hidden' }}>
      {suggestions.map((user) => (
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
  )
}