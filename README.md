FT_TRANSCENDENCE README

A full-stack real-time web application built for the 42 School ft_transcendence capstone.
The project delivers a secure production-style platform featuring user authentication, profiles, matchmaking, match history, leaderboards and a real-time 1v1 Pong game powered by WebSockets.
This repository represents a single consolidated README describing the entire system (backend, frontend and game engine).

Project Management

Work Organization
We organized the project around the mandatory core (frontend + backend + database + game) first, then added modules on top (OAuth, 2FA, rate limiting, etc.).
Work was split into small, testable tasks with identified owners and simple acceptance criteria.
    • Planning cadence: weekly discussions on updates.
    • Task breakdown method: each teammate chooses which module he wants to work on.
    • Definition of done:
        ◦ Feature implemented and works end-to-end
        ◦ Validations added (frontend + backend where applicable)
        ◦ No console errors in Chrome
        ◦ Code reviewed (when possible)
        ◦ Documented in README / notes
Tools Used
    • Source control: Git + GitHub
    • Task tracking: shared doc
    • Code review: review after merge
Communication
    • Main channel: Telegram 
    • Meetings:
        ◦ Weekly planning meeting: informal / as needed
        ◦ Progress sync: weekly updates
    • How we handled blockers:
        ◦ Blocker raised in Telegram
        ◦ Tech Lead/owner proposes solution
        ◦ If urgent, quick call; otherwise documented decision in shared doc
        
Milestones and Timeline
We followed milestone-based delivery to avoid late integration issues.
    • Milestone 1 — Foundation
        ◦ Repo setup, Docker compose, database connection
        ◦ Base frontend + backend skeleton
    • Milestone 2 — Authentication & User Base
        ◦ JWT auth, login, protected routes
        ◦ User profile basics
    • Milestone 3 — Game Core
        ◦ WebSocket layer, game loop, basic gameplay
        ◦ Match lifecycle and persistence
    • Milestone 4 — Polishing & Modules
        ◦ OAuth, 2FA, rate limiting, uploads, UI cleanup, etc
        ◦ README + Terms/Privacy + evaluation readiness
        
Risk Management
Common risks for this project were identified early:
    • Integration risk (frontend/backend/game): mitigated by early end-to-end tests
    • Real-time stability (disconnects/latency): mitigated by reconnection rules + server authoritative state
    • Scope creep: mitigated by prioritizing mandatory requirements and freezing features near the end
    • Evaluation risk: mitigated by documenting architecture, keeping README honest, and preparing demos
How Contributions Were Verified
    • Each feature/module was validated by:
        ◦ Running through the UI flow
        ◦ Checking database state (Prisma/Postgres)
        ◦ Testing real-time behavior with multiple clients
        ◦ Confirming Docker “single command” run works
    • If a feature could not be made stable, it was either fixed or not claimed as a module

Features Overview
Core Platform
    • Secure authentication (JWT)
    • OAuth Login (Google)
    • User profiles & avatars
    • Roles (admin / user)
    • Match history and leaderboard
    • Rate limited and validated API
Real-Time Game
    • 1v1 Pong game (remote game play)
    • Authoritative server game loop
    • WebSocket communication
    • Input prediction & reconciliation (server driven)
    • Reconnection handling
    • Match lifecycle states: ONGOING / FINISHED / DRAW / PENDING
    • Race to 8 scoring system
Infrastructure
    • Dockerized services
    • PostgreSQL database
    • Prisma ORM with migrations
    • Environment driven configuration

Tech Stack
Backend
    • Node.js + Typescript
    • Fastify (HTTP + WebSocket server)
    • Prisma ORM
    • PostgreSQL
    • JWT Authentication
    • OAUTH (Google)
    • 2FA (TOTP)
Frontend
    • React + Typescript
    • Vite
    • WebSocket client for real-time gameplay
    • Modular page based architecture
DevOps
    • Docker & docker-compose
    • Environment-based secrets
    • Prisma migrations

Project Structure

ft_transcendence/
├── backend/        # Fastify API, authentication, 
│   │			database access, WebSocket server
│   ├── prisma/     # Prisma schema and migrations
│   └── src/        # Routes, services, utilities,
│   				WebSocket handlers
├── frontend/       # React (Vite) client application
│   └── src/        # Pages, components, API client
├── game/           # Pong game engine (logic, 
│				physics, rendering)
├── docker/         # Docker-related configuration
└── docker-compose.yml

Database Design
Managed with Prisma. Key models include:
    • User
    • Match
    • Notification
    • PublicItem
All schema changes are tracked through migrations under prisma/migrations.

Authentication Flow
    • JWT-based session handling
    • Secure password hashing (bcrypt)
    • OAuth sign-in (Google)
    • Optional 2FA using TOTP (Speakeasy)
    • Role-aware access control

Game Architecture
    • Server-authoritative Pong engine
    • Deterministic tick loop
    • Client sends input only, never state
    • Server broadcasts authoritative game state
    • Reconnection logic with timeout rules
    • Draw connection only triggered when both players disconnect

Getting Started
Prerequisites
    • Docker
    • Docker Compose
Setup
    • git clone <repo>
    • cd ft_transcendence
    • docker compose up –build

Services (Docker)
    • Nginx (reverse proxy + TLS termination):
        ◦ HTTP: http://localhost:8080 (redirects to HTTPS)
        ◦ HTTPS: https://localhost:8443 (main entrypoint)
    • Frontend:
        ◦ Served by Nginx over HTTPS (https://localhost:8443)
    • Backend (Fastify):
        ◦ Exposed through Nginx:
            ▪ /api/ - backend
            ▪ /ws/ - backend
            ▪ /uploads/ - backend 
    • PostgreSQL:
        ◦ Exposed on host: localhost:5433 (maps to container 5432)
Services (Local development, non-Docker)
    • Backend (HTTP): http://localhost:3000
    • Frontend (HTTP): http://localhost:5173

Development Notes
    • Local development uses HTTP for simplicity.
    • HTTPS is provided by Nginx in Docker (TLS termination). The backend runs HTTP internally.
    • WebSocket pause behavior may occur only in local development single-player mode when the browser tab loses focus. This does not affect real multiplayer games.
    • Prisma migrations reflect iterative schema evolution

42 Subject Compliance
This project fulfills the mandatory requirements of ft_transcendence:
    • Secure authentication system
    • Real-time multiplayer game
    • Remote players
    • Web-based game
    • Multi-user support
    • Persistent match data
    • Leaderboard
    • Game statistics and match history
    • Modern frontend framework
    • Backend framework
    • ORM for database
    • HTTPS provided via reverse proxy (Nginx)
    • OAuth
    • 2FA
    • Public API
    • Notification system
    • Advanced permissions system 
