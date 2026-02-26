'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'

export default function JoinGroupButton({ groupId }: { groupId: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const joinGroup = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to join')
      router.refresh() // refresh the page to show new member status
    } catch (err) {
      alert('Could not join group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={joinGroup}
      disabled={loading}
      style={{
        background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
        border: 'none',
        borderRadius: 12,
        padding: '12px',
        color: 'white',
        width: '100%',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 0 20px rgba(16,185,129,0.5)',
      }}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
      {loading ? 'Joining...' : 'Join Group'}
    </button>
  )
}