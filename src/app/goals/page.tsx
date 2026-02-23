import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import GoalsList from '@/components/GoalsList'
import BottomNavClient from '@/components/BottomNavClient'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      <div style={{
        background: '#080b12',
        minHeight: '100vh',
        color: 'white',
        fontFamily: "'Syne', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#a855f7', top: -80, left: -60, opacity: 0.12, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: '#06b6d4', top: 200, right: -50, opacity: 0.10, filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '60px 20px 100px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                Learning
              </p>
              <h1 style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Your Goals
              </h1>
            </div>
            <Link
              href="/goals/new"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                borderRadius: 30,
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'white',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 0 24px rgba(168,85,247,0.45)',
              }}
            >
              <Plus size={16} /> New
            </Link>
          </div>

          {/* Goals list with tabs — client component */}
          <GoalsList goals={goals ?? []} />
        </div>

        <BottomNavClient />
      </div>
    </>
  )
}