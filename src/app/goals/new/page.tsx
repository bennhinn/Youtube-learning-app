'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Sparkles, Calendar, Tag, BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewGoalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    targetDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/goals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: formData.keywords }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to generate')
      }

      const { videos } = await res.json()

      localStorage.setItem('previewVideos', JSON.stringify(videos))
      localStorage.setItem('goalName', formData.name)
      localStorage.setItem('goalKeywords', formData.keywords)
      localStorage.setItem('goalTargetDate', formData.targetDate)

      router.push('/goals/new/preview')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate learning path. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isReady = formData.name.trim() && formData.keywords.trim()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 16px 14px 44px;
          color: white;
          font-size: 14px;
          font-family: 'Syne', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.25); }
        .field-input:focus {
          border-color: rgba(168,85,247,0.5);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.3);
          cursor: pointer;
        }
        .generate-btn {
          width: 100%;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 16px;
          padding: 16px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          box-shadow: 0 0 32px rgba(168,85,247,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .generate-btn:not(:disabled):active {
          transform: scale(0.98);
        }
        .loading-dots::after {
          content: '';
          animation: dots 1.2s steps(4, end) infinite;
        }
        @keyframes dots {
          0%, 20%  { content: ''; }
          40%      { content: '.'; }
          60%      { content: '..'; }
          80%,100% { content: '...'; }
        }
      `}</style>

      <div style={{
        background: '#080b12',
        minHeight: '100vh',
        color: 'white',
        fontFamily: "'Syne', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}>
        {/* Orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -100, left: -80, opacity: 0.12, filter: 'blur(90px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -60, opacity: 0.09, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '56px 20px 48px' }}>

          {/* Back */}
          <Link href="/goals" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 }}>
            <ArrowLeft size={16} /> Back to Goals
          </Link>

          {/* Title */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.7)', fontWeight: 600 }}>
              AI-Powered
            </p>
            <h1 style={{ margin: '4px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              New Learning Goal
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Tell us what you want to learn and we'll build a custom YouTube curriculum for you.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Goal name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Goal Name
              </label>
              <div style={{ position: 'relative' }}>
                <BookOpen size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(168,85,247,0.6)' }} />
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="field-input"
                  placeholder="e.g., Learn Python for Data Science"
                />
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Keywords / Topics
              </label>
              <div style={{ position: 'relative' }}>
                <Tag size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(6,182,212,0.6)' }} />
                <input
                  type="text"
                  id="keywords"
                  required
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="field-input"
                  placeholder="python, pandas, numpy, data visualization"
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.28)', paddingLeft: 4 }}>
                Separate keywords with commas
              </p>

              {/* Keyword pills preview */}
              {formData.keywords && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {formData.keywords.split(',').map(k => k.trim()).filter(Boolean).map((kw, i) => (
                    <span key={i} style={{
                      background: 'rgba(6,182,212,0.1)',
                      border: '1px solid rgba(6,182,212,0.25)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      fontSize: 11,
                      color: '#06b6d4',
                      fontWeight: 600,
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Target date */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Target Date <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,158,11,0.6)' }} />
                <input
                  type="date"
                  id="targetDate"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isReady}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <span>Generating your path<span className="loading-dots" /></span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Learning Path
                </>
              )}
            </button>

            {!isReady && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '-8px 0 0' }}>
                Fill in goal name and keywords to continue
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  )
}