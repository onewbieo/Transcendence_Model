# ft_transcendence Evaluation Execution Plan

## 0) How to use this file
- Run this checklist in order.
- Mark each item as `DONE`, `PARTIAL`, or `BLOCKED` during preparation.
- Do not claim modules unless they are demonstrable end-to-end.

## 1) Team Oral Defense (Mandatory)
- Ask each member to explain assigned role (PO, PM/Scrum, Tech Lead, Developer).
- Ask each member to explain specific contributions.
- Ask each member to explain at least one personally implemented feature/module.
- Pass criteria: every member can explain role + concrete contribution without ambiguity.

## 2) README Verification (Chapter VI)
- Verify project name + description are clear.
- Verify team members and assigned roles are present.
- Verify project management approach is documented.
- Verify technologies and justifications are documented.
- Verify database schema section is documented.
- Verify features list includes ownership.
- Verify module list includes justification + point calculation.
- Verify individual contribution section is complete.
- Pass criteria: README is complete, coherent, and aligned with what can be demonstrated.

## 3) Project Coherence Check
- Ask at least 2 team members to explain project concept.
- Ask at least 2 team members to explain main technologies and reasons.
- Ask at least 2 team members to explain team coordination model.
- Pass criteria: explanations are consistent across members.

## 4) Git Collaboration Evidence
- Verify commits from all team members.
- Verify commit messages are meaningful.
- Verify work distribution across team is visible.
- Pass criteria: repository history reflects real group collaboration.

## 5) Architecture Components
- Verify frontend exists and is functioning.
- Verify backend exists and is functioning.
- Verify database exists and is functioning.
- Pass criteria: all three parts are integrated and demonstrable.

## 6) Deployment
- Run single-command deployment with Docker.
- Verify app is reachable and functional after boot.
- Pass criteria: evaluator can reproduce deployment with one command.

## 7) Browser Compatibility
- Run full demo flow on latest stable Chrome.
- Check DevTools console for errors/warnings.
- Pass criteria: no critical console issues in demonstration path.

## 8) Privacy Policy and Terms
- Verify both pages are accessible (footer links).
- Verify both pages contain relevant non-placeholder content.
- Pass criteria: both pages satisfy mandatory content/accessibility requirement.

## 9) Technical Requirements Verification
### 9.1 Frontend responsiveness/accessibility
- Test at desktop and mobile/tablet width.
- Verify core flows remain usable.
- Pass criteria: layout adapts and remains clear.

### 9.2 Styling solution
- Confirm project uses a valid styling solution (current: React inline styling pattern).
- Prepare explanation for evaluator on styling approach used across pages.
- Pass criteria: team can justify styling approach used consistently.

### 9.3 Environment variable security
- Keep real `.env` and `.env.docker` out of Git.
- Keep `.env.example` tracked for backend and frontend.
- Verify no secrets are present in tracked files.
- Pass criteria: secret handling is compliant and reproducible.

### 9.4 Database design
- Show schema and model relations.
- Explain why relations are structured this way.
- Pass criteria: schema is clear and defendable.

### 9.5 Authentication security
- Demonstrate signup/login.
- Explain password hashing/salting flow.
- Pass criteria: no plaintext password storage.

### 9.6 Frontend + backend validation
- Test invalid inputs (empty, malformed, invalid auth data).
- Confirm backend rejects invalid payloads even if frontend checks are bypassed.
- Pass criteria: both client and server validation are present.

### 9.7 HTTPS
- Demonstrate HTTPS flow in Docker mode via Nginx.
- Pass criteria: secure transport is used during evaluated backend access.

## 10) Modules Documentation Gate
- List claimed modules with exact point calculation.
- Confirm total claimed points >= 14.
- Pass criteria: README module table matches actual implementation.

## 11) Major Modules Validation
- For each claimed major module: demonstrate, verify functionality, verify dependencies.
- Count only modules that work completely.
- Pass criteria: each major module passes strict functional verification.

## 12) Minor Modules Validation
- For each claimed minor module: demonstrate, verify functionality, verify dependencies.
- Count only modules that work completely.
- Pass criteria: each minor module passes strict functional verification.

## 13) Modules of Choice (If any)
- Verify justification quality and technical depth.
- Verify relevance and non-triviality.
- Pass criteria: custom module has defendable complexity and value.

## 14) Code Quality / Understanding
- Review representative files for organization and clarity.
- Ask team to explain architecture and trade-offs.
- Pass criteria: team demonstrates understanding, not copy-paste behavior.

## 15) Teamwork Evidence
- Verify members can explain their own and related teammate work.
- Verify integration quality between modules.
- Pass criteria: no single-person-only project signal.

## 16) Functional Stability Demo
- Run full app flow and major features.
- Verify multi-user behavior.
- Verify no critical crashes during demo.
- Pass criteria: application is stable for evaluation session.

## 17) Final Scoring Gate
- Recompute validated score using only working modules.
- Major = 2, Minor = 1.
- Non-functional modules = 0.
- Pass criteria: validated total >= 14.

## 18) Bonus Validation (Optional)
- Validate extra modules beyond 14 points.
- Confirm each extra module is complete, justified, and working.
- Cap bonus at subject limit.

---

## Repo-specific action list (tomorrow)
- [ ] Fill real team logins/roles/contributions in `README.md`.
- [ ] Complete feature ownership mapping in `README.md`.
- [ ] Ensure no tracked secrets remain in repository.
- [ ] Keep `notifications` as claimed module (already accepted by your verification).
- [ ] Keep `game stats/history` with safe defense:
  - current defense: history + wins ranking + leaderboard
  - fallback if challenged: add explicit progression (winRate + badges + level)
- [ ] Implement frontend admin route role-check (recommended for safer “advanced permissions” defense):
  - protect `/admin`, `/admin/users`, `/create-user` for ADMIN role in UI
  - keep backend authorization as source of truth
- [ ] Re-run Docker single-command demo and Chrome console check.

## Current claimed module total (working draft)
- Web Major: framework frontend + backend (2)
- Web Minor: ORM (1)
- Web Major: realtime WebSocket (2)
- Web Major: public API + key + rate limit + docs + CRUD (2)
- Web Minor: notifications (1)
- User Mgmt Minor: game stats/history (1, conditional defense)
- User Mgmt Minor: OAuth (1)
- User Mgmt Major: advanced permissions (2)
- User Mgmt Minor: 2FA (1)
- Gaming UX Major: complete web game (2)
- Gaming UX Major: remote players (2)
- Draft total: 17
