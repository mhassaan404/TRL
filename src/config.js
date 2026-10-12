// API address. Set VITE_API_BASE_URL per environment (e.g. in .env.production.local or the build server);
// see .env.example. Only development falls back to the local API: a production build without it must not quietly
// talk to localhost (every request would fail on the users' machines), so it reports the problem instead.
const DEV_API = 'https://localhost:7295/api'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEV_API : '')

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL was not set when this app was built, so it cannot reach the API.')
}
