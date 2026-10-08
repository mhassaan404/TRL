# The Ledger (TRL) – frontend

Rent and property management: buildings and units, tenants, leases, rent generation, invoices, payments,
late fees, extra charges, maintenance and WhatsApp reminders. One app serves several clients (companies); each
client's data lives in its own database, chosen by the API from the Client Code used at login.

React 18 + Vite, CoreUI 5 components. The API is the separate `TRL_API` repository.

## Run

```
npm install
npm start          # development server (Vite)
npm run build      # production build into ./build
npm run lint
```

## Configuration

The API address is set at build time with `VITE_API_BASE_URL` (see `.env.example`), e.g. in `.env.local` for
development or `.env.production.local` / the build server for production. Without it the local development API
(`https://localhost:7295/api`) is used. Values in `VITE_` variables end up in the built JavaScript, so never put
secrets there.

## Notes

- Login: Client Code + Username + Password. Tokens are HttpOnly cookies set by the API; the browser stores only
  non-sensitive details (`localStorage.user`: username, role, client code and name) and the last client code used.
- Every page calls the API through `src/api/axios.js`, which sends cookies and renews the session on a 401.

Built on the CoreUI Free React Admin Template (MIT licence, see `LICENSE`).
