import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../store/firebaseClient.js';

const MAX_CLIP_BYTES = 20 * 1024 * 1024; // 20MB - generous room for a full song, not just short hints

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `audio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Audio clips upload to Firebase Storage (scoped under the owning user's
// uid) rather than embedding as data URLs - a real song is far too big to
// fit in a Firestore document (1MiB cap, and base64 adds ~33% on top).
export async function uploadAudioClips(fileList, userId) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('audio/'));
  const clips = [];
  const errors = [];
  for (const file of files) {
    if (file.size > MAX_CLIP_BYTES) {
      errors.push(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) - clips are limited to ${MAX_CLIP_BYTES / (1024 * 1024)}MB each.`);
      continue;
    }
    try {
      const id = makeId();
      const path = `users/${userId}/audio/${id}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      clips.push({ id, name: file.name, url, path });
    } catch (err) {
      console.error(err);
      errors.push(`Could not upload "${file.name}".`);
    }
  }
  return { clips, errors };
}

export async function deleteAudioClip(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    console.error(err);
  }
}
