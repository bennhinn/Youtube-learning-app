import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // 303 See Other — browser follows redirect as GET regardless of original method.
  // 307 (Next.js default) would re-POST to /login which has no POST handler → 405.
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}