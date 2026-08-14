import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadData, saveData, downloadJSON, parseImportedJSON, emptyData } from './storage';
import { ZONE_PALETTE } from './constants';

const RoomsContext = createContext(null);

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const now = () => new Date().toISOString();

export function RoomsProvider({ children }) {
  const [data, setData] = useState(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  // ---------- Rooms ----------
  const addRoom = useCallback((partial) => {
    const id = makeId();
    const room = {
      id,
      name: 'Untitled Room',
      theme: '',
      description: '',
      difficulty: 'Medium',
      targetMinutes: 60,
      status: 'Concept',
      photos: [],
      createdAt: now(),
      updatedAt: now(),
      ...partial,
    };
    setData((d) => ({ ...d, rooms: [...d.rooms, room] }));
    return id;
  }, []);

  const updateRoom = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r)),
    }));
  }, []);

  const deleteRoom = useCallback((id) => {
    setData((d) => ({
      rooms: d.rooms.filter((r) => r.id !== id),
      puzzles: d.puzzles.filter((p) => p.roomId !== id),
      props: d.props.filter((p) => p.roomId !== id),
      zones: d.zones.filter((z) => z.roomId !== id),
      tasks: d.tasks.filter((t) => t.roomId !== id),
      brainstormBoards: d.brainstormBoards.filter((b) => b.roomId !== id),
      brainstormIdeas: d.brainstormIdeas.filter((i) => i.roomId !== id),
      brainstormConnections: d.brainstormConnections.filter((c) => c.roomId !== id),
      brainstormPaths: d.brainstormPaths.filter((p) => p.roomId !== id),
      version: d.version,
    }));
  }, []);

  // ---------- Puzzles ----------
  const addPuzzle = useCallback((roomId, partial) => {
    const id = makeId();
    const puzzle = {
      id,
      roomId,
      name: 'Untitled Puzzle',
      description: '',
      type: 'Logic',
      solution: '',
      hints: [],
      dependsOn: [],
      zoneId: null,
      status: 'Idea',
      notes: '',
      createdAt: now(),
      updatedAt: now(),
      ...partial,
    };
    setData((d) => ({ ...d, puzzles: [...d.puzzles, puzzle] }));
    return id;
  }, []);

  const updatePuzzle = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      puzzles: d.puzzles.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)),
    }));
  }, []);

  const deletePuzzle = useCallback((id) => {
    setData((d) => ({
      ...d,
      puzzles: d.puzzles
        .filter((p) => p.id !== id)
        .map((p) => ({ ...p, dependsOn: p.dependsOn.filter((depId) => depId !== id) })),
      props: d.props.map((p) => ({ ...p, puzzleIds: (p.puzzleIds || []).filter((pid) => pid !== id) })),
      tasks: d.tasks.map((t) => (t.linkedPuzzleId === id ? { ...t, linkedPuzzleId: null } : t)),
    }));
  }, []);

  // ---------- Props ----------
  const addProp = useCallback((roomId, partial) => {
    const id = makeId();
    const prop = {
      id,
      roomId,
      name: 'Untitled Prop',
      category: 'Prop',
      quantity: 1,
      sourcingStatus: 'Need to source',
      cost: 0,
      source: '',
      puzzleIds: [],
      notes: '',
      photos: [],
      // Interior-designer placement (optional): a prop can be tracked for
      // sourcing/budget here AND positioned inside a zone's floor plan.
      zoneId: null,
      x: null,
      y: null,
      w: null,
      h: null,
      createdAt: now(),
      updatedAt: now(),
      ...partial,
    };
    setData((d) => ({ ...d, props: [...d.props, prop] }));
    return id;
  }, []);

  const updateProp = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      props: d.props.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)),
    }));
  }, []);

  const deleteProp = useCallback((id) => {
    setData((d) => ({
      ...d,
      props: d.props.filter((p) => p.id !== id),
      tasks: d.tasks.map((t) => (t.linkedPropId === id ? { ...t, linkedPropId: null } : t)),
    }));
  }, []);

  // ---------- Zones (spatial layout) ----------
  const addZone = useCallback((roomId, partial) => {
    const id = makeId();
    setData((d) => {
      const roomZones = d.zones.filter((z) => z.roomId === roomId);
      const maxOrder = roomZones.reduce((m, z) => Math.max(m, z.order ?? 0), -1);
      const cascade = roomZones.length;
      const zone = {
        id,
        roomId,
        name: 'Untitled Zone',
        description: '',
        notes: '',
        order: maxOrder + 1,
        // Floor-plan placement, percentage of the blueprint canvas.
        x: 6 + ((cascade * 9) % 60),
        y: 8 + ((cascade * 11) % 58),
        w: 30,
        h: 28,
        color: ZONE_PALETTE[cascade % ZONE_PALETTE.length],
        // Real-world footprint, in feet.
        widthFt: null,
        lengthFt: null,
        createdAt: now(),
        updatedAt: now(),
        ...partial,
      };
      return { ...d, zones: [...d.zones, zone] };
    });
    return id;
  }, []);

  const updateZone = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      zones: d.zones.map((z) => (z.id === id ? { ...z, ...patch, updatedAt: now() } : z)),
    }));
  }, []);

  const deleteZone = useCallback((id) => {
    setData((d) => ({
      ...d,
      zones: d.zones.filter((z) => z.id !== id),
      puzzles: d.puzzles.map((p) => (p.zoneId === id ? { ...p, zoneId: null } : p)),
      props: d.props.map((p) => (p.zoneId === id ? { ...p, zoneId: null, x: null, y: null, w: null, h: null } : p)),
    }));
  }, []);

  const moveZone = useCallback((id, direction) => {
    setData((d) => {
      const zone = d.zones.find((z) => z.id === id);
      if (!zone) return d;
      const siblings = d.zones
        .filter((z) => z.roomId === zone.roomId)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((z) => z.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return d;
      const a = siblings[idx];
      const b = siblings[swapIdx];
      return {
        ...d,
        zones: d.zones.map((z) => {
          if (z.id === a.id) return { ...z, order: b.order };
          if (z.id === b.id) return { ...z, order: a.order };
          return z;
        }),
      };
    });
  }, []);

  // ---------- Tasks ----------
  const addTask = useCallback((roomId, partial) => {
    const id = makeId();
    const task = {
      id,
      roomId,
      title: 'Untitled Task',
      description: '',
      status: 'To Do',
      dueDate: '',
      category: 'Build',
      priority: 'Medium',
      linkedPuzzleId: null,
      linkedPropId: null,
      createdAt: now(),
      updatedAt: now(),
      ...partial,
    };
    setData((d) => ({ ...d, tasks: [...d.tasks, task] }));
    return id;
  }, []);

  const updateTask = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  // ---------- Brainstorm boards ----------
  const addBoard = useCallback((roomId, partial) => {
    const id = makeId();
    setData((d) => {
      const roomBoards = d.brainstormBoards.filter((b) => b.roomId === roomId);
      const board = {
        id,
        roomId,
        name: `Board ${roomBoards.length + 1}`,
        createdAt: now(),
        ...partial,
      };
      return { ...d, brainstormBoards: [...d.brainstormBoards, board] };
    });
    return id;
  }, []);

  const updateBoard = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      brainstormBoards: d.brainstormBoards.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteBoard = useCallback((id) => {
    setData((d) => ({
      ...d,
      brainstormBoards: d.brainstormBoards.filter((b) => b.id !== id),
      brainstormIdeas: d.brainstormIdeas.filter((i) => i.boardId !== id),
      brainstormConnections: d.brainstormConnections.filter((c) => c.boardId !== id),
      brainstormPaths: d.brainstormPaths.filter((p) => p.boardId !== id),
    }));
  }, []);

  const clearBoard = useCallback((id) => {
    setData((d) => ({
      ...d,
      brainstormIdeas: d.brainstormIdeas.filter((i) => i.boardId !== id),
      brainstormConnections: d.brainstormConnections.filter((c) => c.boardId !== id),
      brainstormPaths: d.brainstormPaths.filter((p) => p.boardId !== id),
    }));
  }, []);

  const addIdea = useCallback((roomId, partial) => {
    const id = makeId();
    const idea = {
      id,
      roomId,
      boardId: null,
      boardType: 'sticky',
      title: '',
      notes: '',
      keeper: false,
      convertedPuzzleId: null,
      x: 6,
      y: 8,
      w: 240,
      h: 200,
      color: '#f5d76e',
      fontSize: 14,
      shapeKind: 'rounded',
      createdAt: now(),
      updatedAt: now(),
      ...partial,
    };
    setData((d) => ({ ...d, brainstormIdeas: [...d.brainstormIdeas, idea] }));
    return id;
  }, []);

  const updateIdea = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      brainstormIdeas: d.brainstormIdeas.map((idea) => (idea.id === id ? { ...idea, ...patch, updatedAt: now() } : idea)),
    }));
  }, []);

  const deleteIdea = useCallback((id) => {
    setData((d) => ({
      ...d,
      brainstormIdeas: d.brainstormIdeas.filter((idea) => idea.id !== id),
      brainstormConnections: d.brainstormConnections.filter((c) => c.from !== id && c.to !== id),
    }));
  }, []);

  const addConnection = useCallback((roomId, boardId, from, to) => {
    setData((d) => {
      const exists = d.brainstormConnections.some(
        (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from),
      );
      if (exists || from === to) return d;
      return {
        ...d,
        brainstormConnections: [...d.brainstormConnections, { id: makeId(), roomId, boardId, from, to }],
      };
    });
  }, []);

  const deleteConnection = useCallback((id) => {
    setData((d) => ({ ...d, brainstormConnections: d.brainstormConnections.filter((c) => c.id !== id) }));
  }, []);

  const addPath = useCallback((roomId, partial) => {
    const id = makeId();
    setData((d) => ({
      ...d,
      brainstormPaths: [
        ...d.brainstormPaths,
        { id, roomId, boardId: null, points: '', color: '#2a2320', width: 3, ...partial },
      ],
    }));
    return id;
  }, []);

  const updatePath = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      brainstormPaths: d.brainstormPaths.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deletePath = useCallback((id) => {
    setData((d) => ({ ...d, brainstormPaths: d.brainstormPaths.filter((p) => p.id !== id) }));
  }, []);

  const convertIdeaToPuzzle = useCallback((id) => {
    let newPuzzleId = null;
    setData((d) => {
      const idea = d.brainstormIdeas.find((i) => i.id === id);
      if (!idea || idea.convertedPuzzleId) return d;
      newPuzzleId = makeId();
      const puzzle = {
        id: newPuzzleId,
        roomId: idea.roomId,
        name: idea.title || idea.notes.slice(0, 40) || 'Untitled Puzzle',
        description: idea.notes || '',
        type: 'Logic',
        solution: '',
        hints: [],
        dependsOn: [],
        zoneId: null,
        status: 'Idea',
        notes: '',
        createdAt: now(),
        updatedAt: now(),
      };
      return {
        ...d,
        puzzles: [...d.puzzles, puzzle],
        brainstormIdeas: d.brainstormIdeas.map((i) => (i.id === id ? { ...i, convertedPuzzleId: newPuzzleId, keeper: true } : i)),
      };
    });
    return newPuzzleId;
  }, []);

  // ---------- Backup / restore ----------
  const exportAll = useCallback(() => {
    downloadJSON(data);
  }, [data]);

  const importAll = useCallback((jsonText) => {
    const parsed = parseImportedJSON(jsonText);
    setData(parsed);
  }, []);

  const resetAll = useCallback(() => {
    setData(emptyData());
  }, []);

  const value = useMemo(
    () => ({
      data,
      addRoom,
      updateRoom,
      deleteRoom,
      addPuzzle,
      updatePuzzle,
      deletePuzzle,
      addProp,
      updateProp,
      deleteProp,
      addZone,
      updateZone,
      deleteZone,
      moveZone,
      addTask,
      updateTask,
      deleteTask,
      addBoard,
      updateBoard,
      deleteBoard,
      clearBoard,
      addIdea,
      updateIdea,
      deleteIdea,
      addConnection,
      deleteConnection,
      addPath,
      updatePath,
      deletePath,
      convertIdeaToPuzzle,
      exportAll,
      importAll,
      resetAll,
    }),
    [
      data,
      addRoom,
      updateRoom,
      deleteRoom,
      addPuzzle,
      updatePuzzle,
      deletePuzzle,
      addProp,
      updateProp,
      deleteProp,
      addZone,
      updateZone,
      deleteZone,
      moveZone,
      addTask,
      updateTask,
      deleteTask,
      addBoard,
      updateBoard,
      deleteBoard,
      clearBoard,
      addIdea,
      updateIdea,
      deleteIdea,
      addConnection,
      deleteConnection,
      addPath,
      updatePath,
      deletePath,
      convertIdeaToPuzzle,
      exportAll,
      importAll,
      resetAll,
    ],
  );

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
}

export function useRooms() {
  const ctx = useContext(RoomsContext);
  if (!ctx) throw new Error('useRooms must be used within a RoomsProvider');
  return ctx;
}

// ---------- Derived selector helpers ----------

export function useRoom(roomId) {
  const { data } = useRooms();
  return useMemo(() => data.rooms.find((r) => r.id === roomId) || null, [data.rooms, roomId]);
}

export function usePuzzles(roomId) {
  const { data } = useRooms();
  return useMemo(() => data.puzzles.filter((p) => p.roomId === roomId), [data.puzzles, roomId]);
}

export function useProps(roomId) {
  const { data } = useRooms();
  return useMemo(() => data.props.filter((p) => p.roomId === roomId), [data.props, roomId]);
}

export function useZones(roomId) {
  const { data } = useRooms();
  return useMemo(
    () => data.zones.filter((z) => z.roomId === roomId).sort((a, b) => a.order - b.order),
    [data.zones, roomId],
  );
}

export function useTasks(roomId) {
  const { data } = useRooms();
  return useMemo(() => data.tasks.filter((t) => t.roomId === roomId), [data.tasks, roomId]);
}

export function useBoards(roomId) {
  const { data } = useRooms();
  return useMemo(
    () => data.brainstormBoards.filter((b) => b.roomId === roomId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data.brainstormBoards, roomId],
  );
}

export function useIdeas(boardId) {
  const { data } = useRooms();
  return useMemo(() => data.brainstormIdeas.filter((i) => i.boardId === boardId), [data.brainstormIdeas, boardId]);
}

export function useConnections(boardId) {
  const { data } = useRooms();
  return useMemo(
    () => data.brainstormConnections.filter((c) => c.boardId === boardId),
    [data.brainstormConnections, boardId],
  );
}

export function usePaths(boardId) {
  const { data } = useRooms();
  return useMemo(() => data.brainstormPaths.filter((p) => p.boardId === boardId), [data.brainstormPaths, boardId]);
}

export function usePropsInZone(zoneId) {
  const { data } = useRooms();
  return useMemo(() => data.props.filter((p) => p.zoneId === zoneId), [data.props, zoneId]);
}

export function useRoomProgress(roomId) {
  const puzzles = usePuzzles(roomId);
  const props = useProps(roomId);
  const tasks = useTasks(roomId);
  return useMemo(() => {
    const puzzlesDone = puzzles.filter((p) => p.status === 'Tested').length;
    const propsReady = props.filter((p) => p.sourcingStatus === 'Acquired').length;
    const tasksDone = tasks.filter((t) => t.status === 'Done').length;
    const totalCost = props.reduce((sum, p) => sum + (Number(p.cost) || 0) * (Number(p.quantity) || 1), 0);
    return {
      puzzlesTotal: puzzles.length,
      puzzlesDone,
      propsTotal: props.length,
      propsReady,
      tasksTotal: tasks.length,
      tasksDone,
      totalCost,
    };
  }, [puzzles, props, tasks]);
}
