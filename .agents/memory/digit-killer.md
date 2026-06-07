---
name: Digit Killer project
description: Key decisions and quirks for the Digit Killer trading dashboard
---

## User Storage Path
Users are stored in `artifacts/api-server/data/users.json`.
The route uses `path.join(process.cwd(), "artifacts", "api-server", "data")`.
`process.cwd()` is always the workspace root in both dev (`pnpm --filter run dev`) and production (`node artifacts/api-server/dist/index.mjs`).
**Why:** An earlier version used `path.join(process.cwd(), "data")` which resolved to `/home/runner/workspace/data` — different from the actual committed file location — causing users to silently disappear on restart.

## Session Storage
Session key is `dk_session_v2`. Stored as `{ session, ts }` in `sessionStorage`.
14-hour expiry checked on load in `auth-context.tsx`. Old sessions are cleared silently.
**Why:** sessionStorage clears on tab close, ts prevents stale long-lived sessions.

## Admin PIN
`AHMED2005` — checked in both `auth-context.tsx` (client) and `users.ts` (server via `x-admin-pin` header).

## WebSocket
Ping every 25s prevents Deriv server from dropping idle connections.
Always clean up `onclose`/`onerror` handlers before calling `ws.close()` to prevent reconnect loops.

## New Pages (Standalone Market Selector)
Matches/Differs, Only Ups/Downs, Rise/Fall, High/Low Tick each have their OWN dark-green market selector panel (not the global layout header).
**Why:** These pages need independent market selection regardless of what the global market is set to.

## Wide Eye Digit Circles
- Size: `Math.max(46, Math.min(72, 50 + (pcts[i] - 10) * 2.8))`
- Rank colors: cyan=current, green=rank 0 (highest), blue=rank 1 (2nd highest), yellow=rank 8 (2nd lowest), red=rank 9 (lowest)
- NO frequency bars, NO rank dots — color of circle background communicates rank
- Legend uses 3×3 rounded circles, NOT horizontal lines

## Layout
- Desktop: collapsible sidebar via `collapsed` state (icon-only at 64px, full at 256px)
- Mobile: drawer via `mobileOpen` state, closes on route change via `useEffect([location])`
- Dark green market header: `background: linear-gradient(180deg,rgba(5,46,22,0.9),rgba(3,25,12,0.95))`, `borderColor: #166534`

## TypeScript
- `tick-generator.tsx` Signal type has `freqs?: number[]` (optional) — usage sites must null-guard with `sig.freqs && ...`
- Do not use non-CSS properties like `focusRingColor` in style objects — remove them
