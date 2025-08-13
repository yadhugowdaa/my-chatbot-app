import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not authenticated.')
    const { chat_id, message, chat_title } = await req.json()
    if (!chat_id || !message) throw new Error('Missing chat_id or message.')
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert({ chat_id, content: message, sender: 'user' })
    if (insertError) throw insertError
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')!
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, message, chat_title }),
    })
    if (!n8nResponse.ok) throw new Error(`n8n workflow failed: ${await n8nResponse.text()}`)
    const botResponse = await n8nResponse.json()
    return new Response(JSON.stringify(botResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-message function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})