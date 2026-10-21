// API address. Production: "/api" on the app's own site: the API server also serves this app (npm run build:server
// puts the build in TRL_API/wwwroot), so app and API share one address. Same site = the login cookie is first-party,
// so every browser keeps it (Safari, incognito and browsers that block third-party cookies would otherwise drop it
// and show "Session expired" right after login).
// VITE_API_BASE_URL overrides it (see .env.example); development falls back to the local API.
const DEV_API = 'https://localhost:7295/api'
const PROD_API = '/api'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEV_API : PROD_API)
