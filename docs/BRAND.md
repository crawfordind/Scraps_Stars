# Barefeast — Brand Guide

> **Core tension:** the **bare** (almost-empty fridge, scarcity, honesty) becoming a **feast** (warmth, abundance, the full table).

## Persona

Barefeast is the friend who opens your sad, near-empty fridge, raises one eyebrow, and twenty minutes later there is something incredible on the table. Resourceful, warm, quietly confident, with a wink. It never lectures about waste — it makes thrift look clever and delicious.

| Trait | Expression |
|-------|------------|
| **Resourceful** | Sees possibility where you see "nothing." Scrappy ingenuity. |
| **Generous** | The feast, the table, abundance. Wants to feed you well. |
| **Confident & wry** | "Watch this." Capability, not preachiness. |

**Emotional job:** turn *"ugh, there's nothing to eat"* into *"wait, I made that?"* The user should feel a little heroic.

---

## Color — bare-to-feast duality

The app lives calm and bare, then floods with warm color at payoff (recipe appears, win lands). **Color is the reward.**

| Token | Hex | Role |
|-------|-----|------|
| `--oat` / `--bg` | `#F4EFE6` | Bare base — warm oat paper, breathing room |
| `--ember` | `#D65A2E` | Feast hero — primary actions, payoffs, active nav |
| `--turmeric` | `#E8A33D` | Support accent — highlights, rings, warmth |
| `--herb` | `#6E8B5B` | Farm roots — success, pantry resilience |
| `--ink` / `--text` | `#2A2622` | Espresso ink — never pure black |
| `--kraft` / `--border` | `#D4C9B8` | Card borders, butcher-paper frame |

**CSS variables** (see `src/app/globals.css`): semantic aliases `--accent` (ember), `--gold` (turmeric), `--herb-green`, `--on-accent` (cream labels on ember).

---

## Typography

| Role | Font | CSS variable | Usage |
|------|------|--------------|-------|
| **Display / feast** | [Fraunces](https://fonts.google.com/specimen/Fraunces) | `--font-display` | Dish names, hero wordmark, editorial headlines |
| **Body & UI** | [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) | `--font-ui`, `--font-body` | Readable kitchen UI, body copy |
| **Stamp / bare** | [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) | `--font-stamp` | Tier labels, meta, ration-style badges (`.stamp-label`) |

Display headings use Fraunces at 600 weight. Stamp labels are lowercase with tracked spacing.

---

## Texture & surfaces

- **Butcher paper & kraft** — cards use oat fill + kraft border, not glossy shadows.
- **Stamp badges** — tier chips and wins look like rubber-stamp ration labels (`.tier-btn`, `.stamp-label`).
- **Feast cards** — generated recipes use `.panel--feast`: ember left accent + Fraunces dish name.
- **No stock-food gloss** — honest ingredients on raw surfaces.

---

## Logo & wordmark

- **Wordmark:** lowercase `barefeast` in Fraunces.
- **Icon direction:** empty bowl silhouette in ember on oat, one sprig rising — bare vessel, about to be full.
- **Hero lockup:** wordmark + tagline *"A feast from almost nothing."*

---

## Buttons & navigation

| Element | Spec |
|---------|------|
| **Primary** (Cook, Generate, Save) | Solid ember pill (`border-radius: 999px`), cream label, chunky min-height ≥ 3rem, spring press |
| **Secondary** | Transparent, ink outline — quiet, bare |
| **Tier chips** | Stamp-style; selected fills ember |
| **Tabs** | **Larder** · **Cook** · **Table** — oat bar, ink labels, active tab ember glow |

Tab mapping: Larder = home/coach, Cook = scan-to-feast loop, Table = wins & impact.

---

## Motion

Signature move: **bare blooming into feast** — neutral states warm up and fill with color on action. Springy and tactile at payoff (table being set), not arcade confetti. Respects `prefers-reduced-motion`. Implementation: `src/lib/motion/spring.ts`, `src/components/motion/ui.tsx`.

---

## Voice & copy

**Rules:** confident, warm, a little wry. Plain words. Reframe scarcity as capability — never guilt. Short, second person, with a wink. Sell the before-and-after.

| Context | Copy |
|---------|------|
| **Hero tagline** | A feast from almost nothing. |
| **Alternate** | Bare fridge. Full table. |
| **App descriptor** | Barefeast: scan your fridge, cook a feast, waste nothing. |
| **Zero state** | Looks bare? Perfect. That's exactly where we start. |
| **Scan CTA** | Show me the sad shelf. / Open the fridge, let's work with it. |
| **Generating** | Turning not-much into dinner. / Setting the table. |
| **Recipe reveal** | From that? Yeah. From that. / Told you. Feast. |
| **Save a win** | Another feast from nothing. / Banked. |
| **Tiers** | strictly here · bridge the gap · full feast |
| **Table tab** | What you've brought to the table. |
| **Weekly challenge** | Shame Shelf Sunday |
| **Notification hook** | Your fridge called. It's not as empty as it looks. |

**Host:** AI coach copy stays in-character as your resourceful host — looks at your shelf and goes to work.

---

## Implementation map

| Area | Files |
|------|-------|
| Tokens & components | `src/app/globals.css`, `src/styles/pillars-2026.css` |
| Fonts & metadata | `src/app/layout.tsx` |
| Hero | `src/app/page.tsx` |
| Navigation | `src/components/AppShell.tsx` |
| Share / brand strings | `src/lib/share/shareContent.ts`, `src/lib/share/shareId.ts` |
| Motion | `src/components/motion/` |

---

## Do / Don't

**Do:** let ember appear at moments of payoff; use stamp mono for utility labels; keep plenty of oat whitespace.

**Don't:** preach about waste; use pure black or cold corporate blue; glossy food photography aesthetics; guilt-forward copy.
