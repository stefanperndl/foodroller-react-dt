import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createShareableLink({
  meals,
  macroProfile,
  slots,
  nutritionMap,
  dateRange,
  title,
  ownerDisplayName,
  ownerId,
}) {
  const shareId = crypto.randomUUID();
  const now = Date.now();
  await setDoc(doc(db, 'sharedPlans', shareId), {
    meals,
    macroProfile: macroProfile ?? null,
    slots,
    nutritionMap: nutritionMap ?? {},
    dateRange,
    title: title || null,
    createdAt: now,
    expiresAt: now + TTL_MS,
    completedMeals: {},
    ownerDisplayName: ownerDisplayName ?? null,
    ownerId: ownerId ?? null,
  });
  return shareId;
}

export async function getSharedPlan(shareId) {
  const snap = await getDoc(doc(db, 'sharedPlans', shareId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.expiresAt < Date.now()) return null;
  return data;
}
