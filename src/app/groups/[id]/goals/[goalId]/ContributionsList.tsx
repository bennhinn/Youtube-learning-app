'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Play, X, Lightbulb, Flame, MessageCircle,
  CheckCircle, Eye, Send, Trash2, Reply
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type ReactionType = 'insightful' | 'must_watch' | 'discuss' | 'watched'

interface Reaction { reaction_type: ReactionType; user_id: string }
interface Watch    { user_id: string; user?: any }
interface Comment  {
  id: number; contribution_id: number; user_id: string
  parent_id: number | null; content: string; created_at: string; user: any
}
interface Contribution {
  id: string | number; contributed_at: string; user: any; video: any
  reactions?: Reaction[]; watches?: Watch[]; comments?: Comment[]
}
interface ContributionsListProps {
  contributions: Contribution[]
  groupId: number; goalId: number; currentUserId: string; totalMembers: number
}
interface ActiveVideo {
  id: string; title: string; channelTitle?: string; contId: string | number
}

// ── Reaction config ────────────────────────────────────────────────────────

const REACTIONS: { type: ReactionType; icon: React.ReactNode; activeIcon: React.ReactNode; label: string; color: string }[] = [
  { type: 'insightful', icon: <Lightbulb size={14} />, activeIcon: <Lightbulb size={14} fill="currentColor" />, label: 'Insightful', color: '#f59e0b' },
  { type: 'must_watch', icon: <Flame size={14} />,     activeIcon: <Flame size={14} fill="currentColor" />,     label: 'Must Watch', color: '#ef4444' },
  { type: 'discuss',    icon: <MessageCircle size={14} />, activeIcon: <MessageCircle size={14} fill="currentColor" />, label: 'Discuss', color: '#a855f7' },
  { type: 'watched',    icon: <CheckCircle size={14} />,   activeIcon: <CheckCircle size={14} fill="currentColor" />,   label: 'Watched',  color: '#10b981' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function aggReactions(reactions: Reaction[]) {
  const map: Record<ReactionType, string[]> = { insightful: [], must_watch: [], discuss: [], watched: [] }
  for (const r of reactions) map[r.reaction_type]?.push(r.user_id)
  return map
}

function Avatar({ profile, size = 22 }: { profile: any; size?: number }) {
  const name = profile?.display_name || profile?.email?.split('@')[0] || '?'
  if (profile?.avatar_url)
    return <img src={profile.avatar_url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '1.5px solid #0a0a0a', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0, border: '1.5px solid #0a0a0a' }}>
      {name[0].toUpperCase()}
    </div>
  )
}

// ── Comment thread ─────────────────────────────────────────────────────────

function CommentThread({ comments, currentUserId, onAdd, onDelete, contributionId, groupId, goalId }: {
  comments: Comment[]; currentUserId: string
  onAdd: (c: Comment) => void; onDelete: (id: number) => void
  contributionId: string | number; groupId: number; goalId: number
}) {
  const [text,    setText]    = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const topLevel = comments.filter(c => !c.parent_id)
  const byParent = comments.filter(c => c.parent_id).reduce<Record<number, Comment[]>>((acc, c) => {
    if (!acc[c.parent_id!]) acc[c.parent_id!] = []
    acc[c.parent_id!].push(c)
    return acc
  }, {})

  const startReply = (c: Comment) => {
    const p = Array.isArray(c.user) ? c.user[0] : c.user
    setReplyTo({ id: c.id, name: p?.display_name || p?.email?.split('@')[0] || 'Someone' })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(
        `/api/groups/${groupId}/goals/${goalId}/contributions/${contributionId}/comments`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text.trim(), parent_id: replyTo?.id || null }) }
      )
      const data = await res.json()
      if (res.ok && data.comment) { onAdd(data.comment); setText(''); setReplyTo(null) }
    } finally { setSending(false) }
  }

  const del = async (id: number) => {
    await fetch(`/api/groups/${groupId}/goals/${goalId}/contributions/${contributionId}/comments`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_id: id }) })
    onDelete(id)
  }

  const renderComment = (c: Comment, isReply = false): React.ReactNode => {
    const p = Array.isArray(c.user) ? c.user[0] : c.user
    const name = p?.display_name || p?.email?.split('@')[0] || 'Someone'
    return (
      <div key={c.id} style={{ marginLeft: isReply ? 32 : 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}><Avatar profile={p} size={26} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px 14px 14px 14px', padding: '9px 13px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: "'Syne',sans-serif" }}>{name}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, fontFamily: "'Syne',sans-serif", wordBreak: 'break-word' }}>{c.content}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 5, paddingLeft: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>{timeAgo(c.created_at)}</span>
              {!isReply && (
                <button onClick={() => startReply(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'Syne',sans-serif", padding: 0 }}>
                  <Reply size={10} /> Reply
                </button>
              )}
              {c.user_id === currentUserId && (
                <button onClick={() => del(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', padding: 0 }}>
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
        {(byParent[c.id] || []).map(r => renderComment(r, true))}
      </div>
    )
  }

  return (
    <div>
      {topLevel.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {topLevel.map(c => renderComment(c))}
        </div>
      )}
      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '8px 12px' }}>
          {replyTo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: '#a855f7', fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>Replying to {replyTo.name}</span>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}><X size={10} /></button>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Add a comment…'}
            rows={1}
            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 13, fontFamily: "'Syne',sans-serif", resize: 'none', lineHeight: 1.5 }}
          />
        </div>
        <button
          onClick={submit}
          disabled={!text.trim() || sending}
          style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: text.trim() ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(255,255,255,0.06)',
            border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: text.trim() ? '0 0 14px rgba(168,85,247,0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Send size={14} color={text.trim() ? 'white' : 'rgba(255,255,255,0.2)'} />
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ContributionsList({ contributions: initial, groupId, goalId, currentUserId, totalMembers }: ContributionsListProps) {
  const [contributions, setContributions] = useState(initial)
  const [activeVideo,   setActiveVideo]   = useState<ActiveVideo | null>(null)
  const [mounted,       setMounted]       = useState(false)
  const [pendingRx,     setPendingRx]     = useState<Record<string, boolean>>({})
  const [pendingW,      setPendingW]      = useState<Record<string, boolean>>({})

  useEffect(() => setMounted(true), [])

  const toggleReaction = async (contId: string | number, type: ReactionType) => {
    const key = `${contId}:${type}`
    if (pendingRx[key]) return
    setPendingRx(p => ({ ...p, [key]: true }))
    const toggle = (prev: Contribution[]) => prev.map(c => {
      if (c.id !== contId) return c
      const rx = c.reactions || []
      const has = rx.some(r => r.reaction_type === type && r.user_id === currentUserId)
      return { ...c, reactions: has ? rx.filter(r => !(r.reaction_type === type && r.user_id === currentUserId)) : [...rx, { reaction_type: type, user_id: currentUserId }] }
    })
    setContributions(toggle)
    try {
      const res = await fetch(`/api/groups/${groupId}/goals/${goalId}/contributions/${contId}/reactions`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reaction_type: type }) })
      if (!res.ok) throw new Error()
    } catch { setContributions(toggle) }
    finally { setPendingRx(p => { const n = { ...p }; delete n[key]; return n }) }
  }

  const toggleWatch = async (contId: string | number) => {
    const key = String(contId)
    if (pendingW[key]) return
    setPendingW(p => ({ ...p, [key]: true }))
    const toggle = (prev: Contribution[]) => prev.map(c => {
      if (c.id !== contId) return c
      const ws = c.watches || []
      const has = ws.some(w => w.user_id === currentUserId)
      return { ...c, watches: has ? ws.filter(w => w.user_id !== currentUserId) : [...ws, { user_id: currentUserId, user: null }] }
    })
    setContributions(toggle)
    try {
      const res = await fetch(`/api/groups/${groupId}/goals/${goalId}/contributions/${contId}/watches`, { method: 'POST' })
      if (!res.ok) throw new Error()
    } catch { setContributions(toggle) }
    finally { setPendingW(p => { const n = { ...p }; delete n[key]; return n }) }
  }

  const addComment    = (contId: string | number, c: Comment) =>
    setContributions(prev => prev.map(x => x.id !== contId ? x : { ...x, comments: [...(x.comments || []), c] }))
  const deleteComment = (contId: string | number, id: number) =>
    setContributions(prev => prev.map(x => x.id !== contId ? x : { ...x, comments: (x.comments || []).filter(c => c.id !== id && c.parent_id !== id) }))

  // Active contribution for modal
  const activeCont  = contributions.find(c => c.id === activeVideo?.contId)
  const reactionMap = activeCont ? aggReactions(activeCont.reactions || []) : null
  const iWatched    = activeCont ? (activeCont.watches || []).some(w => w.user_id === currentUserId) : false

  return (
    <>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .vm-card { animation: modalIn 0.2s ease forwards; }
        .contrib-row:hover { background: rgba(255,255,255,0.03) !important; }
        .rx-pill:hover { transform: scale(1.06); }
        .watch-btn-modal:hover { background: rgba(16,185,129,0.18) !important; }
      `}</style>

      {/* ── Contribution cards — minimal ── */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
        {contributions.map((cont, i) => {
          const profile = Array.isArray(cont.user)  ? cont.user[0]  : cont.user
          const video   = Array.isArray(cont.video) ? cont.video[0] : cont.video
          const name    = profile?.display_name || profile?.email?.split('@')[0] || 'Someone'
          const watches = cont.watches || []
          const watchCount = watches.length
          const iWatchedCard = watches.some(w => w.user_id === currentUserId)
          const watchPct = totalMembers > 0 ? Math.round((watchCount / totalMembers) * 100) : 0
          const watcherProfiles = watches.filter(w => w.user).slice(0, 4).map(w => Array.isArray(w.user) ? w.user[0] : w.user)
          const commentCount = (cont.comments || []).length
          const reactionCount = (cont.reactions || []).length

          return (
            <div key={cont.id}>
              {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />}

              {/* Clickable row → opens modal */}
              <div
                className="contrib-row"
                onClick={() => video?.youtube_video_id && setActiveVideo({ id: video.youtube_video_id, title: video.title, channelTitle: video.channel_title, contId: cont.id })}
                style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                {/* Thumbnail */}
                {video?.thumbnail_url ? (
                  <div style={{ width: 86, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={16} color="white" fill="white" />
                    </div>
                  </div>
                ) : (
                  <div style={{ width: 86, height: 52, borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Play size={18} color="#a855f7" />
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{video?.title || 'Video'}</p>
                  {video?.channel_title && <p style={{ margin: '0 0 5px', fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.channel_title}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar profile={profile} size={15} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace" }}>{name} · {timeAgo(cont.contributed_at)}</span>
                  </div>
                </div>
              </div>

              {/* Watch progress bar */}
              <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar stack */}
                <div style={{ display: 'flex' }}>
                  {watcherProfiles.length > 0 ? watcherProfiles.map((p, idx) => (
                    <div key={idx} style={{ marginLeft: idx > 0 ? -7 : 0 }}><Avatar profile={p} size={20} /></div>
                  )) : (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={9} color="rgba(255,255,255,0.2)" />
                    </div>
                  )}
                  {watchCount > 4 && (
                    <div style={{ marginLeft: -7, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                      +{watchCount - 4}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>{watchCount}/{totalMembers} watched</span>
                    <span style={{ fontSize: 10, color: watchPct >= 100 ? '#10b981' : 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace", fontWeight: watchPct >= 100 ? 700 : 400 }}>{watchPct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${watchPct}%`, background: watchPct >= 100 ? '#10b981' : 'linear-gradient(90deg,#a855f7,#06b6d4)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Stat pills */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {reactionCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '3px 8px' }}>
                      <Flame size={10} color="rgba(255,255,255,0.3)" />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>{reactionCount}</span>
                    </div>
                  )}
                  {commentCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '3px 8px' }}>
                      <MessageCircle size={10} color="rgba(255,255,255,0.3)" />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" }}>{commentCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Video modal — video sticky top, content scrolls below ── */}
      {mounted && activeVideo && activeCont && createPortal(
        <>
          {/* Backdrop */}
          <div onClick={() => setActiveVideo(null)} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)' }} />

          {/* Modal card */}
          <div
            className="vm-card"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', zIndex: 999,
              top: 52, left: 0, right: 0,
              margin: '0 auto',
              width: 'calc(100% - 32px)',
              maxWidth: 440,
              maxHeight: 'calc(100dvh - 120px)',
              background: '#0f1220',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: 20,
              boxShadow: '0 0 50px rgba(168,85,247,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* ── Video — sticky, never scrolls ── */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              </div>
            </div>

            {/* ── Scrollable content below video ── */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <div style={{ padding: '14px 16px 24px' }}>

                {/* Title + close */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.3, fontFamily: "'Syne',sans-serif" }}>{activeVideo.title}</p>
                    {activeVideo.channelTitle && <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono',monospace" }}>{activeVideo.channelTitle}</p>}
                  </div>
                  <button onClick={() => setActiveVideo(null)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={14} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {/* Mark as Watched */}
                <button
                  className="watch-btn-modal"
                  onClick={() => toggleWatch(activeCont.id)}
                  disabled={!!pendingW[String(activeCont.id)]}
                  style={{
                    width: '100%', marginBottom: 10,
                    background: iWatched ? 'rgba(16,185,129,0.12)' : 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.15))',
                    border: `1px solid ${iWatched ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.2)'}`,
                    borderRadius: 12, padding: '11px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: iWatched ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
                  }}
                >
                  <CheckCircle size={15} color={iWatched ? '#10b981' : 'rgba(16,185,129,0.7)'} fill={iWatched ? '#10b981' : 'none'} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: iWatched ? '#10b981' : 'rgba(16,185,129,0.75)', fontFamily: "'Syne',sans-serif" }}>
                    {iWatched ? '✓ Marked as Watched' : 'Mark as Watched'}
                  </span>
                </button>

                {/* Reactions */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                  {REACTIONS.map(r => {
                    const isMine = reactionMap![r.type].includes(currentUserId)
                    const count  = reactionMap![r.type].length
                    const key    = `${activeCont.id}:${r.type}`
                    return (
                      <button key={r.type} className="rx-pill"
                        onClick={() => toggleReaction(activeCont.id, r.type)}
                        disabled={!!pendingRx[key]}
                        style={{
                          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                          background: isMine ? `${r.color}18` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isMine ? `${r.color}45` : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 12, padding: '9px 4px',
                          cursor: 'pointer', transition: 'all 0.15s',
                          color: isMine ? r.color : 'rgba(255,255,255,0.35)',
                          boxShadow: isMine ? `0 0 12px ${r.color}20` : 'none',
                        }}
                      >
                        {isMine ? r.activeIcon : r.icon}
                        <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: isMine ? r.color : 'rgba(255,255,255,0.25)' }}>
                          {count > 0 ? count : r.label.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Divider + Comments header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MessageCircle size={14} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: "'Syne',sans-serif" }}>
                    {(activeCont.comments || []).length > 0 ? `${activeCont.comments!.length} Comment${activeCont.comments!.length !== 1 ? 's' : ''}` : 'Comments'}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Comment thread */}
                <CommentThread
                  comments={activeCont.comments || []}
                  currentUserId={currentUserId}
                  contributionId={activeCont.id}
                  groupId={groupId}
                  goalId={goalId}
                  onAdd={c => addComment(activeCont.id, c)}
                  onDelete={id => deleteComment(activeCont.id, id)}
                />
              </div>
            </div>
          </div>
        </>
      , document.body)}
    </>
  )
}