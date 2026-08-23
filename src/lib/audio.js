import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../store/firebaseClient.js';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `audio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Audio can't be downscaled the way photos are, so clips are uploaded to
// Firebase Storage instead of embedded as data URLs - that would risk
// bloating Firestore documents (and hitting its 1MiB-per-document limit)
// the same way base64 photos once bloated the old Postgres database.
export async function uploadAudioClips(fileList, userId) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('audio/'));
  const clips = [];
  for (const file of files) {
    try {
      const id = makeId();
      const path = `users/${userId}/audio/${id}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      clips.push({ id, name: file.name, url, path });
    } catch (err) {
      console.error(err);
    }
  }
  return clips;
}

export async function deleteAudioClip(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    console.error(err);
  }
}
