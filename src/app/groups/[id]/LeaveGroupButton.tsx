'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'

export default function LeaveGroupButton({ groupId }: { groupId: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const leaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to leave')
      router.refresh()
    } catch (err) {
      alert('Could not leave group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={leaveGroup}
      disabled={loading}
      style={{
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 20,
        padding: '4px 12px',
        fontSize: 12,
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
      Leave
    </button>
  )
}