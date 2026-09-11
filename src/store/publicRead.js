import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseClient.js';

const CHILD_COLLECTIONS = ['zones', 'puzzles', 'props', 'tasks', 'interiorPaths'];

// Reads one room's data anonymously, for the read-only public share link.
// Every child collection carries a roomId, and the Firestore rules only
// allow this read when the room's own `shared` flag is true (checked with a
// get() back to the room doc) - so a room that isn't shared, or doesn't
// exist, denies the read at the rules level rather than this function
// deciding what to show. Both cases are treated the same here: null.
export async function fetchSharedRoom(roomId) {
  let roomSnap;
  try {
    roomSnap = await getDoc(doc(db, 'rooms', roomId));
  } catch {
    return null;
  }
  if (!roomSnap.exists() || roomSnap.data().shared !== true) return null;
  const room = { id: roomSnap.id, ...roomSnap.data() };

  const snapshots = await Promise.all(
    CHILD_COLLECTIONS.map((key) => getDocs(query(collection(db, key), where('roomId', '==', roomId)))),
  );
  const [zones, puzzles, props, tasks, interiorPaths] = snapshots.map((snap) =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  );

  return { room, zones, puzzles, props, tasks, interiorPaths };
}
