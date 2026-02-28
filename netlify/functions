// netlify/functions/zoho-token.js
// Server-side function to exchange Zoho auth code for access token
// Called from browser - no CORS issues since it's same domain

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'code and redirect_uri required' })
      };
    }

    // These come from Netlify Environment Variables (set in Netlify dashboard)
    const CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
    const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
    const REGION        = process.env.ZOHO_REGION || 'in';

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server not configured. Set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in Netlify environment variables.' })
      };
    }

    // Exchange code for token - server side, no CORS!
    const tokenUrl = `https://accounts.zoho.${REGION}/oauth/v2/token`;
    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirect_uri,
      code:          code
    });

    const response = await fetch(tokenUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString()
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error, description: data.error_description || '' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token:  data.access_token,
        refresh_token: data.refresh_token || '',
        expires_in:    data.expires_in    || 3600,
        token_type:    data.token_type    || 'Bearer',
        scope:         data.scope         || ''
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error: ' + err.message })
    };
  }
};
