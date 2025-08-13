// supabase/functions/delete-chat/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chat_id } = await req.json()
    if (!chat_id) throw new Error('Missing chat_id')

    // Create a client with the user's auth token to enforce RLS
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // The RLS policy on the `chats` table will ensure
    // the user can only delete chats that they own.
    const { error } = await supabaseClient
      .from('chats')
      .delete()
      .eq('id', chat_id)
      
    if (error) throw error

    return new Response(JSON.stringify({ message: 'Chat deleted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})