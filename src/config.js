// API address. Production: "/api" on the app's own site, which Netlify forwards to the API server (public/_redirects).
// Same site = the login cookie is first-party, so every browser keeps it (Safari, incognito and browsers that block
// third-party cookies would otherwise drop it and show "Session expired" right after login).
// VITE_API_BASE_URL overrides it (see .env.example); development falls back to the local API.
const DEV_API = 'https://localhost:7295/api'
const PROD_API = '/api'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEV_API : PROD_API)
