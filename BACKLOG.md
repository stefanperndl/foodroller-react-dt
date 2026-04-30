# FoodRoller Backlog

**North Star Metric**: Weekly Macro Plans Generated — users who generate at least one AI macro-planned week per week.

**Strategic pivot**: FoodRoller targets macro trackers, weight loss journeys, and dietitians. AI is the core product, not a feature.

**Branching**: every item has a dedicated branch off `master`. Master stays stable and deployable at all times.

**Prioritization order**: (1) Nutritional data foundation → (2) Macro planning UI → (3) AI plan generation → (4) Dietitian mode → (5) Monetization → (6) Social

**Current focus**: Phase D — D.2 Shareable Meal Plans

---

## ✅ Recently Completed

| Feature | Version | Notes |
|---------|---------|-------|
| Context Architecture Refactoring (P2.0) | v4.0 | FilterContext/MacroContext/MealPlanContext; App.jsx 460→130 LOC; D.2 route stub |
| Client Profile Management (D.1) | v3.5 | Dietitian role, client CRUD, effectiveMacroProfile switching |
| AI Macro-Aware Meal Planner (M.4) | v3.0 | Claude API tool-use, candidate fetch + nutrition enrichment |
| Macro Dashboard (M.3) | v3.0 | Day cards with SVG rings, color-coded status, real-time updates |
| Macro Profile Setup (M.2) | v3.0 | Goal calculator (Mifflin-St Jeor), Firestore + localStorage sync |
| Macro-Aware Roll (M.5) | v2.5 | Claude-powered slot roll against remaining daily macros |
| Nutritional Data Layer (M.1) | v2.4 | Edamam integration, Firestore cache, per-recipe macro badges |
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

### D.1 — Client Profile Management ✅
`feature/d.1-client-profiles` | Merged to master

---

### D.2 — Shareable Meal Plans ✅
`feature/d.2-shareable-plans` | Merged to master

Snapshot-based shareable link (`/plan/abc123`). 30-day TTL. Client sees meals, macros, shopping list. Can mark meals completed. Print/PDF via browser print. Dietitian name shown as header.

---

### D.3 — Share Management UI
`feature/d.3-share-management` | **Effort**: 3–5 days | **Depends on**: D.2

Dietitian sees a list of all active shared plan links they've created and can revoke/delete individual links.

**What**:
- Firestore query: `sharedPlans` where `ownerId == uid` (requires adding `ownerId` field in D.2 — already included)
- UI: list of shares with title, date range, created date, expiry status
- Delete button per share → removes from Firestore
- Accessible via Dietitian mode menu or client manager

---

## 🚀 Phase 2: Identity & Infrastructure (Existing, Reprioritized)

### P2.0 — Context Architecture Refactoring ✅
`feature/p2.0-context-refactor` | Merged to master

FilterContext / MacroContext / MealPlanContext. App.jsx 460→130 LOC. D.2 route stub at `/plan/[shareId]`.

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

### S.1 — Custom Recipe Creation & Import ⭐ SOCIAL PREREQUISITE
`feature/s.1-custom-recipes` | **Effort**: 2–3 weeks | **Depends on**: M.1, User Accounts

Users can create their own recipes and import from URLs. Custom recipes feed the AI planner pool and are the atomic unit of the social network — without them, the social feed has nothing user-generated to share.

**What**:
- **Create**: form to build a recipe from scratch (name, servings, ingredients with amounts, instructions, image upload via Vercel Blob, dietary tags)
- **Nutrition**: auto-analyze via Edamam on save (reuses M.1 infrastructure); manual override allowed
- **Import from URL**: paste any recipe URL → scrape via a serverless function (use `recipe-scraper` or similar) → prefill the create form for review before saving
- **Storage**: custom recipes saved to Firestore under `users/{uid}/recipes`; a `source: "custom"` flag distinguishes them from TheMealDB recipes
- **AI planner integration**: custom recipes appear in the pool available to M.4 and M.5 alongside TheMealDB recipes
- **Publish toggle**: recipes start private; user can publish to make them discoverable in the social feed (S.2)

**Acceptance criteria**:
- User can create, edit, and delete their own recipes
- Nutrition is auto-calculated on save; falls back gracefully if Edamam unavailable
- URL import prefills form with >80% accuracy for common recipe sites
- Custom recipes appear in AI planner pool and can be rolled
- Published recipes are queryable for the social feed

---

| Item | Branch | Effort | Notes |
|------|--------|--------|-------|
| Share meal plan (public link) | `feature/p3.2-share-meal-plan` | 3–4 weeks | Read-only plan pages, OG cards |
| Plan templates (bulk/cut/etc.) | new | 2–3 weeks | AI-generated starting points |
| Smart pantry | `feature/p2.5-smart-pantry` | 3–4 weeks | Cross-reference pantry with macro plan |
| Social feed (browse community plans) | `feature/p3.4-social-feed` | 4–6 weeks | Filter by macro profile; **depends on S.1** |
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

*Last updated: April 30, 2026 — P2.0 + D.1 complete; D.2 Shareable Meal Plans now active*
