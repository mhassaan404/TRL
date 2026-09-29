// API address. Set VITE_API_BASE_URL per environment (e.g. in .env.production.local or the build server);
// see .env.example. The fallback is the local development API.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7295/api'
