'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Lock, Sparkles } from 'lucide-react'

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ Call the server API route — uses admin client, bypasses RLS
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          isPublic: formData.isPublic,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create group')

      router.push(`/groups/${data.groupId}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', padding: '52px 20px 100px', fontFamily: "'Syne', sans-serif" }}>
      <Link href="/groups" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', marginBottom: 20, textDecoration: 'none', fontSize: 13 }}>
        <ArrowLeft size={15} /> Back to Groups
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Create Group</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>Group Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none', fontFamily: "'Syne', sans-serif" }}
            placeholder="e.g., Python Learners"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>Description (optional)</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: 'white', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: "'Syne', sans-serif" }}
            placeholder="What's this group about?"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>Privacy</label>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="privacy" checked={formData.isPublic} onChange={() => setFormData({ ...formData, isPublic: true })} />
              <Globe size={16} color="#06b6d4" /> Public
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="privacy" checked={!formData.isPublic} onChange={() => setFormData({ ...formData, isPublic: false })} />
              <Lock size={16} color="#f59e0b" /> Private
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            background: loading ? 'rgba(168,85,247,0.5)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
            border: 'none', borderRadius: 14, padding: '14px',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 28px rgba(168,85,247,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {loading ? 'Creating...' : <><Sparkles size={18} /> Create Group</>}
        </button>
      </form>
    </div>
  )
}