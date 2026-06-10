# Architecture Overview

## Core principles

- Use OpenRouter as centralized model gateway.
- Route each task to the cheapest model that satisfies quality.
- Enforce strict JSON contracts with runtime validation.
- Keep prompts cache-friendly by separating static and dynamic segments.

## Task routing

Controlled by `OPENROUTER_USE_FREE_MODELS` in `src/lib/llm/modelRouting.ts`.

**Production** (`OPENROUTER_USE_FREE_MODELS=false`):
- `inventory_extract`: `google/gemini-2.5-flash-lite` (vision, compressed images, max 256 tokens)
- `recipe_generate`: `deepseek/deepseek-v4-flash` → `google/gemini-2.5-flash-lite` fallback (max 512 tokens)

**Testing** (`OPENROUTER_USE_FREE_MODELS=true`):
- Both tasks use `openrouter/free` (OpenRouter's free router) with `:free` model fallbacks
- Same API endpoint; zero cost; subject to free-tier rate limits
- `gamification_copy`:
  - primary: `meta-llama/llama-3.1-8b-instruct`
  - fallback: `google/gemini-1.5-flash-8b`

## Request lifecycle

1. API route receives normalized payload.
2. Typed request is converted to strict prompt bundle.
3. OpenRouter chat completion runs with `response_format: { type: "json_object" }`.
4. Output is parsed and validated with Zod.
5. Optimization audit captures:
   - end-to-end latency
   - prompt/completion/total tokens when returned by provider
6. Valid JSON is returned to UI.

## Reliability guardrails

- Single retry on malformed JSON with stronger correction hint.
- Automatic fallback model invocation on provider failure.
- Deterministic temperature defaults (`0.2`-`0.3`) for schema fidelity.
