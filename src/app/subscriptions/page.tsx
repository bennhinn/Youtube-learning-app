import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Tv } from 'lucide-react'
import RefreshSubscriptionsButton from './RefreshButton'
import ChannelCard from './ChannelCard' // <-- new client component
import BottomNavClient from '@/components/BottomNavClient'

const GOAL_COLORS = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      subscribed_at,
      last_checked,
      channel:channel_id (
        youtube_channel_id,
        title,
        thumbnail_url,
        description
      )
    `)
    .eq('user_id', user.id)
    .order('subscribed_at', { ascending: false })

  if (subError) {
    console.error('Error fetching subscriptions:', subError)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('youtube_subscriptions_last_fetched')
    .eq('id', user.id)
    .single()

  const lastSynced = profile?.youtube_subscriptions_last_fetched
    ? (() => {
        const diff = Date.now() - new Date(profile.youtube_subscriptions_last_fetched).getTime()
        const hours = Math.floor(diff / 36e5)
        const mins = Math.floor(diff / 6e4)
        if (hours >= 24) return `${Math.floor(hours / 24)}d ago`
        if (hours >= 1) return `${hours}h ago`
        return `${mins}m ago`
      })()
    : 'Never'

  const channels = subscriptions
    ?.map((sub) => (Array.isArray(sub.channel) ? sub.channel[0] : sub.channel))
    .filter((c) => c && c.youtube_channel_id) || []

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .learntube * { box-sizing: border-box; }
        .learntube ::-webkit-scrollbar { display: none; }
        .learntube { scrollbar-width: none; }

        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }
        .back-btn {
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .back-btn:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.1) !important;
        }
        .sync-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .sync-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(168,85,247,0.7) !important;
        }
      `}</style>

      <div
        className="learntube"
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: '100vh',
          margin: '0 auto',
          background: '#080b12',
          fontFamily: "'Syne', sans-serif",
          position: 'relative',
          color: 'white',
          overflowX: 'hidden',
        }}
      >
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.12, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', top: 220, left: 200, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#f59e0b', top: 600, left: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        {/* Scrollable body */}
        <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', height: '100vh', paddingBottom: 100 }}>

          {/* Header */}
          <div style={{ padding: '52px 20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Link href="/dashboard" className="back-btn" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '8px 14px',
                color: 'rgba(255,255,255,0.65)', fontSize: 13,
                fontWeight: 600, textDecoration: 'none',
                fontFamily: "'Syne', sans-serif",
              }}>
                <ArrowLeft size={16} /> Back
              </Link>

              <RefreshSubscriptionsButton />
            </div>

            {/* Title area */}
            <div style={{ marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                Your library
              </p>
              <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Subscriptions
              </h1>
            </div>
          </div>

          {/* Stats + sync bar */}
          <div style={{ padding: '0 20px', marginBottom: 24 }}>
            <div className="card-glass" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tv size={18} color="#a855f7" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                    {channels.length}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                    channels · synced {lastSynced}
                  </p>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Connected</span>
              </div>
            </div>
          </div>

          {/* Grid of channels */}
          {channels.length > 0 ? (
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {channels.map((channel, i) => {
                  const color = GOAL_COLORS[i % GOAL_COLORS.length]
                  return (
                    <ChannelCard
                      key={channel.youtube_channel_id}
                      channel={channel}
                      color={color}
                    />
                  )
                })}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div style={{ padding: '0 20px' }}>
              <div className="card-glass" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tv size={28} color="#a855f7" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white' }}>No channels yet</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Sync your YouTube account to import all your subscriptions.
                  </p>
                </div>
                <div style={{ marginTop: 4 }}>
                  <RefreshSubscriptionsButton />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <BottomNavClient />
      </div>
    </>
  )
}