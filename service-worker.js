// Cloudflare Worker — Zoho Token Exchange
// https://notepad-pro.raghuveerbhati525.workers.dev

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405, headers: corsHeaders
    })
  }

  try {
    const body = await request.json()
    
    // Debug: log what we received
    const received = JSON.stringify({ keys: Object.keys(body), code_present: !!body.code, redirect_present: !!body.redirect_uri })
    
    const code = body.code
    const redirect_uri = body.redirect_uri

    if (!code) {
      return new Response(JSON.stringify({ 
        error: 'Zoho code missing',
        debug: received
      }), { status: 400, headers: corsHeaders })
    }

    if (!redirect_uri) {
      return new Response(JSON.stringify({ 
        error: 'redirect_uri missing',
        debug: received  
      }), { status: 400, headers: corsHeaders })
    }

    const CLIENT_ID     = ZOHO_CLIENT_ID
    const CLIENT_SECRET = ZOHO_CLIENT_SECRET
    const REGION        = ZOHO_REGION || 'in'

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response(JSON.stringify({ 
        error: 'Server not configured — set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REGION in Cloudflare dashboard'
      }), { status: 500, headers: corsHeaders })
    }

    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirect_uri,
      code:          code
    })

    const resp = await fetch(`https://accounts.zoho.${REGION}/oauth/v2/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString()
    })

    const data = await resp.json()

    if (data.error) {
      return new Response(JSON.stringify({ 
        error: data.error, 
        description: data.error_description || '',
        zoho_response: data
      }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({
      access_token:  data.access_token,
      refresh_token: data.refresh_token || '',
      expires_in:    data.expires_in    || 3600,
      token_type:    data.token_type    || 'Bearer',
      scope:         data.scope         || ''
    }), { status: 200, headers: corsHeaders })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Worker error: ' + err.message }), {
      status: 500, headers: corsHeaders
    })
  }
}
