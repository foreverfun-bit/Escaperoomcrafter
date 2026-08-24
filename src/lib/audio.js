// Firebase Storage now requires the paid Blaze plan, so audio clips are
// embedded directly in the puzzle's Firestore document instead - same
// approach already used for photos. Firestore caps a document at 1MiB
// total, and base64 encoding inflates a file by ~4/3, so clips are capped
// well under that (leaving room for the puzzle's other fields and any
// other clips already attached) rather than silently failing - or worse,
// succeeding right up until one save pushes the document over the limit.
const MAX_CLIP_BYTES = 400 * 1024; // ~400KB raw per clip
const MAX_TOTAL_BYTES = 700 * 1024; // ~700KB raw combined per puzzle

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `audio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read audio: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

// Reads a FileList/array of audio Files into {id, name, dataUrl} clips,
// rejecting anything that would blow the per-clip or per-puzzle size
// budget. `existingBytes` is the combined raw size of clips already on
// the puzzle, so the total budget is enforced across saves too.
export async function filesToAudioClips(fileList, existingBytes = 0) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('audio/'));
  const clips = [];
  const errors = [];
  let runningBytes = existingBytes;

  for (const file of files) {
    if (file.size > MAX_CLIP_BYTES) {
      errors.push(`"${file.name}" is too large (${Math.round(file.size / 1024)}KB) - clips are limited to ${Math.round(MAX_CLIP_BYTES / 1024)}KB each.`);
      continue;
    }
    if (runningBytes + file.size > MAX_TOTAL_BYTES) {
      errors.push(`"${file.name}" would put this puzzle's total audio over the ${Math.round(MAX_TOTAL_BYTES / 1024)}KB limit - remove a clip first or trim this one.`);
      continue;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      clips.push({ id: makeId(), name: file.name, dataUrl, bytes: file.size });
      runningBytes += file.size;
    } catch (err) {
      console.error(err);
      errors.push(`Could not read "${file.name}".`);
    }
  }

  return { clips, errors };
}
