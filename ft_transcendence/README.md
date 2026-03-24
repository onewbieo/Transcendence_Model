*This project has been created as part of the 42 curriculum by apoh, bwee, seayeo, bsim.*

# ft_transcendence - Surprise

## Description
`ft_transcendence` is a full-stack web application built around a real-time multiplayer Pong experience, with user authentication, role-based administration, match tracking, notifications, and a secured public API.

Core goal:
- deliver a working multi-user web platform (frontend + backend + database)
- support real-time gameplay between remote players
- implement selected subject modules in a coherent way

Primary features:
- secure auth with email/password (hashed password)
- OAuth 2.0 (Google) login
- optional 2FA (TOTP)
- user profile management + avatar upload
- admin/user role permissions and admin CRUD
- real-time 1v1 Pong over WebSockets
- match history + leaderboard
- secured public API with API key + rate limiting + docs
- notifications for key actions

## Instructions
### Prerequisites
- Docker and Docker Compose
- Node.js 20+ and npm (only for local non-docker development)
- Google OAuth credentials (only if testing Google login)

### Project structure
```text
ft_transcendence/
├── backend/
├── frontend/
├── game/
├── docker/
└── docker-compose.yml
```

### Environment configuration
Important files:
- Docker backend env (required for Docker run): `ft_transcendence/backend/.env.docker`
- Local backend env (only for local `npm run dev`): `ft_transcendence/backend/.env`
- Frontend env (optional): `ft_transcendence/frontend/.env`

Templates:
- Backend template: `ft_transcendence/backend/.env.example`
- Frontend template: `ft_transcendence/frontend/.env.example`

If `.env.docker` does not exist, create it manually using keys from `.env.example`, then set Docker-specific values.
- Example: in Docker mode, `DATABASE_URL` should use host `postgres` (from docker compose service name).
- OAuth values (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) must come from your Google Cloud OAuth app.

Update secrets/keys in your local env files and do not commit real secrets.

### Run with Docker (HTTPS)
```bash
cd ft_transcendence
docker compose up --build
```

Endpoints:
- `http://localhost:8080` (redirect to HTTPS)
- `https://localhost:8443` (main app entrypoint)

### Run local development (HTTP)
Terminal 1:
```bash
cd ft_transcendence
docker compose up -d postgres
cd backend
npm install
npm run dev
```

Terminal 2:
```bash
cd ft_transcendence/frontend
npm install
npm run dev
```

Endpoints:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Note:
- Vite proxies `/api`, `/ws`, and `/uploads` to backend in local mode.
- Do not run `npm run dev` frontend/backend at the same time as full Docker HTTPS stack, because this starts two separate app instances (local + Docker) and can cause mixed cookies/sessions, env mismatches, and confusing test results.

## Team Information
Update this section with your final real team data before submission.

| Member Login | Assigned Role(s) | Responsibilities |
|---|---|---|
| `<login1>` | Product Owner, Developer | Product vision, backlog priority, feature validation, contributor |
| `<login2>` | Project Manager / Scrum Master, Developer | Planning, tracking, risk/blocker follow-up, contributor |
| `<login3>` | Technical Lead / Architect, Developer | Architecture decisions, code quality, critical reviews, contributor |
| `<login4>` | Developer | Feature implementation, testing, documentation |


## Project Management
### Work organization
- mandatory core delivered first (frontend/backend/db/game), modules layered afterward
- weekly syncs + ad hoc blocker discussions
- tasks split into small implementable units with owner and acceptance criteria

### Tools
- Git + GitHub (version control)
- shared planning board/doc (task tracking)
- direct code review before/after merges

### Communication channels
- primary async channel: Telegram
- quick calls for urgent blockers

## Technical Stack
### Frontend
- React + TypeScript + Vite
- React Router

Justification:
- fast iteration for SPA(Single Page Application) pages and realtime integration 
- clean separation of pages, API layer, and auth/ws helpers

### Backend
- Fastify + TypeScript
- `@fastify/websocket`, `@fastify/jwt`, `@fastify/rate-limit`, `@fastify/swagger`

Justification:
- high-performance HTTP + WebSocket in one service
- clean plugin/decorator architecture for auth and admin checks

### Database
- PostgreSQL
- Prisma ORM + migrations

Justification:
- relational schema fits users/matches/notifications
- schema migrations and typed queries simplify evolution

### Infrastructure
- Docker Compose (single command orchestration)
- Nginx reverse proxy with TLS termination

## Database Schema
Core models:
- `User`: account/auth/profile/role/OAuth/2FA fields
- `Match`: player ids, scores, status, winner, duration
- `Notification`: user notifications
- `PublicItem`: public API demo content

Relationships:
- `User` 1:N `Match` as `player1`
- `User` 1:N `Match` as `player2`
- `User` 1:N `Match` as `winner`
- `User` 1:N `Notification`

Schema source:
- `ft_transcendence/backend/prisma/schema.prisma`

## Features List
| Feature | Description | Team Member(s) |
|---|---|---|
| Email/password auth | Signup/login with hashed password and JWT | apoh |
| OAuth 2.0 (Google) | Login via Google with callback handling | apoh |
| 2FA (TOTP) | Setup, enable, verify, disable 2FA | apoh |
| Profiles + avatar | Update profile data and upload avatar | bwee |
| Role permissions | ADMIN/USER guards and admin CRUD actions | apoh |
| Realtime Pong | WebSocket queue, match start, live state sync | apoh, seayeo |
| Reconnect flow | Grace period, reconnect, match resolution | apoh |
| Match history + leaderboard | Match storage/query and ranking display | apoh, bsim |
| Public API | API key + rate limit + CRUD + docs | apoh |
| Notifications | Notification creation for key actions | apoh, bsim |
| Privacy + Terms pages | Accessible legal pages in app footer | bsim, seayeo |

## Modules
### Claimed modules and points
| Category | Module | Type | Points | Implementation summary | Team Member(s) |
|---|---|---:|---:|---|---|
| Web | Framework for frontend + backend | Major | 2 | React frontend + Fastify backend | apoh, bwee, bsim |
| Web | ORM | Minor | 1 | Prisma with PostgreSQL migrations | bsim |
| Web | Realtime features | Major | 2 | WebSocket Pong + connection/reconnect handling | apoh, seayeo |
| Web | Public API (API key + rate limit + docs + CRUD endpoints) | Major | 2 | `/public/items` CRUD + x-api-key + rate limit + `/api/docs` | apoh |
| Web | Complete notification system | Minor | 1 | Notifications integrated across CRUD-related user flows | apoh, bsim |
| User Management | Game statistics and match history | Minor | 1 | Match history + leaderboard + wins aggregation | apoh |
| User Management | OAuth 2.0 | Minor | 1 | Google OAuth endpoints and frontend callback flow | apoh |
| User Management | Advanced permissions system | Major | 2 | ADMIN/USER roles + admin user CRUD endpoints | apoh, bsim |
| User Management | Complete 2FA | Minor | 1 | TOTP setup/enable/verify/disable workflow | apoh, bsim |
| Gaming & UX | Complete web-based game | Major | 2 | Browser Pong with clear rules and win conditions | apoh, seayeo |
| Gaming & UX | Remote players | Major | 2 | 2-player remote realtime gameplay + reconnection logic | apoh |

Claimed total: **17 points**

Note:
- We count the framework major only once (we do not additionally count frontend/backend framework minors).
- Final module claim is validated during peer evaluation demo.

## Mandatory Requirement Coverage
- Web application with frontend + backend + database: yes
- Multi-user support: yes
- Docker single-command deployment: yes (`docker compose up --build`)
- Chrome compatibility: target browser for validation
- No console warnings/errors in demo flows: required internal check
- Accessible Privacy Policy and Terms of Service pages: implemented and linked
- Input validation frontend + backend: implemented in key forms/routes
- Backend HTTPS: provided via Nginx TLS reverse proxy in Docker mode

## Resources
### Technical references
- Fastify docs: https://fastify.dev/docs/latest/
- Prisma docs: https://www.prisma.io/docs
- Vite docs: https://vite.dev/guide/
- React docs: https://react.dev/
- WebSocket RFC overview: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- PostgreSQL docs: https://www.postgresql.org/docs/
- Google OAuth/OpenID Client docs: https://github.com/panva/node-openid-client
- Speakeasy (TOTP): https://github.com/speakeasyjs/speakeasy

### AI usage disclosure
AI tools were used to:
- accelerate repetitive documentation drafting
- generate test/checklist ideas
- refine prompt-driven code review and edge-case thinking

AI-generated output was always:
- reviewed by team members
- tested before integration
- discussed with peers when behavior/logic was critical

No AI-generated code was accepted blindly.
