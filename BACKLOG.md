# FoodRoller Backlog

**Primary metric**: Weekly Active Meal Planners (WAMP) — users who add ≥1 meal per week.  
**Branching**: every item has a dedicated branch off `master`. Master stays stable and deployable at all times.

**Prioritization order**: (1) Core loop completion → (2) Identity + accounts → (3) AI differentiation → (4) Monetization → (5) Social → (6) Scale

---

## ✅ Recently Completed

| Feature | Version | Notes |
|---------|---------|-------|
| Export Shopping List | v1.3 | Copy to clipboard, CSV download, Print/PDF — no new dependencies |
| Recipe Detail Modal | v1.2 | Full ingredients, instructions, dietary badges, "Add to Date" |
| Recipe Catalog / Browse View | v1.1 | Grid, category + dietary filter, tab navigation |
| Dietary Restrictions | v1.0 | Vegetarian, Vegan, Pescatarian with retry + validation |
| Category-based Filtering | v1.0 | Multi-select with single-category API workaround |
| Ingredient Merging | v0.9 | Merged shopping cart with unit conversion |
| Next.js Migration | v0.8 | App Router, static export |
| Automated Testing (CI) | v0.7 | Jest + RTL, GitHub Actions |

---

## 🎯 Phase 1: Core Loop Completion
**Goal**: Make the core roll→plan→shop→cook loop fully functional and tested.

### P1.0 — Test Coverage ⭐ CRITICAL
`feature/p1.0-test-coverage` | **Effort**: 1–2 weeks

Must reach 70%+ coverage before any refactoring. Currently only ShoppingCart is tested.

- Component tests (RTL): RecipeCard, RecipeDetailModal, FoodList, RecipeBrowser, CategorySidebar
- Integration tests: API functions (MSW mocks), dietary restriction validation, useMealplan hook
- E2E (Playwright): Browse → View → Add to Date → Shopping Cart flow
- CI enforces threshold on every PR

---

### ~~P1.1 — Export Shopping List~~ ✅ DONE
`feature/p1.1-export-shopping-list` — merged v1.3

Copy to clipboard, CSV download, Print/PDF via browser print. No new dependencies.

---

### P1.2 — Recipe Search
`feature/p1.2-recipe-search` | **Effort**: 4–6 days

Browse-by-category is limiting. Search by name + ingredient, with autocomplete and search history (localStorage).

---

### P1.3 — Recipe History / Recently Viewed
`feature/p1.3-recipe-history` | **Effort**: 2–3 days

Track last 20 viewed recipes in localStorage. "Recently Viewed" section in Browse. Builds caching patterns for later.

---

### P1.4 — Service Layer Refactoring
`feature/p1.4-service-layer` | **Effort**: 1–2 weeks | **Depends on**: P1.0

Decouple components from TheMealDB. RecipeService + TheMealDBAdapter. Canonical recipe schema. Enables multi-source data.  
See ARCHITECTURE.md Phase 1 for step-by-step.

---

## 🚀 Phase 2: Identity + AI Differentiation
**Goal**: Unlock personalization (the core commercial differentiator) via user accounts and AI.

### P2.0 — Context Architecture Refactoring
`feature/p2.0-context-refactor` | **Effort**: 1–2 weeks | **Depends on**: P1.4

Move global state from App.jsx (11+ useState) to React Context. RecipeContext, MealPlanContext, UIContext. 50%+ reduction in App.jsx. Unlocks React Native portability.  
See ARCHITECTURE.md Phase 2.

---

### P2.1 — Progressive Web App (PWA)
`feature/p2.1-favorites` | **Effort**: 3–5 days

> **Note**: Branch was created as `feature/p2.1-favorites` — rename or create `feature/pwa` if splitting.

VISION milestone for 2025–26. Install to home screen, offline browsing of saved plans, push notifications for meal reminders. Uses Next.js PWA plugin (next-pwa).

---

### P2.2 — Favorite Recipes
`feature/p2.2-print-recipe` | **Effort**: 3–4 days

> **Note**: Branch mismatch above — see naming note. Actual favorites work:

Heart icon on recipe cards, Favorites tab in Browse, prioritize favorites in random rolls. localStorage initially, cloud-ready.

---

### P2.3 — User Accounts & Authentication ⭐ COMMERCIAL GATE
`feature/p3.1-user-accounts` | **Effort**: 2–3 weeks

**Blocks all monetization, AI personalization, and social features.** Must decide on backend first.

- Google OAuth (fastest) + email/password
- Anonymous → authenticated migration (preserve localStorage data)
- Profile page (username, dietary preferences)
- **Recommended backend**: Firebase Auth + Firestore (fastest to market, scales to Phase 3)

---

### P2.4 — AI Personalization ⭐ KEY DIFFERENTIATOR
`feature/p2.4-recipe-tags` | **Effort**: 2–3 weeks | **Depends on**: P2.3

From VISION: "AI that learns preferences automatically." This is what separates FoodRoller from a plain recipe browser.

- Track which rolls the user keeps vs discards (implicit feedback)
- Claude API integration: smarter roll suggestions based on history, season, recent meals
- "Why this meal?" explainability (builds trust)
- Preference profile stored per user account

**Commercial note**: AI-powered rolls are the premium tier anchor feature.

---

### P2.5 — Smart Pantry Tracking
`feature/p1.4-service-layer` | **Effort**: 3–4 weeks | **Depends on**: P2.3

From VISION milestone 2025–26. Track what ingredients the user has; cross-reference with meal plan shopping list to avoid buying duplicates. Reduces food waste (core value prop).

> **Note**: Needs its own branch — `feature/p2.5-smart-pantry`

---

## 💰 Phase 2.5: Monetization
**Goal**: Generate revenue. Without this, no commercial project.

### PM.1 — Freemium Tier Definition
`feature/pm.1-freemium` (create branch) | **Effort**: 1 week (product) + 2 weeks (billing)

Define and implement free vs premium split. Recommended model:

| Free | Premium (~€5/mo) |
|------|-----------------|
| Unlimited rolls | AI-powered roll suggestions |
| 1 active meal plan | Unlimited saved plans |
| Basic dietary filters | All dietary profiles + custom |
| Shopping list (clipboard) | PDF export + email delivery |
| — | Nutrition data |
| — | Cloud sync + mobile app |

- Integrate Stripe (or Paddle for EU VAT handling)
- Gate premium features behind subscription check
- "Upgrade" prompt at natural friction points (e.g., third plan, AI roll)

---

## 🌐 Phase 3: Social Features
**Goal**: Viral growth through sharing and community. Requires backend from P2.3.

### P3.1 — Share Meal Plan
`feature/p3.2-share-meal-plan` | **Effort**: 3–4 weeks | **Depends on**: P2.3

Shareable links (`/plans/abc123`), public/private toggle, Open Graph preview cards, "Fork this plan" button.

### P3.2 — Social Feed & Discovery
`feature/p3.4-social-feed` | **Effort**: 4–6 weeks | **Depends on**: P3.1

Explore feed (popular plans this week), search by tags/dietary/author, likes/saves.

### P3.3 — Comments & Ratings
`feature/p3.5-comments-ratings` | **Effort**: 3–4 weeks | **Depends on**: P3.2

Star ratings, comments, sort by popularity, moderation queue.

### P3.4 — Admin / User Impersonation
`feature/p3.3-admin-impersonation` | **Effort**: 1–2 weeks | **Depends on**: P2.3

Admin panel, impersonation banner, audit log. Required for support once user accounts exist.

---

## 🎨 Phase 4: Scale & Polish

| Item | Branch | Effort | Notes |
|------|--------|--------|-------|
| Expand dietary restrictions (Gluten-free, Keto, custom) | `feature/p2.3-dietary-expansion` | 3–5 days | API ingredient data quality limits this |
| Print Recipe | `feature/p2.2-print-recipe` | 1–2 days | `@media print` + window.print() |
| Nutritional information | `feature/p4.1-nutritional-info` | 4–6 weeks | Requires premium API (Spoonacular/Edamam) |
| Calendar view (drag-drop) | `feature/p4.2-calendar-view` | 2–3 weeks | react-big-calendar |
| Manual recipe entry | `feature/p4.3-manual-recipe-entry` | 3–4 weeks | User-generated content |
| Native mobile app | `feature/p4.4-mobile-app` | 8–12 weeks | React Native reuse of Context layer |
| Localization (i18n) | `feature/p4.5-localization` | 3–4 weeks | next-intl; after English PMF |
| Premium API upgrade | `feature/p4.6-premium-api` | 2–3 weeks | Removes free-API workarounds |
| Recipe tags / metadata | — | 2–3 days | Blocked on API data |

---

## ⚠️ Deprioritized

- Manual category entry (low value, comprehensive existing categories)
- Halal/Kosher filters (small segment, needs specialized data)
- Social network features before product-market fit proven

---

*Last updated: April 28, 2026 — P1.1 Export Shopping List shipped*
