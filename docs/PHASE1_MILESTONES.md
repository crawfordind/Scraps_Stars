# Phase 1 Milestones

## 1) Local SQLite and Router Setup

- [x] Initialize Next.js app router project.
- [x] Configure Drizzle with SQLite (`@libsql/client`).
- [x] Apply initial tables from `src/db/schema.ts` (`npm run db:migrate`).
- [ ] Add `.env.local` from `.env.example` with your OpenRouter key.

## 2) Vision and Mock Storage

- [x] Create UI dropzone with "Scan My Kitchen" primary action.
- [x] Save uploaded assets to `public/debug-storage/`.
- [x] Call `POST /api/inventory/extract` with saved image URL.
- [x] Persist extracted inventory to local SQLite.

## 3) Optimization Audit

- [x] Log latency for each OpenRouter call.
- [x] Log prompt/completion/total tokens for each call.
- [x] Track fallback usage rate and response failures.
- [x] Estimate per-request cost via `costEstimator.ts`.
- [x] Display full-cycle cost in UI against $0.005 target.
