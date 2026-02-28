# 🎨 रंगीन नोट्स — Netlify Deploy Guide

## Project Structure
```
notepad-netlify/
├── netlify.toml                    ← Netlify config
├── netlify/functions/
│   └── zoho-token.js               ← Token exchange function
└── public/
    ├── index.html                  ← Main app
    ├── oauth_callback.html         ← OAuth callback
    ├── manifest.json               ← PWA manifest
    └── service-worker.js           ← Offline support
```

## Deploy Steps

### 1. Netlify pe Deploy karo
- netlify.com pe jaao → New site → Import from Git
- Ya drag & drop: notepad-netlify folder ko netlify.com/drop pe drag karo

### 2. Zoho API Console
- api-console.zoho.in → Add Client → **Server-based Applications**
- Redirect URI: `https://YOUR-SITE.netlify.app/oauth_callback.html`
- Client ID aur Client Secret copy karo

### 3. Netlify Environment Variables set karo
Netlify Dashboard → Site Settings → Environment Variables:
- `ZOHO_CLIENT_ID` = your client id
- `ZOHO_CLIENT_SECRET` = your client secret  
- `ZOHO_REGION` = in

### 4. Redeploy karo
Netlify Dashboard → Deploys → Trigger Deploy

### 5. App mein Client ID daalo aur Login karo ✅
