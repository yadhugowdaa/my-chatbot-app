// supabase/functions/clarify-message/index.ts
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { context, question } = await req.json()
    if (!context || !question) {
      throw new Error('Missing context or question.')
    }

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterKey) {
      throw new Error('OpenRouter API key is not set in Supabase secrets.')
    }

    // Call the OpenRouter AI directly
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [
          { "role": "system", "content": "You are a clarification assistant. A user will provide an original text and a question about it. Your task is to answer the question based ONLY on the context of the original text. Be concise and helpful." },
          { "role": "user", "content": `Original Text: "${context}"\n\nMy Question: "${question}"` }
        ]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenRouter API call failed: ${errorBody}`)
    }

    const aiResponse = await response.json()
    const reply = aiResponse.choices[0].message.content

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in clarify-message function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})