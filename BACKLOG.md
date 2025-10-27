# FoodRoller Backlog

This file lists planned features prioritized by strategic impact on the platform's evolution toward API flexibility and social meal planning.

**Prioritization Criteria:**
1. **Foundation First**: Features enabling API swapping and multi-source data
2. **User Retention**: Core improvements that keep existing users engaged
3. **Social Readiness**: Features preparing for community/sharing capabilities
4. **Growth Enablers**: Viral loops and discovery mechanisms
5. **Nice-to-Have**: Polish and convenience features

---

## ✅ Recently Completed

- **Recipe Detail View/Modal** (v1.2):  
  Click any recipe card to view full details including ingredients, cooking instructions, cuisine, dietary badges, and tags. Modal displays with dark grey/white styling, compact multi-column ingredient layout, and prominent dietary restriction badges. Includes "Add to Date" button in Browse view.

- **Recipe Catalog/Browse View** (v1.1):  
  Browse recipes by category before adding to plan. Includes responsive grid, category filtering, dietary restriction filtering, "Add to Date" functionality with modal, and tab-based navigation between Plan and Browse views.

- **Dietary Restrictions** (v1.0):  
  Three preset dietary filters (Vegetarian 🌱, Vegan 🥗, Pescatarian 🐟) with automatic category filtering and ingredient validation. Includes retry logic and client-side validation to work with free API limitations.

- **Category-based Meal Filtering** (v1.0):  
  Select multiple categories in sidebar to filter meal suggestions (with workaround for free API's single-category limitation).

- **Ingredient Merging** (v0.9):  
  Shopping cart merges and sums similar ingredients, displays which meals need each, and handles unit conversions (e.g., tbs to g/ml).

- **Next.js Migration** (v0.8):  
  Project migrated to Next.js app directory (v15+) with static export mode.

- **Automated Testing** (v0.7):  
  Test suite for ingredient merging logic (Jest, React Testing Library) with GitHub Actions CI workflow.

---

## 🎯 Phase 1: Foundation (API Flexibility)
**Goal**: Prepare architecture for API swapping and data source flexibility

### P1.0 - Test Coverage for Refactoring Safety ⭐ CRITICAL
**Impact**: Prevents regressions during refactoring, enables confident code changes  
**Effort**: 1-2 weeks  
**Why Now**: Must test existing functionality BEFORE refactoring. Without tests, we risk breaking features during service layer/context migrations.

**Coverage Goals**:
- **Component Tests** (React Testing Library):
  - RecipeCard rendering and click interactions
  - RecipeDetailModal lazy loading and data display
  - FoodList meal plan display and interactions
  - RecipeBrowser filtering and category selection
  - CategorySidebar filter state management
  - ShoppingCart ingredient merging (already has tests ✅)
  
- **Integration Tests**:
  - API fetch functions (mock TheMealDB responses)
  - Dietary restriction validation logic
  - Ingredient parsing and normalization
  - localStorage persistence (useMealplan hook)
  
- **E2E Tests** (Playwright or Cypress):
  - Full user flow: Browse → View Recipe → Add to Date → Shopping Cart
  - Filter by category and dietary restrictions
  - Roll random meal and add to plan
  - Export shopping list (after P1.1)

**Test Infrastructure**:
- Jest + React Testing Library (already configured ✅)
- Mock Service Worker (MSW) for API mocking
- Playwright or Cypress for E2E (choose based on preference)
- GitHub Actions CI to run tests on every PR
- Coverage threshold: 70%+ before starting refactors

**Success Criteria**:
- All existing features have test coverage
- CI pipeline runs tests automatically
- Can refactor with confidence (tests catch regressions)

---

### P1.1 - Export Shopping List ⭐ NEXT
**Impact**: User retention (most requested feature), data portability preparation  
**Effort**: 3-5 days  
**Why Now**: Users need this for grocery shopping (core use case). Also teaches us about data export patterns needed for API migration.

**Features**:
- Export as PDF (print-friendly checklist)
- Export as CSV (spreadsheet import)
- Email shopping list (requires email service integration)
- Copy to clipboard (quick share)

**Technical Notes**: Use jsPDF or Puppeteer for PDF generation, EmailJS or SendGrid for email delivery.

---

### P1.2 - Recipe Search
**Impact**: Improves discovery, reduces friction, tests multi-API capability  
**Effort**: 4-6 days  
**Why Now**: Current browse-by-category is limiting. Search reveals API query patterns for future multi-source integration.

**Features**:
- Search by recipe name across all categories
- Search by ingredient (e.g., "chicken", "lemon")
- Autocomplete/suggestions for better UX
- Search history (localStorage)

**Technical Notes**: TheMealDB has search endpoints. This feature validates our adapter pattern can handle different query types.

**Tests Required**:
- Search input debouncing
- API call with search query
- Empty state handling (no results)
- Search history persistence

---

### P1.3 - Recipe History & Recently Viewed
**Impact**: User retention (easier to find recipes they liked)  
**Effort**: 2-3 days  
**Why Now**: Builds localStorage persistence patterns needed for offline-first architecture. Low effort, high user satisfaction.

**Features**:
- Track last 20 viewed recipes (localStorage)
- "Recently Viewed" section in Browse view
- Clear history button
- Jump back to recipe from history

**Technical Notes**: Simple localStorage implementation, tests our caching strategy.

**Tests Required**:
- History tracking on recipe view
- localStorage persistence and retrieval
- History limit (max 20 items)
- Clear history functionality

---

### P1.4 - Service Layer Refactoring (ARCHITECTURE Phase 1)
**Impact**: Enables API swapping, reduces coupling, prepares for multi-source data  
**Effort**: 1-2 weeks  
**Why Now**: After test coverage in place (P1.0), can safely refactor with confidence.

**Refactoring Steps**:
1. **Create RecipeService abstraction**
   - Wraps all recipe data fetching logic
   - Components call service instead of API directly
   - Service returns canonical recipe format

2. **Implement Adapter Pattern**
   - TheMealDBAdapter (wraps existing src/api/recipes.js)
   - Define canonical Recipe schema (JSDoc or TypeScript)
   - All recipes normalized to same format regardless of source

3. **Refactor Components**
   - Update RecipeBrowser, FoodList, RecipeDetailModal to use RecipeService
   - Remove direct imports of src/api/recipes.js
   - Test each component after refactor (P1.0 tests should pass)

4. **Add Feature Flags**
   - Toggle between API adapters via config
   - Prepare for A/B testing different data sources

**Success Criteria**:
- All P1.0 tests still pass ✅
- Can add second API adapter in <1 day
- Zero direct API imports in components
- Performance unchanged (±10%)

**Technical Notes**: See ARCHITECTURE.md Phase 1 for detailed strategy.

**Tests Required**:
- Service layer unit tests (mock adapters)
- Adapter transformation tests (API format → canonical format)
- Integration tests with mocked API responses
- E2E tests still pass after refactor

---

## 🚀 Phase 2: User Retention & Polish
**Goal**: Solidify core experience before adding social features

### P2.0 - Context Architecture Refactoring (ARCHITECTURE Phase 2)
**Impact**: Cleaner state management, prepares for cloud sync, enables React Native  
**Effort**: 1-2 weeks  
**Why Now**: After service layer stable (P1.4), move global state to React Context.

**Refactoring Steps**:
1. **Create Context Providers**
   - RecipeContext (recipe data, categories, filters)
   - MealPlanContext (meal plan state, localStorage → cloud abstraction)
   - UIContext (view state, modal state, loading states)

2. **Extract Custom Hooks**
   - useRecipes() - replaces prop drilling of recipe data
   - useMealPlan() - enhanced version of existing hook
   - useFilters() - dietary and category filter state

3. **Refactor App.jsx**
   - Wrap app in context providers
   - Remove prop drilling (50%+ line reduction)
   - Components gradually adopt contexts

4. **Storage Abstraction Layer**
   - Abstract localStorage calls behind StorageService
   - Prepare for localStorage → cloud migration
   - Supports offline-first pattern

**Success Criteria**:
- App.jsx reduced by 50%+ lines
- All P1.0 tests still pass ✅
- Performance same or better (measure re-renders)
- Components can opt-in gradually (backward compatible)

**Technical Notes**: See ARCHITECTURE.md Phase 2 for detailed strategy.

**Tests Required**:
- Context provider unit tests
- Custom hooks testing (renderHook from @testing-library/react)
- Integration tests with context providers
- Performance tests (re-render count monitoring)

---

### P2.1 - Favorite Recipes ⭐
**Impact**: Personalization, user retention (save preferred recipes)  
**Effort**: 3-4 days  
**Why Now**: Foundation for user preferences (needed for social profiles later). Users keep asking "how do I save this?"

**Features**:
- Heart icon on recipe cards (toggle favorite)
- "Favorites" tab in Browse view
- Prioritize favorites in random rolls
- Export favorites list

**Technical Notes**: Stored in localStorage initially, easy to migrate to cloud when Phase 3 arrives.

**Tests Required**:
- Toggle favorite state (click heart icon)
- Favorites persist in localStorage
- Favorites tab displays correct recipes
- Random roll prioritizes favorites

---

### P2.2 - Print Recipe
**Impact**: User convenience (offline cooking reference)  
**Effort**: 1-2 days  
**Why Now**: Low effort, high satisfaction. Print button in recipe detail modal.

**Features**:
- Print-friendly recipe format (ingredients + instructions)
- Hide navigation/UI elements when printing
- Optional: Include meal plan context ("Dinner on Jan 15")

**Technical Notes**: CSS `@media print` rules, simple window.print() call.

**Tests Required**:
- Print button triggers print dialog (mock window.print)
- Print styles applied correctly (visual regression test)

---

### P2.3 - Expand Dietary Restrictions
**Impact**: Broader user base (capture more dietary needs)  
**Effort**: 3-5 days (depends on API ingredient data quality)  
**Why Now**: After validating current dietary filters work well, expand to capture more users.

**Features**:
- Add filters: Gluten-free, Dairy-free, Nut-free, Keto, Low-carb
- Update ingredient validation logic (more complex allergen checking)
- Custom dietary profiles (user creates own restrictions)

**Technical Notes**: Free API has limited ingredient details. May require manual curation or upgrade to premium API.

---

### P2.4 - Recipe Tags/Metadata Enhancement
**Impact**: Better filtering and discovery  
**Effort**: 2-3 days (UI only), 2-3 weeks (if adding time data manually)  
**Why Now**: Improves recipe cards, but blocked on API data quality.

**Features**:
- Display difficulty level (Easy/Medium/Hard) - **requires manual entry or premium API**
- Prep time, cooking time - **TheMealDB free API does NOT include this data**
- Serving size - **available in some recipes**
- Filter by tags (breakfast, quick meals, comfort food)

**API Limitation**: TheMealDB free tier lacks cooking/prep time. Options:
- Upgrade to premium API ($5-50/mo depending on usage)
- Manual data entry system (community contribution)
- Integrate secondary API (Spoonacular, Edamam) for missing metadata

---

## 🌐 Phase 3: Social Features (Backend Required)
**Goal**: Enable sharing, community, and viral growth

### P3.1 - User Accounts & Authentication ⭐ CRITICAL
**Impact**: Required for all social features  
**Effort**: 2-3 weeks (backend setup + frontend integration)  
**Why Now**: Blocks all other Phase 3 features. Must decide on backend (Firebase/Supabase/Custom).

**Features**:
- Google OAuth login (fastest onboarding)
- GitHub OAuth login (developer audience)
- Email/password option (traditional users)
- Anonymous → authenticated migration (preserve localStorage data)
- Profile page (username, avatar, bio, dietary preferences)

**Technical Decision Needed**: Which backend? (See ARCHITECTURE.md Decision 1)

---

### P3.2 - Share Meal Plan ⭐
**Impact**: Viral growth (30-40% conversion from shared links)  
**Effort**: 3-4 weeks (requires backend, database, URL routing)  
**Why Now**: First social feature, validates product-market fit for community aspect.

**Features**:
- Generate unique shareable link (e.g., `/plans/abc123`)
- Public/private toggle (with confirmation dialog)
- Social media preview cards (Open Graph meta tags)
- "Fork this plan" button (copy to your account)
- View-only mode for non-authenticated users

**Technical Notes**: Requires backend API to store public meal plans, CDN for image hosting.

---

### P3.3 - User Impersonation (Admin Tooling)
**Impact**: Support and debugging for production issues  
**Effort**: 1-2 weeks  
**Why Now**: After user accounts exist, admins need to test/debug user-specific issues.

**Features**:
- Admin panel to impersonate any user account
- View meal plans as if logged in as that user
- Audit log of impersonation events (compliance)
- Banner showing "Viewing as [username]" with exit button

**Security**: Requires admin role system, audit logging, GDPR compliance.

---

### P3.4 - Social Feed & Discovery
**Impact**: Content discovery, engagement, retention (3x higher for active users)  
**Effort**: 4-6 weeks  
**Why Now**: After sharing works, need discoverability to create network effects.

**Features**:
- Explore feed (popular meal plans this week)
- Search meal plans by tags, dietary restrictions, author
- Like/save meal plans (engagement metrics)
- Follow users (optional, see ARCHITECTURE.md Decision 3)
- Activity feed (if network-focused model chosen)

**Technical Notes**: Requires recommendation algorithm, caching strategy for popular content, CDN for images.

---

### P3.5 - Comments & Ratings
**Impact**: Community engagement, social proof, feedback loop  
**Effort**: 3-4 weeks (includes moderation tooling)  
**Why Now**: After users can share and discover plans, enable conversations.

**Features**:
- Comment on meal plans ("Loved this! Made the chicken recipe.")
- Star ratings (1-5 stars)
- Sort plans by rating/popularity
- Report inappropriate comments (moderation queue)
- Notification when someone comments on your plan

**Moderation**: Requires content moderation system (automated filters + manual review queue).

---

## 🎨 Phase 4: Advanced Features (Nice-to-Have)
**Goal**: Polish and expand platform capabilities

### P4.1 - Nutritional Information
**Impact**: Health-conscious users, premium feature potential  
**Effort**: 4-6 weeks (API integration + UI)  
**Why Now**: After core social features stable, add premium value.

**Features**:
- Display calories, protein, carbs, fat per meal
- Weekly/daily nutritional summary
- Filter by calorie range (e.g., 300-500 cal meals)
- Nutritional goals (daily calorie target, macro ratios)

**API Limitation**: TheMealDB free tier lacks detailed nutrition data. Requires:
- Premium recipe API (Spoonacular $150-500/mo, Edamam $69-399/mo)
- Nutritional database integration (USDA API is free but manual mapping)
- Community-contributed nutrition data

---

### P4.2 - Weekly/Monthly Calendar View
**Impact**: Better planning UX for power users  
**Effort**: 2-3 weeks (complex UI, drag-drop interactions)  
**Why Now**: Current date-picker works for casual users, calendar for planners.

**Features**:
- Full calendar grid (like Google Calendar)
- Drag-and-drop meals between days
- Week-at-a-glance view with meal thumbnails
- Month view with color-coded dietary badges
- Print weekly meal plan as PDF

**Technical Notes**: Use FullCalendar.js or react-big-calendar library.

---

### P4.3 - Manual Recipe Entry
**Impact**: User-generated content (unlimited recipes), community growth  
**Effort**: 3-4 weeks (form UI + validation + storage)  
**Why Now**: After social features work, enable community contributions.

**Features**:
- Recipe creation form (name, ingredients, instructions, image upload)
- Image hosting (S3, Cloudinary, or backend storage)
- Recipe editing (own recipes only)
- Public/private toggle for custom recipes
- Community can discover and use your recipes

**Moderation**: Requires content review system (spam, copyright, offensive content).

---

### P4.4 - Mobile App (Native)
**Impact**: Mobile-first users, app store presence, notifications  
**Effort**: 8-12 weeks (iOS + Android, or React Native)  
**Why Now**: After web product-market fit proven, expand to mobile.

**Options**:
- React Native (shares contexts/logic with web, faster development)
- Native Swift/Kotlin (better performance, more work)
- Progressive Web App (PWA) - install web app, lighter effort

**Technical Notes**: Current Context-based architecture designed for React Native portability.

---

### P4.5 - Localization (i18n)
**Impact**: International users, global growth  
**Effort**: 3-4 weeks (infrastructure) + ongoing (translations)  
**Why Now**: After product-market fit in English, expand to other languages.

**Features**:
- Multi-language support (Spanish, French, German, etc.)
- Locale-specific units (metric vs imperial)
- Translation management system (Crowdin, Lokalise)
- Translated recipe content (requires multilingual API or community translations)

**Technical Notes**: Use react-i18next or next-intl library. TheMealDB has some international recipes but limited translations.

---

### P4.6 - Premium API Upgrade
**Impact**: Richer data (nutrition, time, multi-category), better UX  
**Effort**: 2-3 weeks (adapter implementation + testing)  
**Cost**: $50-500/mo depending on API and usage  
**Why Now**: After revenue stream established (premium users, ads), invest in data quality.

**Benefits**:
- True multi-category filtering (remove workaround)
- Cooking/prep time data (better planning)
- Detailed nutritional information (health features)
- More recipe sources (Spoonacular, Edamam)
- Higher rate limits (better performance)

**Decision**: See ARCHITECTURE.md Decision 5 for API strategy.

---

## ⚠️ Deprioritized / Out of Scope

These features are interesting but don't align with current strategic goals:

- **Manual Categories Entry**: Low value (existing categories comprehensive), high complexity
- **Add Nutrition Filters to Sidebar**: Blocked on nutritional data availability (premium API needed)
- **Halal/Kosher Dietary Filters**: Small user segment, requires specialized data validation, defer until Phase 2.3

---

## 📊 Prioritization Rationale

**Why This Order?**

1. **Export Shopping List (P1.1)**: Most requested feature, immediate user value, teaches data portability patterns
2. **Recipe Search (P1.2)**: Current browse is limiting, validates multi-API query patterns
3. **Recipe History (P1.3)**: Easy win, builds caching patterns, high user satisfaction
4. **Favorites (P2.1)**: Foundation for personalization, users keep asking for it
5. **Print Recipe (P2.2)**: Low effort, high satisfaction, completes recipe detail feature
6. **Expand Dietary (P2.3)**: After validating current filters work, expand user base
7. **Recipe Tags (P2.4)**: Blocked on API data quality, consider premium API or manual entry
8. **User Accounts (P3.1)**: Blocks all social features, critical decision point (see ARCHITECTURE.md)
9. **Share Meal Plan (P3.2)**: First social feature, validates community product-market fit
10. **User Impersonation (P3.3)**: After accounts exist, needed for support/debugging

**Data Points Used**:
- User retention: Features that keep users coming back (favorites, history, export)
- Viral growth: Sharing = 30-40% conversion from links (industry average)
- Development risk: Phase 1 features low-risk, no backend required
- Architecture prep: Each Phase 1 feature teaches patterns needed for Phase 2/3
- Backend dependency: All Phase 3 features require backend (see ARCHITECTURE.md timeline)

**Questions for Clarification**:
1. Should we prioritize **Export Shopping List** (user retention) or **Recipe Search** (discovery) first?
2. When do you want to tackle **User Accounts** decision (which backend)?
3. Are there any features in Phase 4 you'd like to pull forward to Phase 2?
4. Should **Mobile App** be higher priority if your target users are mobile-first?

---

*Last updated: October 27, 2025*