import { createClient } from './supabase/client'

export async function logActivity(
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, any> = {}
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('activity_log').insert({
    user_id: user.id,
    action_type: action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  })
}