'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Sparkles, Calendar, Tag, BookOpen, ArrowLeft, Shield, Plus, X, ChevronDown, ChevronUp, Search } from 'lucide-react'
import Link from 'next/link'

interface TrustedChannel {
  id: string
  channel_id: string
  channel_title: string
}

export default function NewGoalPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [loading,         setLoading]         = useState(false)
  const [formData,        setFormData]        = useState({ name: '', keywords: '', targetDate: '' })
  const [trustedChannels, setTrustedChannels] = useState<TrustedChannel[]>([])
  const [showTrusted,     setShowTrusted]     = useState(false)
  const [channelSearch,   setChannelSearch]   = useState('')
  const [searchResults,   setSearchResults]   = useState<{ channel_id: string; channel_title: string }[]>([])
  const [searching,       setSearching]       = useState(false)
  const [adding,          setAdding]          = useState<string | null>(null)

  // Load trusted channels
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('trusted_channels')
        .select('id, channel_id, channel_title')
        .eq('user_id', user.id)
        .then(({ data }) => setTrustedChannels(data || []))
    })
  }, [])

  // Search YouTube for channels to add
  const searchChannels = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/channels/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.channels || [])
    } finally {
      setSearching(false)
    }
  }

  const addTrustedChannel = async (channel: { channel_id: string; channel_title: string }) => {
    setAdding(channel.channel_id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('trusted_channels')
      .insert({ user_id: user.id, channel_id: channel.channel_id, channel_title: channel.channel_title })
      .select()
      .single()
    if (!error && data) {
      setTrustedChannels(prev => [...prev, data])
      setSearchResults(prev => prev.filter(r => r.channel_id !== channel.channel_id))
    }
    setAdding(null)
  }

  const removeTrustedChannel = async (id: string) => {
    await supabase.from('trusted_channels').delete().eq('id', id)
    setTrustedChannels(prev => prev.filter(c => c.id !== id))
  }

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
      localStorage.setItem('previewVideos',   JSON.stringify(videos))
      localStorage.setItem('goalName',        formData.name)
      localStorage.setItem('goalKeywords',    formData.keywords)
      localStorage.setItem('goalTargetDate',  formData.targetDate)
      router.push('/goals/new/preview')
    } catch (error: any) {
      alert(error.message || 'Failed to generate learning path.')
    } finally {
      setLoading(false)
    }
  }

  const isReady = formData.name.trim() && formData.keywords.trim()
  const keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        .field-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          padding: 14px 16px 14px 44px; color: white; font-size: 14px;
          font-family: 'Syne', sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.25); }
        .field-input:focus {
          border-color: rgba(168,85,247,0.5);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
        }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.3); cursor: pointer; }

        .generate-btn {
          width: 100%; background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none; border-radius: 16px; padding: 16px; color: white;
          font-size: 15px; font-weight: 700; font-family: 'Syne', sans-serif;
          cursor: pointer; box-shadow: 0 0 32px rgba(168,85,247,0.4);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .generate-btn:hover:not(:disabled) { box-shadow: 0 0 40px rgba(168,85,247,0.6); transform: translateY(-1px); }
        .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .generate-btn:not(:disabled):active { transform: scale(0.98); }

        .trusted-toggle {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
          padding: 13px 16px; color: white; font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8; justify-content: space-between;
          transition: background 0.15s, border-color 0.15s;
        }
        .trusted-toggle:hover { background: rgba(255,255,255,0.05); border-color: rgba(168,85,247,0.2); }

        .channel-tag {
          display: flex; align-items: center; gap: 6px;
          background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2);
          border-radius: 20px; padding: 5px 10px 5px 12px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8);
          font-family: 'Syne', sans-serif;
        }
        .channel-tag-seed {
          background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.2);
          color: rgba(255,255,255,0.7);
        }
        .remove-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: rgba(255,255,255,0.3); display: flex; align-items: center;
          transition: color 0.15s;
        }
        .remove-btn:hover { color: #ef4444; }

        .search-result-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 12px; border-radius: 10px; transition: background 0.15s; gap: 8px;
        }
        .search-result-row:hover { background: rgba(255,255,255,0.05); }

        .add-btn {
          background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3);
          border-radius: 8px; padding: 5px 10px; color: #a855f7;
          font-size: 11px; font-weight: 700; font-family: 'Syne', sans-serif;
          cursor: pointer; display: flex; align-items: center; gap: 4;
          transition: background 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .add-btn:hover { background: rgba(168,85,247,0.25); }

        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .loading-dots::after { content: ''; animation: dots 1.2s steps(4,end) infinite; }
        @keyframes dots { 0%,20%{content:''} 40%{content:'.'} 60%{content:'..'} 80%,100%{content:'...'} }
        .kw-pill { animation: fadeUp 0.2s ease both; }
      `}</style>

      <div style={{ background: '#080b12', minHeight: '100vh', color: 'white', fontFamily: "'Syne', sans-serif", position: 'relative', overflowX: 'hidden' }}>

        {/* Orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: '#a855f7', top: -100, left: -80, opacity: 0.12, filter: 'blur(90px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -60, opacity: 0.09, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '56px 20px 60px' }}>

          {/* Back */}
          <Link href="/goals" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 }}>
            <ArrowLeft size={16} /> Back to Goals
          </Link>

          {/* Title */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.7)', fontWeight: 600 }}>AI-Powered</p>
            <h1 style={{ margin: '4px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>New Learning Goal</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Tell us what you want to learn and we'll build a custom YouTube curriculum for you.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Goal name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Goal Name</label>
              <div style={{ position: 'relative' }}>
                <BookOpen size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(168,85,247,0.6)' }} />
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field-input" placeholder="e.g., Learn Python for Data Science" />
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Keywords / Topics</label>
              <div style={{ position: 'relative' }}>
                <Tag size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(6,182,212,0.6)' }} />
                <input type="text" required value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })} className="field-input" placeholder="python, pandas, numpy, data visualization" />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.28)', paddingLeft: 4 }}>Separate keywords with commas — each gets its own search</p>
              {keywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {keywords.map((kw, i) => (
                    <span key={i} className="kw-pill" style={{ animationDelay: `${i * 0.04}s`, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#06b6d4', fontWeight: 600 }}>
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
                <input type="date" value={formData.targetDate} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} className="field-input" />
              </div>
            </div>

            {/* ── Trusted Channels ── */}
            <div>
              <button type="button" className="trusted-toggle" onClick={() => setShowTrusted(v => !v)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={13} color="#f59e0b" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>Trusted Channels</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace" }}>
                      {trustedChannels.length} channel{trustedChannels.length !== 1 ? 's' : ''} · their videos rank higher in your results
                    </p>
                  </div>
                </div>
                {showTrusted ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
              </button>

              {showTrusted && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0 0 14px 14px', borderTop: 'none', padding: 14, animation: 'fadeUp 0.2s ease forwards' }}>

                  {/* Current trusted channels */}
                  {trustedChannels.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                      {trustedChannels.map(ch => (
                        <div key={ch.id} className="channel-tag">
                          {ch.channel_title}
                          <button className="remove-btn" onClick={() => removeTrustedChannel(ch.id)}>
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search to add more */}
                  <div>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        value={channelSearch}
                        onChange={e => { setChannelSearch(e.target.value); searchChannels(e.target.value) }}
                        placeholder="Search for a channel to add…"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px 9px 32px', color: 'white', fontSize: 12, fontFamily: "'Syne',sans-serif", outline: 'none' }}
                      />
                      {searching && (
                        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                        {searchResults.slice(0, 5).map(ch => (
                          <div key={ch.channel_id} className="search-result-row">
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: "'Syne',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ch.channel_title}
                            </span>
                            <button
                              type="button"
                              className="add-btn"
                              disabled={adding === ch.channel_id || trustedChannels.some(t => t.channel_id === ch.channel_id)}
                              onClick={() => addTrustedChannel(ch)}
                            >
                              {adding === ch.channel_id
                                ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(168,85,247,0.3)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                : trustedChannels.some(t => t.channel_id === ch.channel_id)
                                ? '✓ Added'
                                : <><Plus size={10} /> Add</>
                              }
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    
                  </div>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            {/* Submit */}
            <button type="submit" disabled={loading || !isReady} className="generate-btn">
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  <span>Generating your path<span className="loading-dots" /></span>
                </>
              ) : (
                <><Sparkles size={18} /> Generate Learning Path</>
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