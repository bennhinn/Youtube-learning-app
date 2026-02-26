'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as React from 'react' // for React.use
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function NewGroupGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // ✅ Unwrap the params Promise
  const { id } = React.use(params)

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to create goal')
      const data = await res.json()
      router.push(`/groups/${id}/goals/${data.goal.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', padding: '52px 20px' }}>
      <Link href={`/groups/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back to Group
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Create Group Goal</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          placeholder="Goal name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '14px',
            color: 'white',
            fontSize: 15,
          }}
        />
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={4}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '14px',
            color: 'white',
            fontSize: 15,
            resize: 'vertical',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            background: loading ? 'rgba(168,85,247,0.5)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
            border: 'none',
            borderRadius: 14,
            padding: '14px',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? 'Creating...' : <><Sparkles size={18} /> Create Goal</>}
        </button>
      </form>
    </div>
  )
}