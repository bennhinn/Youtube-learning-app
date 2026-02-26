'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as React from 'react'
import { ArrowLeft, Sparkles, Target, FileText } from 'lucide-react'

export default function NewGroupGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)

  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ name: '', description: '' })
  const [focused, setFocused] = useState<string | null>(null)

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

  const isReady = form.name.trim().length > 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .ngg-root { background: #080b12; min-height: 100vh; color: white; font-family: 'Syne', sans-serif; max-width: 390px; margin: 0 auto; }
        .field-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px; padding: 14px 14px 14px 44px;
          color: white; font-size: 14px; font-family: 'Syne', sans-serif;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          resize: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus {
          border-color: rgba(168,85,247,0.5);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.08);
        }
        .field-textarea {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px; padding: 14px 14px 14px 44px;
          color: white; font-size: 14px; font-family: 'Syne', sans-serif;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          resize: none; min-height: 110px; line-height: 1.6;
        }
        .field-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .field-textarea:focus {
          border-color: rgba(168,85,247,0.5);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.08);
        }
        .submit-btn {
          width: 100%; border: none; border-radius: 16px;
          padding: 15px; color: white; font-size: 15px; font-weight: 700;
          font-family: 'Syne', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; cursor: pointer;
        }
        .submit-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(168,85,247,0.45); }
        .submit-btn:not(:disabled):active { transform: translateY(0); }
        .back-link { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.4); font-size: 13px; font-family: 'Syne', sans-serif; transition: color 0.15s; text-decoration: none; }
        .back-link:hover { color: rgba(255,255,255,0.7); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .ani   { animation: fadeUp 0.3s ease forwards; }
        .ani-2 { animation: fadeUp 0.3s ease 0.08s both; }
        .ani-3 { animation: fadeUp 0.3s ease 0.16s both; }
      `}</style>

      <div className="ngg-root">
        {/* Ambient blobs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.1, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: '#06b6d4', bottom: 120, right: -40, opacity: 0.08, filter: 'blur(70px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '56px 20px 40px' }}>
          {/* Back */}
          <Link href={`/groups/${id}`} className="back-link" style={{ marginBottom: 28, display: 'inline-flex' }}>
            <ArrowLeft size={15} /> Back to Group
          </Link>

          {/* Hero */}
          <div className="ani" style={{ marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(124,58,237,0.2))', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 0 24px rgba(168,85,247,0.2)' }}>
              <Target size={24} color="#a855f7" />
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              New Group Goal
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Set a shared learning objective for your group to work towards together.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Goal name field */}
            <div className="ani-2">
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7, fontFamily: "'Syne',sans-serif" }}>
                Goal Name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focused === 'name' ? '#a855f7' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s', pointerEvents: 'none' }}>
                  <Target size={16} />
                </div>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Master React in 30 days"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  required
                />
              </div>
              {/* Character hint */}
              <p style={{ margin: '5px 0 0', fontSize: 10, color: form.name.length > 60 ? '#ef4444' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace", textAlign: 'right' }}>
                {form.name.length}/80
              </p>
            </div>

            {/* Description field */}
            <div className="ani-3">
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7, fontFamily: "'Syne',sans-serif" }}>
                Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.2)' }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 13, top: 15, color: focused === 'desc' ? '#a855f7' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s', pointerEvents: 'none' }}>
                  <FileText size={16} />
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="What will the group learn? What's the outcome?"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  onFocus={() => setFocused('desc')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Preview pill */}
            {isReady && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: '10px 14px', animation: 'fadeUp 0.2s ease forwards' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Target size={13} color="#a855f7" />
                </div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontFamily: "'Syne',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.name}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !isReady}
              style={{
                marginTop: 8,
                background: loading || !isReady
                  ? 'rgba(168,85,247,0.2)'
                  : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                boxShadow: isReady && !loading ? '0 0 24px rgba(168,85,247,0.35)' : 'none',
                cursor: loading || !isReady ? 'not-allowed' : 'pointer',
                opacity: !isReady ? 0.5 : 1,
              }}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating…</>
                : <><Sparkles size={16} /> Create Goal</>
              }
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}