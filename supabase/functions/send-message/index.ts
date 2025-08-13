// supabase/functions/send-message/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This line is required for browser security (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth token.
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Check if the user is actually logged in.
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not authenticated.')

    // Get input from the request, now including chat_title
    const { chat_id, message, chat_title } = await req.json()
    if (!chat_id || !message) {
      throw new Error('Missing chat_id or message in the request body.')
    }

    // Save the user's message to the database first.
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert({ chat_id, content: message, sender: 'user' })

    if (insertError) throw insertError

    // Now, trigger the n8n workflow we built, passing the title along.
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')!
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Add chat_title to the body sent to n8n
      body: JSON.stringify({ chat_id, message, chat_title }),
    })

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text()
      console.error('n8n workflow failed:', errorBody)
      throw new Error('The n8n workflow failed to execute.')
    }
    
    const botResponse = await n8nResponse.json()

    // Return the bot's response back to the React app.
    return new Response(JSON.stringify(botResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})