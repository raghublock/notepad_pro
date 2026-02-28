// Cloudflare Worker — Zoho Token Exchange
// Deploy at: workers.cloudflare.com (FREE - 100k requests/day)

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS headers — allow your GitHub Pages domain
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  // Handle preflight
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
    const { code, redirect_uri } = body

    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: 'code aur redirect_uri chahiye' }), {
        status: 400, headers: corsHeaders
      })
    }

    // ENV vars — Cloudflare Dashboard mein set karo
    // CLIENT_ID, CLIENT_SECRET, REGION
    const CLIENT_ID     = ZOHO_CLIENT_ID      // set in CF dashboard
    const CLIENT_SECRET = ZOHO_CLIENT_SECRET  // set in CF dashboard
    const REGION        = ZOHO_REGION || 'in' // set in CF dashboard

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
      return new Response(JSON.stringify({ error: data.error, desc: data.error_description || '' }), {
        status: 400, headers: corsHeaders
      })
    }

    return new Response(JSON.stringify({
      access_token:  data.access_token,
      refresh_token: data.refresh_token || '',
      expires_in:    data.expires_in    || 3600,
      token_type:    data.token_type    || 'Bearer',
      scope:         data.scope         || ''
    }), { status: 200, headers: corsHeaders })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    })
  }
}
