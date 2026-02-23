'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const syncSubscriptions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/youtube/subscriptions')
      const data = await res.json()
      if (res.ok) {
        router.refresh()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to sync subscriptions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={syncSubscriptions}
      disabled={loading}
      style={{
        background: loading ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.12)',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: 14,
        padding: '8px 16px',
        color: '#06b6d4',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "'Syne', sans-serif",
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 13, height: 13,
            border: '2px solid rgba(6,182,212,0.3)',
            borderTopColor: '#06b6d4',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Syncing…
        </>
      ) : (
        <>↻ Sync</>
      )}
    </button>
  )
}