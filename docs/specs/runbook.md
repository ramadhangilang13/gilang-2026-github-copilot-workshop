# Runbook — Procurement MVP

Operational guide for running, testing, and troubleshooting the app locally.
For the design spec see `docs/specs/plan.md`; for current build state see `docs/refs/PROGRESS.md`.

---

## 1) Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Docker + Compose | any current | `docker compose version` |

Host port **5433** must be free (Postgres) along with **3000** (API) and **5173** (web).

---

## 2) First-time setup

```bash
# 1. Install dependencies (three separate package.json files)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Create env files from templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start the database (see the -v warning below)
docker compose down -v
docker compose up -d db
```

`backend/.env`:

```env
DATABASE_URL=postgres://workshop:workshop@localhost:5433/procurement_mvp
PORT=3000
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Both have sane defaults in code, so the app still boots without `.env` files —
but create them anyway so overrides behave predictably.

> **The `-v` flag is mandatory, not optional.**
> Postgres only runs `/docker-entrypoint-initdb.d` scripts when the data directory is
> empty. Without `down -v` the volume survives, the init script is skipped, and you get
> an empty database with no tables. Any time migrations or seeds change, re-run with `-v`.

---

## 3) Daily run

```bash
docker compose up -d db     # if not already running
npm run dev                 # backend :3000 + frontend :5173 via concurrently
```

Open http://localhost:5173

Run services separately when you want isolated logs:

```bash
npm run dev:backend
npm run dev:frontend
```

---

## 4) Verifying the stack

```bash
# API is up
curl localhost:3000/health                     # {"status":"ok"}

# Seed data loaded
curl localhost:3000/api/requisitions           # 3 PRs
curl localhost:3000/api/purchase-orders        # PO-2026-0001

# PR open lines (drives the PO create form)
curl localhost:3000/api/requisitions/11111111-1111-1111-1111-111111111001/open-lines
```

Direct database check:

```bash
docker exec -it procurement_mvp_db \
  psql -U workshop -d procurement_mvp -c "\dt"
```

Expect 7 tables: `purchase_requisitions`, `pr_lines`, `purchase_orders`, `po_lines`,
`pr_line_allocations`, `goods_receipts`, `gr_lines`.

---

## 5) Tests

```bash
npm run test:unit          # backend Jest + frontend Vitest
npm run test:backend       # Jest only
npm run test:frontend      # Vitest only
npm run test:coverage      # both, with coverage
```

Backend is **Jest**, frontend is **Vitest**. Neither needs a running database or server —
the DB is mocked in backend service tests, and `api.js` is mocked in frontend page tests.

E2E:

```bash
npm run test:e2e           # requires `npm run dev` already running
npm run test:e2e:ui        # interactive
```

> `playwright.config.js` has **no `webServer` block**, so Playwright will not start the
> app for you. Start `npm run dev` first, or add a `webServer` entry to the config.
> As of now `tests/e2e/` does not exist, so `test:e2e` reports no tests found.

---

## 6) Seed data reference

Loaded from `db/seeds/002_seed_procurement_mvp.sql`.

| Record | Status | Notes |
|---|---|---|
| PR-2026-0001 | APPROVED | Has open qty — BRG-6205 open 8, GLV-IND open 30. The only PR selectable on the PO create page. |
| PR-2026-0002 | SUBMITTED | Negative fixture — rejected by the PR status guard |
| PR-2026-0003 | DRAFT | Negative fixture |
| PO-2026-0001 | SUBMITTED | Two allocation rows linking back to PR-2026-0001 |
| GR-2026-0001 | DRAFT | Seed only; no GR code exists |

Reset to this exact state at any time:

```bash
docker compose down -v && docker compose up -d db
```

---

## 7) Manual smoke test

1. Dashboard loads with PR counts.
2. **Purchase Requisitions** → create a PR → Submit → Approve.
3. **Purchase Orders** → **+ New PO** → pick the approved PR.
   Lines auto-fill with ordered qty defaulted to the remaining qty.
4. Enter a vendor name → **Save As Draft** → redirects to PO detail.
5. Detail shows status DRAFT, `Qty Open for GR`, and the source PR per line.
6. **Submit PO** → status becomes SUBMITTED and the button disappears.
7. Re-open the PO create page for the same PR — the allocated quantity is now gone
   from the remaining amount.

**Negative check:** set an ordered qty above the open qty. The form blocks it with
`Line 1 (BRG-6205): ordered 9 exceeds remaining 8.` and never calls the API.

---

## 8) Troubleshooting

**Tables missing / `relation does not exist`**
The volume was reused and the init script never ran. Fix with
`docker compose down -v && docker compose up -d db`.

**`ECONNREFUSED ... 5433`**
Database container is not running or still starting.
Check `docker compose ps` and `docker compose logs db`.

**Port already allocated (5433 / 3000 / 5173)**
Something else holds the port. Find it with `lsof -i :5433`, or change the mapping in
`docker-compose.yml` and `DATABASE_URL` to match.

**Frontend loads but every request fails**
Backend is down, or `VITE_API_BASE_URL` is wrong. Vite only reads env at startup —
restart `npm run dev:frontend` after editing `frontend/.env`.

**422 on PO create**
Working as designed. Either the ordered qty exceeds the PR line's remaining qty, or the
source PR is not APPROVED. The message names the offending line.

**Init script fails on Windows**
`docker/postgres/init/00-init-mvp-db.sh` requires LF endings. If Git converted them to
CRLF, re-checkout with `core.autocrlf=false`.

---

## 9) Command reference

| Command | Purpose |
|---|---|
| `docker compose up -d db` | Start Postgres |
| `docker compose down -v` | Stop and **wipe** data, forcing re-seed |
| `docker compose logs -f db` | Tail database logs |
| `npm run dev` | Start API + web together |
| `npm run test:unit` | All unit tests |
| `npm run test:e2e` | Playwright (needs dev server running) |
| `cd frontend && npm run build` | Production build check |

Per repo convention in `.github/copilot-instructions.md`, prefix shell commands with `rtk` to
compress output, e.g. `rtk npm run test:unit`.

---

## 10) Checklists

Copy these into an issue or PR description and tick as you go.

### 10.1 First-time setup

- [ ] `node -v` reports 20+
- [ ] `docker compose version` works
- [ ] Ports 5433, 3000, 5173 are free
- [ ] `npm install` run in **all three** locations: root, `backend/`, `frontend/`
- [ ] `backend/.env` created from `.env.example`
- [ ] `frontend/.env` created from `.env.example`
- [ ] `docker compose down -v && docker compose up -d db` executed **with `-v`**
- [ ] `docker compose ps` shows `procurement_mvp_db` healthy
- [ ] `psql ... -c "\dt"` lists all 7 tables
- [ ] `npm run test:unit` passes before touching any code

### 10.2 Daily start

- [ ] Database container running
- [ ] `npm run dev` started
- [ ] `curl localhost:3000/health` returns `{"status":"ok"}`
- [ ] http://localhost:5173 renders the Dashboard
- [ ] Browser console is free of errors

### 10.3 Seed data sanity

- [ ] `GET /api/requisitions` returns 3 PRs
- [ ] PR-2026-0001 is APPROVED
- [ ] Its open lines show BRG-6205 = 8 and GLV-IND = 30
- [ ] `GET /api/purchase-orders` returns PO-2026-0001 as SUBMITTED
- [ ] PR-2026-0002 is SUBMITTED and PR-2026-0003 is DRAFT

### 10.4 PR module smoke test

- [ ] Dashboard stat cards show PR counts
- [ ] PR list renders rows with status badges
- [ ] Create a PR with at least one line → redirects to detail
- [ ] New PR shows DRAFT with a Submit button
- [ ] Submit → SUBMITTED, Approve button appears
- [ ] Approve → APPROVED, no action buttons remain

### 10.5 PO module smoke test

- [ ] "Purchase Orders" nav link opens the list
- [ ] List shows PO-2026-0001 with a SUBMITTED badge
- [ ] Clicking a PO number opens its detail page
- [ ] **+ New PO** opens the create form
- [ ] Source PR dropdown lists **only APPROVED** requisitions
- [ ] Selecting a PR fills the grid; ordered qty defaults to remaining qty
- [ ] Submitting without a vendor name is blocked client-side
- [ ] Save As Draft → redirects to the new PO's detail page
- [ ] Detail shows DRAFT, `Qty Open for GR`, and the source PR per line
- [ ] Submit PO → SUBMITTED and the button disappears
- [ ] Re-opening the create form for that PR shows the reduced remaining qty

### 10.6 Over-allocation guard

- [ ] Ordered qty **equal to** remaining is accepted
- [ ] Ordered qty **above** remaining is rejected before any API call
- [ ] Message reads `Line 1 (BRG-6205): ordered 9 exceeds remaining 8.`
- [ ] The qty input is visibly flagged
- [ ] A line with no source PR line is rejected
- [ ] Server-side 422 is rendered verbatim if it ever wins the race

### 10.7 Before opening a PR

- [ ] `npm run test:unit` green
- [ ] `cd frontend && npm run build` succeeds
- [ ] Manual smoke test run against a **freshly reset** database
- [ ] No emojis in UI text or commit messages
- [ ] New UI uses existing `styles.css` variables and classes
- [ ] Route handlers stayed thin; business rules live in services
- [ ] `docs/refs/PROGRESS.md` updated if scope changed
- [ ] No stray `.env`, `node_modules/`, or `graphify-out/` in the diff

### 10.8 Troubleshooting triage

- [ ] `relation does not exist` → re-run with `down -v`
- [ ] `ECONNREFUSED :5433` → check `docker compose ps` and `logs db`
- [ ] Port already allocated → `lsof -i :<port>`
- [ ] All requests failing → backend down, or restart Vite after editing `frontend/.env`
- [ ] 422 on PO create → expected; read the line named in the message
- [ ] Init script fails on Windows → confirm LF endings on `00-init-mvp-db.sh`

