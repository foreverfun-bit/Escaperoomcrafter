const STORAGE_KEY = 'escape-room-crafter:data:v1';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const emptyData = () => ({
  version: 1,
  rooms: [],
  puzzles: [],
  props: [],
  zones: [],
  tasks: [],
  brainstormBoards: [],
  brainstormIdeas: [],
  brainstormConnections: [],
  brainstormPaths: [],
});

// Older saves predate multi-board brainstorms: every idea/connection/path
// just had a roomId. Give each such room a "Board 1" and backfill boardId
// on its existing items so nothing is orphaned.
function migrateBrainstormBoards(data) {
  const legacyItems = [...data.brainstormIdeas, ...data.brainstormConnections, ...data.brainstormPaths];
  const roomsNeedingDefault = new Set(
    legacyItems.filter((item) => !item.boardId && item.roomId).map((item) => item.roomId),
  );
  if (roomsNeedingDefault.size === 0) return data;

  const defaultBoardByRoom = {};
  const newBoards = [...data.brainstormBoards];
  roomsNeedingDefault.forEach((roomId) => {
    const id = makeId();
    defaultBoardByRoom[roomId] = id;
    newBoards.push({ id, roomId, name: 'Board 1', createdAt: new Date().toISOString() });
  });

  const assignBoardId = (item) => (item.boardId ? item : { ...item, boardId: defaultBoardByRoom[item.roomId] });
  return {
    ...data,
    brainstormBoards: newBoards,
    brainstormIdeas: data.brainstormIdeas.map(assignBoardId),
    brainstormConnections: data.brainstormConnections.map(assignBoardId),
    brainstormPaths: data.brainstormPaths.map(assignBoardId),
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return migrateBrainstormBoards({ ...emptyData(), ...parsed });
  } catch {
    return emptyData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save escape-room-crafter data', err);
    if (err?.name === 'QuotaExceededError') {
      window.alert(
        "Storage is full, so that last change wasn't saved. Photos take up the most space — " +
          'try removing a few, or export a backup and clear some out.',
      );
    }
  }
}

// iPadOS 13+ reports as "Macintosh" in the user agent, so touch support is
// the only reliable way to tell it apart from real desktop Safari/macOS.
function isAppleTouchDevice() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

export async function downloadJSON(data, filename = 'escape-room-crafter-backup.json') {
  const json = JSON.stringify(data, null, 2);
  const file = new File([json], filename, { type: 'application/json' });

  // iOS/iPadOS Safari (including installed PWAs) largely ignores the
  // <a download> trick below - it just opens the JSON instead of saving it.
  // The share sheet is the reliable way to get a file into Files there. Everywhere
  // else (including desktop browsers that also technically support
  // navigator.share) a plain download is more predictable - a desktop share
  // flyout often has no real target for a .json file and can silently resolve
  // without actually saving anything.
  if (isAppleTouchDevice() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // user dismissed the share sheet
      // fall through to the anchor-download approach below
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.rooms)) {
    throw new Error('That file does not look like an Escape Room Crafter backup.');
  }
  return migrateBrainstormBoards({ ...emptyData(), ...parsed });
}
