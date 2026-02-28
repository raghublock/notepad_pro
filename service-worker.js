// Cloudflare Worker — Zoho Token Exchange
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let code, redirect_uri;
    const url = new URL(request.url);

    // GET और POST दोनों से डेटा लेने का जुगाड़
    if (request.method === 'POST') {
      const body = await request.json();
      code = body.code;
      redirect_uri = body.redirect_uri;
    } else {
      code = url.searchParams.get('code');
      // यहाँ अपनी Worker वाली URL डालें
      redirect_uri = "https://notepad.raghuveerbhati525.workers.dev/";
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Zoho code missing' }), {
        status: 400, headers: corsHeaders
      });
    }

    // Cloudflare Dashboard वाले Variables
    const CLIENT_ID = ZOHO_CLIENT_ID;
    const CLIENT_SECRET = ZOHO_CLIENT_SECRET;
    const REGION = typeof ZOHO_REGION !== 'undefined' ? ZOHO_REGION : 'in';

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirect_uri,
      code: code
    });

    const resp = await fetch(`https://accounts.zoho.${REGION}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await resp.json();
    return new Response(JSON.stringify(data), { 
      status: resp.status, 
      headers: corsHeaders 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}
