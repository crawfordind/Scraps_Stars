# Scraps to Stars

Cost-optimized AI culinary engine powered by OpenRouter with strict structured outputs, low-latency model routing, and optimization telemetry.

## Quick start

```bash
npm install
npm run db:migrate
cp .env.example .env.local   # add your OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Scan My Kitchen**.

### Model routing (cost-optimized)

| Task | Model | ~Cost |
| --- | --- | --- |
| Image inventory scan | `google/gemini-2.5-flash-lite` | ~$0.0001–0.0003 |
| Recipe generation | `deepseek/deepseek-v4-flash` | ~$0.0001–0.0004 |

Images are compressed to 640px before upload and again server-side. Prompts are minimal and `max_tokens` is capped.

Set `OPENROUTER_USE_FREE_MODELS=true` to switch to OpenRouter's free tier for zero-cost experiments.

## What's included

- Drizzle SQLite schema + migrations (`drizzle/`, `src/db/`)
- OpenRouter client with model routing and JSON validation (`src/lib/llm/`)
- Cost estimator wired into audit logs (`src/lib/telemetry/costEstimator.ts`)
- Scan UI with tier toggle (`src/components/KitchenScanner.tsx`)
- API routes: upload, inventory extract, recipe generate

## Database

```bash
npm run db:migrate    # apply migrations to local.db
npm run db:generate   # regenerate migrations after schema changes
npm run db:studio     # open Drizzle Studio
```

## API

| Route | Body | Returns |
| --- | --- | --- |
| `POST /api/upload` | `FormData` with `file` | `{ imageUrl }` |
| `POST /api/inventory/extract` | `{ imageUrl, persist? }` | ingredients + `meta` (latency, tokens, cost) |
| `POST /api/recipe` | `{ inventoryList, preferences, tier }` | recipe + `meta` |

## Cost tracking

Every OpenRouter call logs `[optimization_audit]` with latency, token counts, and `estimatedCostUsd`. The UI shows per-step and full-cycle cost against the $0.005 target.
