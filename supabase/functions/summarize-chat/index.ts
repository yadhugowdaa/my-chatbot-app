// supabase/functions/summarize-chat/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chat_id } = await req.json()
    if (!chat_id) {
      throw new Error('Missing chat_id in request body.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('sender, content')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    const transcript = messages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')

    const n8nWebhookUrl = Deno.env.get('N8N_SUMMARY_WEBHOOK_URL')!
    if (!n8nWebhookUrl) {
      throw new Error('N8N_SUMMARY_WEBHOOK_URL is not set.')
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text()
      throw new Error(`The n8n summary workflow failed: ${errorBody}`)
    }

    const { summary } = await n8nResponse.json()

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // THIS BLOCK IS MODIFIED FOR BETTER DEBUGGING
    console.error('Detailed error in summarize-chat:', error)
    return new Response(JSON.stringify({ 
      error: 'An error occurred in the summarize-chat function.',
      details: error.message,
      stack: error.stack // Send the full error stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Use 500 for a server error
    })
  }
})