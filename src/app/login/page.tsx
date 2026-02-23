'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router, supabase.auth])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #080b12;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          font-family: 'Syne', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 360px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 28px;
          padding: 40px 32px 36px;
          backdrop-filter: blur(20px);
        }

        /* Google button */
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 14px 20px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .google-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .google-btn:active {
          transform: translateY(0);
        }

        /* Feature pills */
        .feature-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 28px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
        }
        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>

      <div className="login-root">
        {/* Background orbs */}
        <div className="orb" style={{ width: 400, height: 400, background: '#a855f7', top: -120, left: -100, opacity: 0.13 }} />
        <div className="orb" style={{ width: 300, height: 300, background: '#06b6d4', bottom: -80, right: -80, opacity: 0.10 }} />
        <div className="orb" style={{ width: 200, height: 200, background: '#f59e0b', top: '40%', right: '10%', opacity: 0.07 }} />

        <div className="login-card">

          {/* Logo mark */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 0 32px rgba(168,85,247,0.4)',
            }}>
              {/* Book icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" width={26} height={26}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>

            {/* Wordmark */}
            <h1 style={{
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 60%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 6,
            }}>
              LearnTube
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.5 }}>
              Your personal YouTube learning companion
            </p>
          </div>

          {/* Feature list */}
          <div className="feature-row">
            {[
              { label: 'AI-curated learning paths from your subscriptions', color: '#a855f7' },
              { label: 'Track progress and take notes per video',            color: '#06b6d4' },
              { label: 'Build streaks and hit your learning goals',          color: '#f59e0b' },
            ].map(f => (
              <div key={f.label} className="feature-item">
                <div className="feature-dot" style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }} />
                {f.label}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />

          {/* Google sign-in */}
          <button className="google-btn" onClick={handleGoogleLogin}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
            By signing in you grant read-only access<br />to your YouTube subscriptions.
          </p>
        </div>
      </div>
    </>
  )
}