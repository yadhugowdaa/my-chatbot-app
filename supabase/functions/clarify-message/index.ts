// supabase/functions/clarify-message/index.ts
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // We don't need a Supabase client here since we're not touching the DB
    // and we trust the user is authenticated from the frontend.

    const { context, question } = await req.json()
    if (!context || !question) {
      throw new Error('Missing context or question in the request body.')
    }

    const n8nWebhookUrl = Deno.env.get('N8N_CLARIFY_WEBHOOK_URL')!
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, question }),
    })

    if (!n8nResponse.ok) {
      throw new Error(`The n8n clarification workflow failed: ${await n8nResponse.text()}`)
    }
    
    const botResponse = await n8nResponse.json()

    return new Response(JSON.stringify(botResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in clarify-message function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})