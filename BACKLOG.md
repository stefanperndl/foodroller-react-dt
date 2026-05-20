# FoodRoller Backlog

**North Star Metric**: Weekly Macro Plans Generated — users who generate at least one AI macro-planned week per week.

**Strategic direction**: Consumer adoption first. Reach alpha (family & friends, all features free) with a complete, personal experience. Monetization deferred until adoption is proven.

**Key insight**: TheMealDB is demo data. Custom recipes are the unlock — the AI planner only becomes personal and sticky when users own their recipe corpus.

**Prioritization order**: (1) Consumer core UX → (2) Own your data (custom recipes) → (3) Polish & personalization → 🎯 Alpha launch → (4) Dietitian completion → (5) Intelligence layer → (6) Platform/social → (7) Go paid

**Current focus**: Milestone 1 — Consumer Core

> **Active work tracked in GitHub Project**: [Foodroller board](https://github.com/users/zenith0/projects/1)
> This file holds strategy, history, and parking-lot items. Anything in-flight or near-term is an issue on the board.

---

## ✅ Recently Completed

| Feature | Version | Notes |
|---------|---------|-------|
| Discover + Favorites (P2.2) | v4.2 | Tinder-style startpage; swipe right = favorite (Firestore ref); client-side macro-fit ranking; MealDB fallback pool; ❤️ on all cards; Liked tab in My Recipes; click-to-view in My Recipes |
| Stock Recipe Corpus (R.1) | v4.1 | Chefkoch ingest pipeline; useStockRecipes; MacroContext allRecipes union; Curated badge; German→English nutrition via Haiku |
| Context Architecture Refactoring (P2.0) | v4.0 | FilterContext/MacroContext/MealPlanContext; App.jsx 460→130 LOC; D.2 route stub |
| Client Profile Management (D.1) | v3.5 | Dietitian role, client CRUD, effectiveMacroProfile switching |
| AI Macro-Aware Meal Planner (M.4) | v3.0 | Claude API tool-use, candidate fetch + nutrition enrichment |
| Macro Dashboard (M.3) | v3.0 | Day cards with SVG rings, color-coded status, real-time updates |
| Macro Profile Setup (M.2) | v3.0 | Goal calculator (Mifflin-St Jeor), Firestore + localStorage sync |
| Macro-Aware Roll (M.5) | v2.5 | Claude-powered slot roll against remaining daily macros |
| Nutritional Data Layer (M.1) | v2.4 | Edamam integration, Firestore cache, per-recipe macro badges |
| User Accounts & Auth | v2.3 | Firebase Auth (Google + email), Firestore sync per user, sign-out clears state |
| Onboarding Wizard (UX.1) | v2.4 | 5-step full-screen wizard (auth→goal→targets→diet→AI week); `onboarding_v1` localStorage + Firestore sync; 256 tests pass |
| Shareable Meal Plans (D.2) | v2.3 | Snapshot link `/plan/abc123`, 30-day TTL, client view with macros + shopping list |
| Export Shopping List | v1.3 | Copy, CSV, Print/PDF |
| Recipe Detail Modal | v1.2 | Full ingredients, instructions, dietary badges |
| Recipe Catalog / Browse | v1.1 | Grid, category + dietary filter |
| Dietary Restrictions | v1.0 | Vegetarian, Vegan, Pescatarian |
| Automated Testing / CI | v0.7 | Jest + RTL, GitHub Actions, Vercel deploy |

---

## 🎯 Milestone 1 — Consumer Core
**Goal**: All 5 VISION.md magic moments are playable. A new user can reach value in under 5 minutes.

---

### ~~UX.1 — Onboarding Wizard~~ ✅ DONE
`feature/ux.1-onboarding` — merged to master

---

### ✅ M.6 — AI Meal Swap & Rebalance
`feature/m.6-meal-swap` | **Effort**: ~1 week | **Depends on**: M.4 | **Done**: 2026-05-04

Magic Moment #4 from VISION.md: *"It adjusted when I swapped a meal."* Currently when a user replaces a meal the rest of the week stays static. This feature makes the AI rebalance.

**What**:
- When a user swaps out a planned meal, call Claude with: removed meal macros + remaining day/week targets + existing planned meals
- Claude suggests replacement meals that close the macro gap for the week
- Show delta: "Swapping this adds 20g protein to your gap — here's a meal that fills it"
- Falls back gracefully if Claude unavailable (random roll from pool)

**Acceptance criteria**:
- Swapping a meal triggers a rebalanced suggestion for the slot
- Weekly macro totals visibly improve after accepting a swap
- Works with both TheMealDB and future custom recipes

---

## 📦 Milestone 2 — Own Your Recipe Data
**Goal**: TheMealDB is no longer the primary corpus. Users build and own their personal recipe library. The AI plans from real, relevant recipes.

---

### ✅ S.1 — Custom Recipe Creation & Import ⭐ (Promoted from Phase 3)
`feature/s.1-custom-recipes` | **Done**: 2026-05-04 | **Depends on**: M.1, User Accounts

TheMealDB is public demo data with no personal relevance. Custom recipes are the foundation of a personal, sticky product. Promoted to near-term from Phase 3.

**What**:
- **Create**: form to build a recipe from scratch (name, servings, ingredients with amounts, instructions, image upload via Vercel Blob, dietary tags)
- **Fork / Modify**: clone any TheMealDB recipe as a personal copy, edit freely — this is the migration path away from demo data
- **Nutrition**: auto-analyze via Edamam on save (reuses M.1); manual override allowed
- **Import from URL**: paste any recipe URL → scrape via serverless function → prefill create form for review before saving
- **Storage**: custom recipes saved to Firestore under `users/{uid}/recipes`; `source: "custom"` flag distinguishes from TheMealDB
- **AI planner integration**: custom recipes appear in the AI planner pool alongside (or eventually replacing) TheMealDB recipes
- **Privacy**: all recipes private by default; `published` toggle for future social feed (S.2)

**Acceptance criteria**:
- User can create, edit, delete their own recipes
- Forking a TheMealDB recipe produces an editable personal copy
- Nutrition auto-calculated on save; graceful fallback if Edamam unavailable
- URL import prefills form with >80% accuracy for common recipe sites
- Custom recipes appear in AI planner pool and can be rolled
- Published recipes queryable for future social feed

---

## 🎯 Alpha Launch — Family & Friends (all free)
Product is genuinely personal and useful with user-owned recipe data. All magic moments work.

**Measure after launch**:
- Weekly Macro Plans Generated (North Star)
- Custom recipes created per user
- Onboarding completion rate
- Meal swap / rebalance usage
- URL import success rate

---

## 🔜 Post-Alpha: Polish & Personalization

Active items live on the [GitHub Project board](https://github.com/users/zenith0/projects/1):

| ID | Item | Issue |
|----|------|-------|
| S.2 | Recipe Image Detection ⚠️ discussion-needed | [#4](https://github.com/zenith0/foodroller-react/issues/4) |
| D.3 | Share Management UI | [#5](https://github.com/zenith0/foodroller-react/issues/5) |
| D.4 | White-label PDF Export | [#6](https://github.com/zenith0/foodroller-react/issues/6) |
| D.5 | Client Analytics Dashboard | [#7](https://github.com/zenith0/foodroller-react/issues/7) |
| MP.1 | Meal Prep Mode | [#8](https://github.com/zenith0/foodroller-react/issues/8) |
| P2.1 | PWA | [#9](https://github.com/zenith0/foodroller-react/issues/9) |

---

### ✅ P2.2 — Favorite Recipes + Discover *(combined)*
`feature/r.1-recipe-corpus` | **Done**: 2026-05-05

Tinder-style Discover view as the new startpage. Swipe right = like → saved to `users/{uid}/favorites` (reference only). Client-side macro-fit ranking (instant, no API call). MealDB fallback pool for unauthenticated/no-stock-uid dev. ❤️ toggle on all RecipeCards. "Liked" tab in My Recipes with click-to-view modal.

---

## 🧠 Milestone 4 — Intelligence Layer *(2027)*

| Item | Effort | Notes |
|------|--------|-------|
| Smart pantry | 3–4 weeks | Cross-reference pantry with macro-optimal meals |
| Plan templates (bulk/cut/maintenance) | 2–3 weeks | AI-generated starting points for common goals |
| Swap learning | ongoing | AI improves from reject/swap signals over time |

---

## 🌐 Milestone 5 — Platform & Social *(2027–2028)*

| Item | Branch | Effort | Notes |
|------|--------|--------|-------|
| Social feed (browse community plans) | `feature/p3.4-social-feed` | 4–6 weeks | Filter by macro profile; **depends on S.1** |
| Native mobile app | `feature/p4.4-mobile-app` | 8–12 weeks | React Native |
| Grocery delivery integration | new | 3–4 weeks | Export plan to Instacart/etc. |
| Localization (i18n) | `feature/p4.5-localization` | 3–4 weeks | After PMF |

---

## 💰 Go Paid — Freemium + Billing *(post-PMF)*

**Trigger**: consistent North Star engagement + positive alpha feedback signal.

| Free | Premium (~€9/mo) | Dietitian (~€49/mo) |
|------|-----------------|---------------------|
| Manual meal planning | **AI macro planner** | All Premium |
| Basic dietary filters | Full macro dashboard | Unlimited client profiles |
| Shopping list | Unlimited plan history | Shareable client plans |
| — | Smart pantry | White-label PDF export |
| — | — | Analytics per client |

- Billing: Paddle (recommended for EU VAT handling) or Stripe
- Feature gates at natural friction points (AI plan generation = premium trigger)

---

## ⚠️ Deprioritized / Removed

- **Recipe Search** (P1.2) — AI handles discovery; low value in AI-first model
- **Admin / Impersonation** — support tooling; defer until user base warrants it
- **Recipe History / Recently Viewed** (P1.3) — low value in macro-focused product
- **Service Layer Refactoring** (P1.4) — absorbed into Context refactor (P2.0)
- **Recipe Tags** — superseded by nutritional data as the key metadata
- **Print Recipe** — covered by PDF export in Dietitian mode
- **Halal/Kosher filters** — small segment, defer

---

*Last updated: May 20, 2026 — active near-term items migrated to [GitHub Project](https://github.com/users/zenith0/projects/1)*
