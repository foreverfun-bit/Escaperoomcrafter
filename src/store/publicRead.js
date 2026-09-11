import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseClient.js';

const CHILD_COLLECTIONS = ['zones', 'puzzles', 'props', 'tasks', 'interiorPaths'];

// Reads one room's data anonymously, for the read-only public share link.
// Every child collection carries a roomId, and the Firestore rules only
// allow this read when the room's own `shared` flag is true (checked with a
// get() back to the room doc) - so a room that isn't shared, or doesn't
// exist, denies the read at the rules level rather than this function
// deciding what to show. Both cases are treated the same here: null.
//
// The whole thing (including each child collection individually) is
// defensive against partial rule setups - e.g. the room's own read rule
// updated but a child collection's not yet, or vice versa - since a bare
// unhandled rejection here would otherwise leave the page stuck loading
// forever instead of showing anything. A child collection that errors just
// comes back empty rather than failing the whole page.
export async function fetchSharedRoom(roomId) {
  try {
    const roomSnap = await getDoc(doc(db, 'rooms', roomId));
    if (!roomSnap.exists() || roomSnap.data().shared !== true) return null;
    const room = { id: roomSnap.id, ...roomSnap.data() };

    const results = await Promise.allSettled(
      CHILD_COLLECTIONS.map((key) => getDocs(query(collection(db, key), where('roomId', '==', roomId)))),
    );
    const [zones, puzzles, props, tasks, interiorPaths] = results.map((result, i) => {
      if (result.status === 'fulfilled') return result.value.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.error(`Failed to load shared "${CHILD_COLLECTIONS[i]}"`, result.reason);
      return [];
    });

    return { room, zones, puzzles, props, tasks, interiorPaths };
  } catch (err) {
    console.error('Failed to load shared room', err);
    return null;
  }
}
