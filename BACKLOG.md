# FoodRoller Backlog

**North Star Metric**: Weekly Macro Plans Generated — users who generate at least one AI macro-planned week per week.

**Strategic pivot**: FoodRoller targets macro trackers, weight loss journeys, and dietitians. AI is the core product, not a feature.

**Branching**: every item has a dedicated branch off `master`. Master stays stable and deployable at all times.

**Prioritization order**: (1) Nutritional data foundation → (2) Macro planning UI → (3) AI plan generation → (4) Dietitian mode → (5) Monetization → (6) Social

---

## ✅ Recently Completed

| Feature | Version | Notes |
|---------|---------|-------|
| User Accounts & Auth | v2.3 | Firebase Auth (Google + email), Firestore sync per user, sign-out clears state |
| Export Shopping List | v1.3 | Copy, CSV, Print/PDF |
| Recipe Detail Modal | v1.2 | Full ingredients, instructions, dietary badges |
| Recipe Catalog / Browse | v1.1 | Grid, category + dietary filter |
| Dietary Restrictions | v1.0 | Vegetarian, Vegan, Pescatarian |
| Automated Testing / CI | v0.7 | Jest + RTL, GitHub Actions, Vercel deploy |

---

## 🔬 Phase M: Macro Foundation
**Goal**: Make nutritional data and macro tracking the core of the product. This phase is prerequisite for all AI features.

---

### M.1 — Nutritional Data Layer ⭐ HIGHEST PRIORITY
`feature/m.1-nutritional-data` | **Effort**: 1–2 weeks

The single most important technical foundation. Without real macro data, nothing else in this roadmap is possible.

**What**:
- Integrate [Edamam Recipe Analysis API](https://developer.edamam.com/edamam-recipe-api) (free tier: 10,000 calls/month)
- When a recipe is loaded from TheMealDB, send its ingredient list to Edamam and get back: calories, protein (g), carbs (g), fat (g), fiber (g)
- Cache nutritional data in Firestore per recipe ID (same recipe = same nutrition, fetch once)
- Extend recipe object shape: `{ ...existing, nutrition: { kcal, protein, carbs, fat, fiber } }`
- Display macro badges on RecipeCard and RecipeDetailModal

**Acceptance criteria**:
- Every recipe shows kcal / P / C / F
- Nutritional data is fetched once and cached (no repeat API calls for same recipe)
- Graceful fallback if Edamam unavailable (show "nutrition unavailable")

**API keys needed**: Edamam App ID + App Key → add to `.env.local` and GitHub secrets

---

### M.2 — Macro Profile Setup
`feature/m.2-macro-profile` | **Effort**: 1 week | **Depends on**: M.1

User defines their daily nutrition targets. Stored per user account (Firestore) or locally (anonymous).

**What**:
- Profile setup modal/page: daily kcal target, protein (g), carbs (g), fat (g)
- Optional: goal selector (lose weight / maintain / gain muscle) with auto-calculated targets using Mifflin-St Jeor formula (input: age, weight, height, activity level)
- Targets visible in header or dashboard at all times

**Acceptance criteria**:
- User can set/edit their macro targets
- Targets persist across sessions (Firestore when signed in)
- Auto-calculator works for the three main goals

---

### M.3 — Macro Dashboard
`feature/m.3-macro-dashboard` | **Effort**: 1–2 weeks | **Depends on**: M.1, M.2

Daily and weekly macro progress visualized.

**What**:
- Day view: ring/bar charts for kcal, protein, carbs, fat showing planned vs target
- Week view: summary table with daily totals and weekly averages
- Color coding: green = on track, yellow = 10% off, red = >20% off target
- Updates live as meals are added/removed from the plan

**Acceptance criteria**:
- Macro totals for current plan week displayed and update in real-time
- Daily breakdown visible per day in the plan
- Works for anonymous users (uses localStorage targets) and signed-in users

---

### M.4 — AI Macro-Aware Meal Planner ⭐ CORE PRODUCT
`feature/m.4-ai-macro-planner` | **Effort**: 2–3 weeks | **Depends on**: M.1, M.2, M.3

This is the headline feature and the reason people pay. AI generates a complete week-long meal plan that hits the user's macro targets.

**What**:
- "Plan My Week" button → sends to Claude API:
  - User's daily macro targets
  - Dietary restrictions
  - Number of meals per day (2–5)
  - A pool of available recipes with their nutritional data
  - Any preferences ("I had chicken yesterday", "no fish this week")
- Claude returns a structured meal plan: `{ date → meal }` hitting daily targets within ±10%
- Plan is loaded directly into the mealplan state (same data structure as manual planning)
- User can regenerate individual days or the full week
- "Why this meal?" explainability: tap a meal to see which macro it's fulfilling

**Claude API integration**:
- Use `claude-sonnet-4-6` for plan generation (balance speed + quality)
- Structured output: JSON meal plan
- Prompt includes macro targets, available recipes with nutrition, constraints
- Rate-limit: 1 plan generation per minute per user (prevent abuse)

**Acceptance criteria**:
- Generated plan hits daily macro targets within ±10%
- Respects all dietary restrictions
- No meal repeated more than once per week
- Works end-to-end: targets → plan → shopping list

---

### M.5 — Macro-Aware Roll
`feature/m.5-macro-roll` | **Effort**: 3–5 days | **Depends on**: M.1, M.2

The existing "roll" button becomes macro-intelligent. Instead of random, it picks a recipe that fits the day's **remaining** macros.

**What**:
- When rolling for a day slot, calculate remaining macros (target - already planned meals that day)
- Pass remaining macros + dietary restrictions to Claude API
- Claude picks the best-fitting recipe from the available pool
- Show the macro fit score: "This meal fills 82% of your remaining protein"

**Acceptance criteria**:
- Rolled meal contributes toward hitting daily targets
- Falls back to random roll if no macro data available
- Works without AI (heuristic: pick recipe closest to remaining targets from cache)

---

## 🏥 Phase D: Dietitian Mode
**Goal**: B2B revenue. Dietitians use FoodRoller to generate and share meal plans with clients at scale.

---

### D.1 — Client Profile Management
`feature/d.1-client-profiles` | **Effort**: 2–3 weeks | **Depends on**: M.4

**What**:
- Dietitian account type (role flag in Firestore)
- Create/edit/delete client profiles: name, macro targets, dietary restrictions, notes
- Switch between client profiles to plan on their behalf
- Client profiles listed in a sidebar/dashboard

---

### D.2 — Shareable Meal Plans
`feature/d.2-shareable-plans` | **Effort**: 2–3 weeks | **Depends on**: D.1

**What**:
- Generate a shareable read-only link for any meal plan (`/plan/abc123`)
- Client opens link → sees their week with meals, macros, shopping list
- Optional: client can mark meals as completed
- PDF export of the full plan (dietitian branding)

---

## 🚀 Phase 2: Identity & Infrastructure (Existing, Reprioritized)

### P2.0 — Context Architecture Refactoring
`feature/p2.0-context-refactor` | **Effort**: 1–2 weeks | **Depends on**: M.1

Move global state from App.jsx (11+ useState) to React Context. Needed before macro dashboard complexity lands. See ARCHITECTURE.md Phase 2.

### P2.1 — PWA
`feature/p2.1-favorites` | **Effort**: 3–5 days

Install to home screen, offline plan viewing. Macro tracking happens on the phone — this matters.

### P2.2 — Favorite Recipes
`feature/p2.2-print-recipe` | **Effort**: 3–4 days

Favorites inform the AI planner ("prefer meals from my favorites"). Heart icon on cards, cloud-synced.

### P1.2 — Recipe Search
`feature/p1.2-recipe-search` | **Effort**: 4–6 days

Search by name + ingredient. Useful for finding macro-friendly recipes specifically.

---

## 💰 Monetization

### PM.1 — Freemium Implementation
`feature/pm.1-freemium` | **Effort**: 1 week product + 2 weeks billing | **Depends on**: M.4

| Free | Premium (~€9/mo) | Dietitian (~€49/mo) |
|------|-----------------|---------------------|
| Manual meal planning | **AI macro planner** | All Premium |
| Basic dietary filters | Full macro dashboard | Unlimited client profiles |
| Shopping list | Unlimited plan history | Shareable client plans |
| — | Smart pantry | PDF export |

- Stripe (or Paddle for EU VAT) for billing
- Feature gates at natural friction points (plan generation = premium trigger)

---

## 🌐 Phase 3: Social & Scale

| Item | Branch | Effort | Notes |
|------|--------|--------|-------|
| Share meal plan (public link) | `feature/p3.2-share-meal-plan` | 3–4 weeks | Read-only plan pages, OG cards |
| Plan templates (bulk/cut/etc.) | new | 2–3 weeks | AI-generated starting points |
| Smart pantry | `feature/p2.5-smart-pantry` | 3–4 weeks | Cross-reference pantry with macro plan |
| Social feed (browse community plans) | `feature/p3.4-social-feed` | 4–6 weeks | Filter by macro profile |
| Admin / impersonation | `feature/p3.3-admin-impersonation` | 1–2 weeks | Support tooling |
| Native mobile app | `feature/p4.4-mobile-app` | 8–12 weeks | React Native, after Context refactor |
| Grocery delivery integration | new | 3–4 weeks | Export plan to Instacart/etc. |
| Localization (i18n) | `feature/p4.5-localization` | 3–4 weeks | After PMF |

---

## ⚠️ Deprioritized / Removed

- **Recipe History / Recently Viewed** (P1.3) — low value in macro-focused product
- **Service Layer Refactoring** (P1.4) — absorb into Context refactor (P2.0)
- **Recipe Tags** — superseded by nutritional data as the key metadata
- **Print Recipe** — covered by PDF export in Dietitian mode
- **Halal/Kosher filters** — small segment, defer

---

*Last updated: April 28, 2026 — Strategic pivot to macro-focused AI meal planning for dietitians and macro trackers*
