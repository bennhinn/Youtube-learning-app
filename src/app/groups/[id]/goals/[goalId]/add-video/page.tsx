import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BottomNavClient from '@/components/BottomNavClient'
import VideoPicker from '../VideoPicker'

export default async function AddVideoPage({ params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { id, goalId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const groupId = parseInt(id)
  const groupGoalId = parseInt(goalId)

  // Verify membership
  const { data: membership } = await adminClient
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect(`/groups/${groupId}`)

  // Get goal name for header
  const { data: goal } = await adminClient
    .from('group_goals')
    .select('name')
    .eq('id', groupGoalId)
    .single()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .add-video-root {
          background: #080b12;
          min-height: 100vh;
          color: white;
          font-family: 'Syne', sans-serif;
          max-width: 390px;
          margin: 0 auto;
          position: relative;
          overflow-x: hidden;
        }
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ani { animation: fadeUp 0.3s ease forwards; }
      `}</style>

      <div className="add-video-root">
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', maxWidth: 390 }}>
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: '#a855f7', top: -60, left: -60, opacity: 0.10, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#06b6d4', bottom: 100, right: -40, opacity: 0.08, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', height: '100vh', paddingBottom: 120 }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '52px 20px 16px',
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(8,11,18,0.88)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Link href={`/groups/${groupId}/goals/${groupGoalId}`} style={{ color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add a video</h1>
          </div>

          {/* Goal context */}
          <div style={{ padding: '20px 20px 8px' }} className="ani">
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              to <span style={{ color: '#a855f7', fontWeight: 600 }}>“{goal?.name}”</span>
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Choose from your subscribed channels' latest videos.
            </p>
          </div>

          {/* Video picker */}
          <div style={{ padding: '8px 20px 20px' }} className="ani">
            <VideoPicker groupId={groupId} goalId={groupGoalId} />
          </div>

        </div>
        <BottomNavClient />
      </div>
    </>
  )
}