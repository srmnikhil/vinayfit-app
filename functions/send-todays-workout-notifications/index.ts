import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Get all sessions scheduled for today
  const today = new Date().toISOString().split('T')[0]
  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select('id, client_id, scheduled_date, status')
    .eq('scheduled_date', today)
    .eq('status', 'scheduled')

  if (error) {
    return new Response(`Error fetching sessions: ${error.message}`, { status: 500 })
  }

  // 2. For each session, get the client's Expo push token
  for (const session of sessions || []) {
    const { data: clientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('expo_push_token, full_name')
      .eq('id', session.client_id)
      .single()

    if (profileError || !clientProfile?.expo_push_token) {
      continue // skip if no token
    }

    // 3. Send push notification via Expo
    const expoPushToken = clientProfile.expo_push_token
    const notification = {
      to: expoPushToken,
      title: "Today's Workout Ready!",
      body: "Your workout for today is available. Let's get moving!",
      data: { sessionId: session.id }
    }

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([notification])
    })
  }

  return new Response('Push notifications sent!', { status: 200 })
}) 