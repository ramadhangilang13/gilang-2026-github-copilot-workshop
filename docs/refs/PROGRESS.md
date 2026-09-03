# Project Progress — Procurement MVP

Last updated: 2026-09-03

## 1) Summary

The PR module is complete end to end. The **PO module is now complete end to end** as well —
backend, API client, routes, and all three pages. `docs/specs/plan.md` still lists the PO
backend as participant backlog, which is stale.

| Layer | PR module | PO module | GR module |
|---|---|---|---|
| DB schema | Done | Done | Tables + seed only |
| Backend service | Done | Done | Not implemented |
| Backend routes | Done | Done | Not implemented |
| Backend tests | Done | Done | — |
| Frontend API client | Done | Done | Not implemented |
| Frontend router / nav | Done | Done | Not implemented |
| Frontend pages | Done | List / Create / Detail | Not implemented |
| Frontend tests | Done | Done | — |
| E2E tests | None | None | — |

## 2) Backend — implemented

Fastify app in `backend/src/app.js` registers CORS, the `db` plugin, requisition routes
and purchase-order routes, plus `GET /health`. Errors thrown by services carry a
`statusCode`; route handlers translate that into a response, otherwise rethrow to the
global handler.

DB access is via `fastify.db` — `db.query(text, params)` for reads and
`db.pool.connect()` for explicit `BEGIN` / `COMMIT` / `ROLLBACK` transactions.

### Requisition endpoints

| Method | Path | Service |
|---|---|---|
| GET | `/api/requisitions` | `listRequisitions` |
| POST | `/api/requisitions` | `createRequisition` (201) |
| GET | `/api/requisitions/:id` | `getRequisitionById` (404 if absent) |
| POST | `/api/requisitions/:id/submit` | `submitRequisition` (DRAFT → SUBMITTED) |
| POST | `/api/requisitions/:id/approve` | `approveRequisition` (SUBMITTED → APPROVED) |
| GET | `/api/requisitions/:id/open-lines` | `getRequisitionOpenLines` |

### Purchase Order endpoints

All five live in `backend/src/routes/purchase-order-routes.js`.

| Method | Path | Response | Notes |
|---|---|---|---|
| GET | `/api/purchase-orders` | `{ items: [...] }` | Header fields only, newest first. **Not listed in `plan.md` §4.** |
| POST | `/api/purchase-orders` | `201` + full PO detail | Validates payload, enforces the allocation guard, writes header + lines + allocations in one transaction |
| GET | `/api/purchase-orders/:id` | PO detail, `404` if absent | Each line carries a hydrated `allocations[]` |
| POST | `/api/purchase-orders/:id/submit` | Updated PO, `404` if absent | DRAFT → SUBMITTED only; `422` otherwise |
| GET | `/api/purchase-orders/:id/open-lines` | `{ purchaseOrder, openLines }` | Filters to `qtyOpenForGr > 0` |

**Create payload:** `{ vendorName, lines: [{ prLineId, itemCode, itemName, qtyOrdered, uom, unitPrice, siteCode, requiredDate }] }`

**Allocation guard** (`createPurchaseOrder`): each source PR line is locked with
`SELECT ... FOR UPDATE`, the parent PR must be `APPROVED`, and
`qtyOrdered` must not exceed `qty_requested - qty_allocated`. Breaches return `422`.
On success it inserts the PO line, writes a `pr_line_allocations` bridge row, and
increments `pr_lines.qty_allocated` inside the same transaction.

**Numbering:** `PR-2026-NNNN` / `PO-2026-NNNN`, zero-padded from a row count.

### Not implemented

Goods Receipt. `goods_receipts` and `gr_lines` exist in the migration and seed, but there
is no service, no routes, and nothing registered in `app.js`.

## 3) Frontend — implemented

Vue 3 + Vite, all components use Composition API with `<script setup>`. Plain JavaScript,
no TypeScript. Shared styling lives in `frontend/src/styles.css` as CSS custom properties
derived from the Figma design system.

Working pages: Dashboard, Requisition List, Requisition Create, Requisition Detail.
`frontend/src/api.js` wraps `fetch` in an `apiFetch` helper that surfaces the server's
`message` field on failure, falling back to `Request failed: {status}`.

### PO frontend — complete

Routes: `/purchase-orders` (list), `/purchase-orders/new` (create), `/purchase-orders/:id`
(detail), reachable via the "Purchase Orders" nav link. `api.js` exposes all five PO endpoints;
only `getPurchaseOrderOpenLines` is unused, reserved for GR.

Pages:

- `PurchaseOrderListPage.vue` — `listPurchaseOrders`, status badges, date trimming, empty state
- `PurchaseOrderCreatePage.vue` — loads APPROVED requisitions, fetches open lines on PR select, validates, creates, then redirects to the detail page
- `PurchaseOrderDetailPage.vue` — `getPurchaseOrder`, read-only header + lines with `qtyOpenForGr`, source-PR allocations, and a Submit action shown only while DRAFT

Components (used by the create page only; the detail page inlines its read-only table, matching
`RequisitionDetailPage.vue`):

- `components/purchase-order/PurchaseOrderHeaderForm.vue` — `defineModel` for `vendorName`, `sourcePrId`, `orderDate`
- `components/purchase-order/PurchaseOrderLineAllocationTable.vue` — props in, `add-line` / `remove-line` / `update-line` out, with over-allocation highlighting

**Allocation validation is enforced twice.** The client blocks `qtyOrdered > qtyOpenForPo`
before any request leaves the browser, with messages like
`Line 1 (BRG-6205): ordered 9 exceeds remaining 8.` The server remains the authority — if a
concurrent PO consumes the remaining quantity first, its `422` message is displayed verbatim.

## 4) Tests

`npm run test:unit` at the repo root runs both suites. Current state: **78 passing**.

Note: the backend uses **Jest**, the frontend uses **Vitest** — `plan.md` mentions only
Jest and omits Vitest entirely.

### Backend — Jest, 32 tests, 2 files

Services are tested against a mocked `db`; no live database needed.

- `requisition-service.test.js` — `listRequisitions` field mapping; `getRequisitionOpenLines` null + filtering; `getRequisitionById` detail retention and numeric-string coercion
- `purchase-order-service.test.js` — payload validation, over-allocation guard (including the exact-remaining boundary), PR status checks, create success + rollback, submit transitions, list mapping, open-lines filtering, and `getPurchaseOrderById` allocation hydration

### Frontend — Vitest, 46 tests, 7 files

- `src/__tests__/api.spec.js` — `getDashboard` counting, `recentPr` cap, missing-`items` guard, `apiFetch` error paths
- `src/pages/__tests__/RequisitionListPage.spec.js` — row rendering, status badge classes, date fallback, empty and error states
- `src/pages/__tests__/PurchaseOrderListPage.spec.js` — row rendering, badge classes, date trimming and fallback, empty and error states
- `src/pages/__tests__/PurchaseOrderCreatePage.spec.js` — APPROVED-only filtering, open-line loading, the over-allocation guard at the 8/9 boundary, payload shape, server 422 passthrough, and the redirect on success
- `src/pages/__tests__/PurchaseOrderDetailPage.spec.js` — header and line rendering, allocation traceability, DRAFT-only submit, reload after submit, error paths
- `src/components/purchase-order/__tests__/PurchaseOrderHeaderForm.spec.js` — field and option rendering, `defineModel` emits
- `src/components/purchase-order/__tests__/PurchaseOrderLineAllocationTable.spec.js` — row rendering, over-allocation feedback, emitted events

### E2E — none

`playwright.config.js` points at `./tests/e2e`, but that directory does not exist. The
config also has **no `webServer` block**, so `npm run dev` must already be running before
`npm run test:e2e`.

## 5) Environment

```bash
docker compose down -v && docker compose up -d db   # -v is required: seeds only run on an empty volume
npm run dev                                          # backend :3000 + frontend :5173
npm run test:unit
```

Postgres 16 on host port **5433**. Backend defaults to
`postgres://workshop:workshop@localhost:5433/procurement_mvp`.

Seed fixtures useful for testing:

- `PR-2026-0001` — APPROVED, with open quantities (BRG-6205 open 8, GLV-IND open 30)
- `PR-2026-0002` SUBMITTED and `PR-2026-0003` DRAFT — negative-path fixtures for the PR status guard
- `PO-2026-0001` — SUBMITTED, with two allocation rows linking back to PR-2026-0001

## 6) Next steps

1. Create `tests/e2e/` and a PO flow spec; add a `webServer` block to `playwright.config.js`.
2. Consider the GR module (schema is ready, nothing else exists).
3. Optional: surface PO counts on the Dashboard, which currently reports PR only.

## 7) Known discrepancies with `docs/specs/plan.md`

- Plan lists the PO backend and its Jest tests as participant backlog; both are complete.
- Plan omits `GET /api/purchase-orders` from the §4 API scope.
- Plan's tech stack and testing sections omit Vitest.
- Plan does not state that `docker compose down -v` is mandatory rather than optional.
- `--text-muted` in `styles.css` (`#888888`) intentionally deviates from the Figma "Light Gray" `#C9C8D3`, which would fail WCAG AA contrast for form labels.
