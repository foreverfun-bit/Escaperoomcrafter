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

export function downloadJSON(data, filename = 'escape-room-crafter-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
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
