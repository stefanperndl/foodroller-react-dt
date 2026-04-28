# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branching strategy

`master` is always stable and deployable. Every backlog item has a dedicated `feature/<id>-<slug>` branch (see BACKLOG.md). Work on the relevant feature branch; merge to master only when the feature is complete and tested.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (Next.js server build → /.next)
npm start         # Start the Next.js production server locally
npm run lint      # ESLint
npm test          # Run all Jest tests

# Run a single test file
npm test -- ShoppingCart.test.jsx

# Run tests matching a name pattern
npm test -- --testNamePattern="merges identical ingredients"
```

## Architecture

FoodRoller is a React 19 / Next.js 15 meal planning app deployed on Vercel. It generates random meal suggestions via TheMealDB API, lets users filter by dietary restriction, and saves meals to a date-based plan stored in localStorage.

### Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| API | `src/api/recipes.js` | All TheMealDB calls. Retry logic (max 5) for dietary filtering. |
| Utils | `src/utils/` | `dietaryRestrictions.js` — restriction profiles + meal validation; `utils.js` — date math, ingredient merging |
| Hooks | `src/hooks/useMealplan.js` | localStorage persistence (`mealplan_v1` key) |
| Components | `src/components/` | UI; all global state lives in `App.jsx` |

### State management

State is centralized in `App.jsx` with 11+ `useState` hooks and passed down via props. This is acknowledged tech debt — `ARCHITECTURE.md` describes a planned migration to React Context (Phase 2).

### Recipe object shapes

Two shapes exist depending on context:
- **Preview** (browse list): `{ id, name, image, category }`
- **Full** (detail view): `{ id, name, image, ingredients: string[], instructions, category, area, tags: string[] }`

`fetchMealById()` is always needed to upgrade a preview to a full recipe.

### Dietary filtering

1. Category level — incompatible categories are hidden in `CategorySidebar`
2. Meal level — after fetch, `validateMealAgainstRestrictions()` checks excluded ingredients
3. Retry — up to 5 refetches if validation fails

Restrictions are defined in `src/utils/dietaryRestrictions.js` (`DIETARY_RESTRICTIONS` object).

## Key files

- `src/components/App.jsx` — main orchestrator, all global state
- `src/api/recipes.js` — only place TheMealDB is called
- `src/utils/dietaryRestrictions.js` — add/modify restriction profiles here
- `next.config.ts` — Next.js config (Vercel deployment, no static export)
- `jest.config.js` — jsdom environment, Babel transform
