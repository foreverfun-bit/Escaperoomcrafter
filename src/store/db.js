import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from './firebaseClient.js';

// One Firestore collection per synced list. Documents are stored close to
// the app's own camelCase shape (Firestore is schemaless, so unlike the old
// Postgres column mapping, nothing here needs translating) with the id
// mirrored into the document itself and a userId field the security rules
// use to scope every read/write to its owner.
const TABLE_KEYS = [
  'rooms',
  'zones',
  'puzzles',
  'props',
  'tasks',
  'brainstormBoards',
  'brainstormIdeas',
  'brainstormConnections',
  'brainstormPaths',
];

// Firestore rejects writes containing `undefined` - unlike Postgres, there's
// no column to just omit, so any explicit undefined has to be stripped.
function stripUndefined(obj) {
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) clean[key] = value;
  }
  return clean;
}

export async function fetchAll(key) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(db, key), where('userId', '==', uid)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function insertRow(key, obj) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await setDoc(doc(db, key, obj.id), stripUndefined({ ...obj, userId: uid }));
  } catch (error) {
    console.error(`Failed to sync new ${key} to the cloud`, error);
  }
}

export async function updateRow(key, id, patch) {
  try {
    await updateDoc(doc(db, key, id), stripUndefined(patch));
  } catch (error) {
    console.error(`Failed to sync ${key} update to the cloud`, error);
  }
}

export async function deleteRow(key, id) {
  try {
    await deleteDoc(doc(db, key, id));
  } catch (error) {
    console.error(`Failed to sync ${key} delete to the cloud`, error);
  }
}

// Subscribes to every synced collection for this user and forwards each
// change to onChange as ('INSERT' | 'UPDATE' | 'DELETE', row) - matching the
// shape the rest of the app already expects. Returns an unsubscribe
// function. Firestore's onSnapshot also replays the current matching
// documents as 'added' changes the moment it attaches; that's harmless here
// since it lands on top of the same data the initial fetchAll already
// loaded (upsert-by-id, idempotent).
export function subscribeAll(userId, onChange) {
  const unsubscribers = TABLE_KEYS.map((key) => {
    const q = query(collection(db, key), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const row = { id: change.doc.id, ...change.doc.data() };
          const eventType = change.type === 'added' ? 'INSERT' : change.type === 'modified' ? 'UPDATE' : 'DELETE';
          onChange(key, eventType, row);
        });
      },
      (error) => console.error(`Realtime subscription failed for ${key}`, error),
    );
  });
  return () => unsubscribers.forEach((unsub) => unsub());
}
