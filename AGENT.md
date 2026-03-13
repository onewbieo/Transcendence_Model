# AGENT.md

## Purpose
This guide is focused on **42 ft_transcendence v20 evaluation readiness** for this repo.

Current stack:
- Frontend: React + Vite (`ft_transcendence/frontend`) - the part people see and click in the browser.
- Backend: Fastify + TypeScript (`ft_transcendence/backend`) - the server "brain" that handles logic and data.
- ORM/DB: Prisma + PostgreSQL - Prisma is a helper that talks to PostgreSQL (the data storage).
- Realtime: WebSocket Pong (`/ws/game`) - both players see game updates instantly.
- Infra: Docker Compose + Nginx TLS proxy - Docker runs app parts in containers; Nginx is the front door; TLS means encrypted/secure traffic (HTTPS lock icon).

## Evaluated Module Baseline (from current implementation)
### Likely claimable now
- `Web (Major)`: framework for frontend + backend (React + Fastify).
- `Web (Minor)`: ORM (Prisma).
- `Web (Major)`: realtime features with WebSockets (`/ws/game`, reconnect/disconnect handling exists).
- `Web (Major)`: public API with API key + rate limiting + CRUD endpoints (`/public/items*`) and docs (`/api/docs`).
- `Web (Minor)`: notification system (claimed by project after CRUD verification in frontend/backend flows).
- `User Management (Minor)`: OAuth 2.0 (Google).
- `User Management (Major)`: advanced permissions (ADMIN/USER + admin CRUD endpoints).
- `User Management (Minor)`: 2FA.
- `Gaming UX (Major)`: web-based multiplayer game (Pong).
- `Gaming UX (Major)`: remote players + reconnect handling.

### Must verify before claiming
- `User Management (Minor)`: game statistics and match history.
  - Match history + leaderboard are present.
  - Requirement also mentions wins/losses/ranking/level and achievements/progression; verify scope accepted by your evaluators.

### Do not double-claim
- If claiming `Web (Major): framework frontend + backend`, do not also count the corresponding frontend/backend framework minors as additional points for the same work.

## Subject-Critical README Requirements
Your `README.md` should explicitly include:
- First line in italics exactly in required format with team logins.
- Team roles (PO, PM/Scrum, Tech Lead, Developers) and responsibilities.
- Project management workflow and communication channels.
- Technical stack and major technical justifications.
- Database schema description/diagram.
- Features list + who implemented each.
- Modules list, point calculation, implementation notes, and owners.
- Individual contributions breakdown.
- AI usage description (where/how AI was used).
- Clear `.env` setup and run steps.

## Run Modes
### Local HTTP development
Use this for fast coding on your own machine.
1. `cd ft_transcendence`
2. `docker compose up -d postgres`
3. `cd backend && npm run dev`
4. New shell: `cd ft_transcendence/frontend && npm run dev`

### Docker HTTPS mode
Use this for near-real deployment behavior (everything together, with HTTPS).
1. `cd ft_transcendence`
2. `docker compose up --build`

Entrypoints:
- `http://localhost:8080` -> redirect (automatically sends you to secure HTTPS URL)
- `https://localhost:8443` -> frontend + proxied `/api`, `/ws`, `/uploads` (single gateway that forwards traffic to correct service)

## Required Environment Variables
Environment variables are private settings (keys/URLs/secrets) loaded from `.env` files.
Backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `PUBLIC_API_KEY`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- Docker mode note: repo currently has `ft_transcendence/backend/env.docker` template; Docker compose reads `ft_transcendence/backend/.env.docker`.

Frontend:
- `VITE_API_BASE`
- `VITE_WS_BASE`
- `VITE_PUBLIC_API_KEY`

## Evidence Checklist For Evaluation
### Realtime and remote players
- Start two separate clients/users, join queue, verify:
  - `match:found`
  - live paddle/ball sync
  - reconnect after disconnect (within grace)
  - finish path and DB match persistence

### Public API module
- Show API key protection (`401` without key).
- Show rate limiting behavior.
- Demonstrate 5+ endpoints across GET/POST/PUT/DELETE on `/public/items`.
- Open docs page `/api/docs`.

### Permissions module
- Demonstrate admin-only endpoints (`/admin/users*`) blocked for non-admin.
- Show role-aware behavior in UI and API.

### User/security modules
- OAuth login flow end-to-end.
- 2FA setup -> enable -> verify -> disable.

### Mandatory general checks
- Chrome compatibility.
- No console errors/warnings in demo flow.
- Privacy Policy and Terms accessible and non-placeholder.
- Multi-user concurrent behavior demonstrated.

## Known Risks
- Frontend route guard currently has a TODO for explicit role check in [App.tsx](/home/apoh/Transcend/ft_transcendence/frontend/src/App.tsx:91).
- Game-statistics scope may be challenged if not documented with evidence.
- Secrets/sample tokens should not remain in tracked files.
