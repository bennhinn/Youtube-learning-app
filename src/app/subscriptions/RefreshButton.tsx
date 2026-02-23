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
        router.refresh() // Refresh the page to show updated data
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
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Syncing...</span>
        </>
      ) : (
        'Sync Now'
      )}
    </button>
  )
}