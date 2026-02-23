'use client'

import { useState } from 'react'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const syncSubscriptions = async () => {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/youtube/subscriptions')
      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ Synced ${data.count} subscriptions!`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to sync. Check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={syncSubscriptions}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-3 font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="size-5 animate-spin text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Sync YouTube Subscriptions</span>
          </>
        )}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  )
}