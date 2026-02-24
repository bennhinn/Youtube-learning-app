'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const syncSubscriptions = async () => {
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const res = await fetch('/api/youtube/subscriptions')
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(`Synced ${data.count} subscriptions`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setStatus('error')
        setMessage(data.error || 'Sync failed')
      }
    } catch {
      setStatus('error')
      setMessage('Failed to sync')
    } finally {
      setLoading(false)
    }
  }

  const color =
    status === 'success' ? '#10b981' :
    status === 'error'   ? '#ef4444' :
    '#06b6d4'

  const borderColor =
    status === 'success' ? 'rgba(16,185,129,0.3)' :
    status === 'error'   ? 'rgba(239,68,68,0.3)'  :
    'rgba(6,182,212,0.3)'

  const bgColor =
    status === 'success' ? 'rgba(16,185,129,0.12)' :
    status === 'error'   ? 'rgba(239,68,68,0.12)'  :
    'rgba(6,182,212,0.12)'

  const label =
    loading              ? 'Syncing…'  :
    status === 'success' ? 'Synced!'   :
    status === 'error'   ? 'Failed'    :
    'Sync'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={syncSubscriptions}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 20,
          padding: '7px 14px',
          color,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? (
          <RefreshCw size={14} style={{ animation: 'syncspin 0.75s linear infinite' }} />
        ) : status === 'success' ? (
          <CheckCircle size={14} />
        ) : status === 'error' ? (
          <AlertCircle size={14} />
        ) : (
          <RefreshCw size={14} />
        )}
        {label}
      </button>

      {message && !loading && (
        <p style={{
          margin: 0,
          fontSize: 10,
          color,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.02em',
        }}>
          {message}
        </p>
      )}

      <style>{`@keyframes syncspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}