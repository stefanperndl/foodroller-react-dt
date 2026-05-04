#!/usr/bin/env node
/**
 * Seed `users/{STOCK_UID}/recipes` from chefkoch.de via the same pipeline
 * real users use (fetch /api/import-recipe → POST /api/nutrition → addDoc).
 *
 * Prereqs:
 *   - Dev server running on localhost:3000 (npm run dev)
 *   - Firebase Auth user `foodroller-stock@…` created in console
 *   - .env.local has:
 *       NEXT_PUBLIC_STOCK_UID, STOCK_USER_EMAIL, STOCK_USER_PASSWORD,
 *       NEXT_PUBLIC_FIREBASE_*, CALORIE_NINJAS_API_KEY, ANTHROPIC_API_KEY
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-stock-recipes.mjs --limit 200
 *   node --env-file=.env.local scripts/seed-stock-recipes.mjs --dry-run --limit 3
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
  options: {
    limit:         { type: 'string',  default: '200' },
    delay:         { type: 'string',  default: '1000' },
    'start-offset':{ type: 'string',  default: '0' },
    'dry-run':     { type: 'boolean', default: false },
    base:          { type: 'string',  default: 'http://localhost:3000' },
  },
  strict: false,
});

const LIMIT        = parseInt(args.limit, 10);
const DELAY        = parseInt(args.delay, 10);
const START_OFFSET = parseInt(args['start-offset'], 10);
const DRY_RUN      = args['dry-run'];
const BASE         = args.base.replace(/\/$/, '');

const STOCK_UID = process.env.NEXT_PUBLIC_STOCK_UID;
const EMAIL     = process.env.STOCK_USER_EMAIL;
const PASSWORD  = process.env.STOCK_USER_PASSWORD;

function need(name, val) { if (!val) throw new Error(`Missing env var ${name}`); }
need('NEXT_PUBLIC_STOCK_UID', STOCK_UID);
need('STOCK_USER_EMAIL', EMAIL);
need('STOCK_USER_PASSWORD', PASSWORD);
need('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Preflight: dev server reachable ------------------------------------
try {
  await fetch(`${BASE}/api/import-recipe?url=https://example.com/missing`, { signal: AbortSignal.timeout(3000) });
} catch (err) {
  if (err.cause?.code === 'ECONNREFUSED' || /fetch failed/i.test(err.message)) {
    console.error(`Dev server unreachable at ${BASE}. Run \`npm run dev\` first.`);
    process.exit(1);
  }
}

// ---- Firebase init + auth -----------------------------------------------
const app = initializeApp({
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db   = getFirestore(app);

if (!DRY_RUN) {
  console.log(`Signing in as ${EMAIL}…`);
  const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
  if (cred.user.uid !== STOCK_UID) {
    console.error(`Signed-in UID ${cred.user.uid} ≠ NEXT_PUBLIC_STOCK_UID ${STOCK_UID}`);
    process.exit(1);
  }
}

// ---- Dedupe: existing sourceUrls in stock collection --------------------
const existingUrls = new Set();
if (!DRY_RUN) {
  const snap = await getDocs(collection(db, 'users', STOCK_UID, 'recipes'));
  for (const d of snap.docs) {
    const u = d.data().sourceUrl;
    if (u) existingUrls.add(u);
  }
  console.log(`${existingUrls.size} recipes already seeded.`);
}

// ---- Discover recipe URLs from chefkoch browse pages --------------------
const PAGE_SIZE = 30;
const UA = 'Mozilla/5.0 (compatible; FoodRollerSeedBot/1.0)';

async function discoverUrls(maxUrls, startOffset) {
  const urls = [];
  for (let offset = startOffset; urls.length < maxUrls; offset += PAGE_SIZE) {
    const url = `https://www.chefkoch.de/rs/s${offset}o6/Rezepte.html`;
    let html;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) { console.warn(`  discovery stop: HTTP ${res.status} at offset ${offset}`); break; }
      html = await res.text();
    } catch (err) {
      console.warn(`  discovery stop at offset ${offset}: ${err.message}`);
      break;
    }
    const before = urls.length;
    for (const m of html.matchAll(/href="(https:\/\/www\.chefkoch\.de\/rezepte\/\d+\/[^"]+\.html)"/g)) {
      if (existingUrls.has(m[1])) continue;
      urls.push(m[1]);
      if (urls.length >= maxUrls) break;
    }
    if (urls.length === before) break;
    await sleep(DELAY);
  }
  return urls;
}

console.log(`Discovering up to ${LIMIT} recipe URLs (start offset ${START_OFFSET})…`);
const recipeUrls = await discoverUrls(LIMIT, START_OFFSET);
console.log(`Found ${recipeUrls.length} new URLs to ingest.`);

// ---- Per-URL ingest -----------------------------------------------------
let written = 0, skipped = 0;
for (let i = 0; i < recipeUrls.length; i++) {
  const url = recipeUrls[i];
  const t0 = Date.now();
  const tag = `[${i + 1}/${recipeUrls.length}]`;

  let parsed;
  try {
    const res = await fetch(`${BASE}/api/import-recipe?url=${encodeURIComponent(url)}`);
    if (!res.ok) { console.log(`${tag} SKIP import-recipe HTTP ${res.status}`); skipped++; continue; }
    parsed = await res.json();
  } catch (err) {
    console.log(`${tag} SKIP import-recipe: ${err.message}`); skipped++; continue;
  }

  const ingredients = parsed.ingredients ?? [];
  if (!parsed.image)                  { console.log(`${tag} SKIP "${parsed.name}" no image`); skipped++; continue; }
  if (ingredients.length < 3)         { console.log(`${tag} SKIP "${parsed.name}" only ${ingredients.length} ingredients`); skipped++; continue; }
  if (!parsed.instructions?.trim())   { console.log(`${tag} SKIP "${parsed.name}" no instructions`); skipped++; continue; }

  let nutrition = null;
  try {
    const res = await fetch(`${BASE}/api/nutrition`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.items?.length) {
        nutrition = data.items.reduce((acc, it) => ({
          kcal:    acc.kcal    + it.calories,
          protein: acc.protein + it.protein_g,
          carbs:   acc.carbs   + it.carbohydrates_total_g,
          fat:     acc.fat     + it.fat_total_g,
          fiber:   acc.fiber   + it.fiber_g,
        }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
      }
    }
  } catch (err) {
    console.warn(`${tag}   nutrition error: ${err.message}`);
  }

  const doc = {
    name: parsed.name,
    category: parsed.category || 'Miscellaneous',
    area: null,
    servings: parsed.servings ?? 4,
    ingredients,
    instructions: parsed.instructions,
    image: parsed.image,
    tags: [],
    source: 'stock',
    sourceUrl: url,
    forkedFrom: null,
    published: true,
    nutrition,
  };

  if (DRY_RUN) {
    console.log(`${tag} DRY "${doc.name}" (${nutrition ? Math.round(nutrition.kcal) + ' kcal' : 'no nutrition'}, ${ingredients.length} ing, ${Date.now() - t0}ms)`);
  } else {
    try {
      await addDoc(collection(db, 'users', STOCK_UID, 'recipes'), {
        ...doc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      written++;
      console.log(`${tag} OK  "${doc.name}" (${nutrition ? Math.round(nutrition.kcal) + ' kcal' : 'no nutrition'}, ${ingredients.length} ing, ${Date.now() - t0}ms)`);
    } catch (err) {
      console.warn(`${tag} FAIL addDoc: ${err.message}`); skipped++;
    }
  }

  await sleep(DELAY);
}

console.log(`\nDone. ${DRY_RUN ? 'dry-run ' : ''}written=${written}, skipped=${skipped}, total=${recipeUrls.length}`);
process.exit(0);
