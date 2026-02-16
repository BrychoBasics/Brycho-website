import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { password, imageData, buildName } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: userData } = await supabase.rpc('verify_password', {
      input_password: password
    })

    if (!userData || userData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = userData[0]
    
    // Create or get build
    let buildId = imageData.build_id
    if (buildName && !buildId) {
      const newBuildId = `build_${Date.now()}`
      const { error: buildError } = await supabase
        .from('builds')
        .insert([{ id: newBuildId, name: buildName, created_by: user.name }])
      
      if (buildError) throw buildError
      buildId = newBuildId
    }
    
    imageData.status = user.role === 'admin' ? 'published' : 'pending'
    imageData.submitted_by = user.name
    imageData.build_id = buildId

    const { error } = await supabase
      .from('images')
      .insert([imageData])

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})