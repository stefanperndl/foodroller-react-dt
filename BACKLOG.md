# FoodRoller Backlog

**North Star Metric**: Weekly Macro Plans Generated — users who generate at least one AI macro-planned week per week.

**Strategic direction**: Consumer adoption first. Reach alpha (family & friends, all features free) with a complete, personal experience. Monetization deferred until adoption is proven.

**Key insight**: TheMealDB is demo data. Custom recipes are the unlock — the AI planner only becomes personal and sticky when users own their recipe corpus.

**Prioritization order**: (1) Consumer core UX → (2) Own your data (custom recipes) → (3) Polish & personalization → 🎯 Alpha launch → (4) Dietitian completion → (5) Intelligence layer → (6) Platform/social → (7) Go paid

**Current focus**: Milestone 1 — Consumer Core

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

### S.2 — Recipe Image Detection *(New)*
`feature/s.2-image-detection` | **Effort**: ~1 week | **Depends on**: S.1

User uploads or drags a photo of a dish into the create recipe form. Claude Vision analyzes the image and pre-fills name, category, and ingredient suggestions. Dramatically reduces friction for meals the user already cooks.

**What**:
- Trigger: after image is dropped/uploaded in `CustomRecipeModal`, show "Detect recipe?" prompt
- New `/api/detect-recipe` route: passes image URL to Claude with vision + structured output prompt
- Claude returns `{ name, category, ingredients[], confidence }` → pre-fills form fields
- Low-confidence results shown with a "Review suggested fields" banner
- User can accept, reject, or edit suggestions before saving
- No auto-detection if user declines or image is clearly non-food

**Acceptance criteria**:
- Photo of a recognizable dish pre-fills name and category with >80% accuracy on common dishes
- Ingredient suggestions shown with confirm step before overwriting existing fields
- Graceful fallback (no error) if Claude unavailable
- Works with both uploaded files (Vercel Blob URL) and pasted image URLs

> **⚠️ Discussion needed before pickup**: AI approach is undecided. Topics to align on: (1) use AI at all vs. simpler heuristics? (2) which model — Claude vision, GPT-4o, Gemini? (3) cost per request and whether to gate behind premium. Do not start implementation without this conversation.

---

### D.3 — Share Management UI
`feature/d.3-share-management` | **Effort**: 3–5 days | **Depends on**: D.2

Dietitian sees a list of all active shared plan links and can revoke/delete them.

**What**:
- Firestore query: `sharedPlans` where `ownerId == uid`
- List with title, date range, created date, expiry status
- Delete button per share → removes from Firestore
- Accessible via Dietitian mode menu

---

### D.4 — White-label PDF Export *(New)*
`feature/d.4-pdf-export` | **Effort**: ~3 days | **Depends on**: D.2

Dietitian tier promises branded PDF delivery. Browser print (D.2) is not sufficient — clients expect a polished PDF with the dietitian's name/practice.

**What**:
- PDF template with dietitian name + practice name as header
- Includes meals, macros per meal, daily totals, shopping list
- Generated server-side (avoid browser print limitations)
- Downloadable from the share management UI and the shared plan page

---

### D.5 — Client Analytics Dashboard *(New)*
`feature/d.5-client-analytics` | **Effort**: ~1 week | **Depends on**: D.2, D.3

Dietitian tier promises "Analytics per client." Simple adherence and macro achievement read from existing Firestore data.

**What**:
- Per-client view: meals marked complete vs planned, macro achievement % per week
- Week-over-week trend (simple line chart)
- Accessible from client manager (D.1 UI)

---

### MP.1 — Meal Prep Mode *(New)*
`feature/mp.1-meal-prep` | **Effort**: ~1 week | **Depends on**: M.4, S.1

Users who batch-cook on weekends need more than a meal plan — they need a prep schedule. This feature surfaces prep-friendly groupings and a step-by-step Sunday prep guide from the weekly plan.

**What**:
- Identify "prep-friendly" steps per recipe (chop, marinate, par-cook, sauce) and surface them in a dedicated Prep tab on the weekly plan
- Group identical or complementary ingredients across all planned meals into a single batch task (e.g., "chop 400 g onion for Mon + Wed meals")
- Generate a sequenced prep schedule: what to do first, estimated time per task, what can rest in the fridge vs. freezer
- Visual checklist: user ticks off tasks as they prep; progress persists in Firestore
- Badge on meal cards: "Prepped ✓" after all prep tasks for that meal are checked

**Acceptance criteria**:
- Weekly plan view has a "Prep" tab alongside Day/Week
- Grouped ingredient tasks cover all planned meals with correct quantities (uses ingredient merging from utils.js)
- Sequenced schedule respects cooking dependencies (e.g., marinate before cook)
- Checklist state syncs to Firestore; survives refresh
- Works for both TheMealDB and custom recipes

---

### P2.1 — PWA
`feature/p2.1-pwa` | **Effort**: 3–5 days

Install to home screen, offline plan viewing. Macro tracking and meal planning happen on the phone — this matters for fitness users.

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

*Last updated: May 5, 2026 — added MP.1 Meal Prep Mode to Post-Alpha backlog*
