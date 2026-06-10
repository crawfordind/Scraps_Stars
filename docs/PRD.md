# Product Requirement Document (PRD)

## Project: Scraps to Stars - Cost-Optimized AI Culinary Engine

### 1. Executive Summary & Efficiency Goals

Scraps to Stars leverages OpenRouter to access a fleet of specialized LLMs, matching each micro-task (Vision, Inventory Parsing, Recipe Generation) to the most cost-effective high-accuracy model available.

#### Efficiency targets

- Latency: under 2 seconds for inventory extraction; under 3 seconds for recipe generation.
- Cost efficiency: target cost less than $0.005 per complete user scan and recipe generation cycle.
- Accuracy: strict JSON adherence to avoid expensive retries.

### 2. OpenRouter Model Matrix & Routing Architecture

| Agent / Task | Primary OpenRouter Model | Backup / Failover Model | Rationale |
| --- | --- | --- | --- |
| Vision Intake Agent | `google/gemini-1.5-flash` or `openai/gpt-4o-mini` | `anthropic/claude-3.5-haiku` | Low-cost multimodal extraction in noisy environments |
| Recipe Developer Agent | `meta-llama/llama-3.1-70b-instruct` or `openai/gpt-4o-mini` | `anthropic/claude-3.5-sonnet` | Strong substitutions and structured output generation |
| Gamification Engine | `meta-llama/llama-3.1-8b-instruct` | `google/gemini-1.5-flash-8b` | Fast low-cost copy and XP messaging |

### 3. Core Application Flow & UX Mechanics

#### Tier selection

Default action is **Scan My Kitchen** and then a 3-way tier selector:

- Tier 1: Strictly Here (no extra items)
- Tier 2: Bridge the Gap (1-3 extra high-impact items)
- Tier 3: Full Feast (full recipe + grocery expansion)

#### Gamified feedback loop

- Nailed It: increments XP, level progress, and ingredient weighting.
- Tweak It: accepts a short rewrite instruction (for example, "too spicy") and performs a lightweight rewrite.

### 4. Database Schema

Implemented in `src/db/schema.ts` for Drizzle + SQLite.

### 5. Prompt Engineering

Static system prompts are kept stable for maximum cache hits. Dynamic user state is appended at the end of the user prompt payload.

### 6. Local Development Blueprint

1. Local SQLite + Drizzle setup
2. Vision mock storage in local `public` path
3. Optimization audit logs (latency + token usage)
