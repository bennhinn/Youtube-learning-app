'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function AddVideoButton({ groupId, goalId }: { groupId: number; goalId: number }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/groups/${groupId}/goals/${goalId}/add-video`)}
      style={{
        background: 'rgba(168,85,247,0.15)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 30,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        color: '#a855f7',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        transition: 'background 0.15s, transform 0.15s',
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <Plus size={16} /> Add Video
    </button>
  )
}