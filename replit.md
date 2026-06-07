# Digit Killer

AI-powered real-time trading analysis dashboard for Deriv synthetic markets by Ahmed Syntrader.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/digit-killer run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/digit-killer exec tsc -p tsconfig.json --noEmit` — typecheck frontend only
- Auth: admin PIN = AHMED2005 · users stored in `artifacts/api-server/data/users.json`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, wouter routing
- API: Express 5, esbuild (CJS bundle)
- WebSocket: Deriv Binary API — `wss://ws.binaryws.com/websockets/v3?app_id=1089`

## Where things live

- `artifacts/digit-killer/src/` — React frontend
  - `pages/` — all page components (19 total)
  - `components/layout.tsx` — sidebar + market header
  - `hooks/useDerivWebSocket.ts` — live WebSocket hook (with 25s ping)
  - `lib/auth-context.tsx` — authentication (14h session)
  - `lib/market-context.tsx` — global market selector state
- `artifacts/api-server/src/routes/users.ts` — user management API
- `artifacts/api-server/data/users.json` — persistent user IDs file

## Architecture decisions

- User IDs stored server-side in a JSON file (not localStorage/cloud). Admin creates them, users enter them to log in.
- Data path is always `path.join(process.cwd(), "artifacts", "api-server", "data")` — works from workspace root in both dev and production.
- Sessions stored in `sessionStorage` (not localStorage) under key `dk_session_v2` with a 14-hour timestamp expiry. Clearing on tab close + 14h reset prevents stale sessions.
- WebSocket sends a ping every 25 seconds to prevent Deriv server from dropping idle connections.
- All pages use the global market from `useMarket()` via the layout header, except pages that need independent market selection (Wide Eye, Matches/Differs, Only Ups/Downs, Rise/Fall, High/Low Tick) which have their own dark-green market selector panel.

## Product

- **Dashboard** — live market overview with key stats
- **Smart Trade** — AI-powered trade signals
- **Smart Signals** — pattern recognition signals
- **Wide Eye View** — digit frequency distribution with colored circle ranking (green=highest, blue=2nd, yellow=2nd-lowest, red=lowest)
- **Market Scanner** — multi-market scan
- **AI Signals** — automated signal generation
- **Tick Generator** — tick-by-tick trade analysis
- **Matches & Differs** — AI digit pattern detection (starvation, echo, burst)
- **Only Ups / Only Downs** — consecutive direction streak signals
- **Rise & Fall** — tick direction trend analysis
- **High / Low Tick** — EMA-3/5/9 + RSI-7 micro-momentum signals
- **Digit Analysis** — digit frequency charts
- **Trade Desk** — trade execution helper
- **Strategies** — strategy library
- **Forex · Gold/USD** — live XAU/USD price analysis
- **Risk Calculator** — position sizing calculator
- **AI Learning** — educational content
- **Settings** — admin user management (create/revoke/restore IDs)

## User preferences

- Branding: Ahmed Syntrader, ahmedsyntrader.site, 0768925411
- Dark futuristic theme with cyan (#00d1d1) primary accent
- Wide Eye digit circles: no frequency bars, circle background colors indicate rank
- Sidebar: collapsible on desktop (icon-only), drawer on mobile
- Market selector header: dark green theme on all pages

## Gotchas

- User IDs in the JSON file are case-normalized to UPPERCASE on storage and lookup.
- If the `data/` directory doesn't exist on first run, it's auto-created by `ensureDir()`.
- The layout sidebar toggle button only appears on desktop (`md:` breakpoint). Mobile uses the hamburger.
- `process.cwd()` is always the workspace root (`/home/runner/workspace`) in both dev and production.
- New pages (Matches/Differs, Only Ups/Downs, Rise/Fall, High/Low Tick) manage their own market state independently — they do NOT use the global market context from the layout header.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
