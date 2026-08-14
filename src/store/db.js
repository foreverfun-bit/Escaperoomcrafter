import { supabase } from './supabaseClient.js';

function makeMapper(columnMap) {
  const toRow = (obj) => {
    const row = {};
    for (const [camel, snake] of Object.entries(columnMap)) {
      if (camel in obj) row[snake] = obj[camel];
    }
    return row;
  };
  const fromRow = (row) => {
    const obj = {};
    for (const [camel, snake] of Object.entries(columnMap)) {
      obj[camel] = row[snake];
    }
    return obj;
  };
  return { toRow, fromRow };
}

// One entry per synced collection: the Supabase table name, plus a
// camelCase (JS) <-> snake_case (DB column) field map used for every
// read/write so the rest of the app never has to think about it.
export const TABLES = {
  rooms: {
    table: 'erc_rooms',
    ...makeMapper({
      id: 'id',
      name: 'name',
      theme: 'theme',
      description: 'description',
      difficulty: 'difficulty',
      targetMinutes: 'target_minutes',
      status: 'status',
      photos: 'photos',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }),
  },
  zones: {
    table: 'erc_zones',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      name: 'name',
      description: 'description',
      notes: 'notes',
      order: 'order',
      x: 'x',
      y: 'y',
      w: 'w',
      h: 'h',
      color: 'color',
      widthFt: 'width_ft',
      lengthFt: 'length_ft',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }),
  },
  puzzles: {
    table: 'erc_puzzles',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      zoneId: 'zone_id',
      name: 'name',
      description: 'description',
      type: 'type',
      solution: 'solution',
      hints: 'hints',
      dependsOn: 'depends_on',
      status: 'status',
      notes: 'notes',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }),
  },
  props: {
    table: 'erc_props',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      zoneId: 'zone_id',
      name: 'name',
      category: 'category',
      quantity: 'quantity',
      sourcingStatus: 'sourcing_status',
      cost: 'cost',
      source: 'source',
      puzzleIds: 'puzzle_ids',
      notes: 'notes',
      photos: 'photos',
      x: 'x',
      y: 'y',
      w: 'w',
      h: 'h',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }),
  },
  tasks: {
    table: 'erc_tasks',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      title: 'title',
      description: 'description',
      status: 'status',
      dueDate: 'due_date',
      category: 'category',
      priority: 'priority',
      linkedPuzzleId: 'linked_puzzle_id',
      linkedPropId: 'linked_prop_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }),
  },
  brainstormBoards: {
    table: 'erc_brainstorm_boards',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      name: 'name',
      createdAt: 'created_at',
    }),
  },
  brainstormIdeas: {
    table: 'erc_brainstorm_ideas',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      boardId: 'board_id',
      boardType: 'board_type',
      title: 'title',
      notes: 'notes',
      keeper: 'keeper',
      convertedPuzzleId: 'converted_puzzle_id',
      x: 'x',
      y: 'y',
      w: 'w',
      h: 'h',
      color: 'color',
      fontSize: 'font_size',
      shapeKind: 'shape_kind',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }),
  },
  brainstormConnections: {
    table: 'erc_brainstorm_connections',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      boardId: 'board_id',
      from: 'from_id',
      to: 'to_id',
      createdAt: 'created_at',
    }),
  },
  brainstormPaths: {
    table: 'erc_brainstorm_paths',
    ...makeMapper({
      id: 'id',
      roomId: 'room_id',
      boardId: 'board_id',
      points: 'points',
      color: 'color',
      width: 'width',
      createdAt: 'created_at',
    }),
  },
};

export async function fetchAll(key) {
  const { table, fromRow } = TABLES[key];
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data.map(fromRow);
}

export async function insertRow(key, obj) {
  const { table, toRow } = TABLES[key];
  const { error } = await supabase.from(table).insert(toRow(obj));
  if (error) console.error(`Failed to sync new ${key} to the cloud`, error);
}

export async function updateRow(key, id, patch) {
  const { table, toRow } = TABLES[key];
  const { error } = await supabase.from(table).update(toRow(patch)).eq('id', id);
  if (error) console.error(`Failed to sync ${key} update to the cloud`, error);
}

export async function deleteRow(key, id) {
  const { table } = TABLES[key];
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.error(`Failed to sync ${key} delete to the cloud`, error);
}

// Subscribes to every synced table for this user and forwards each change
// (already mapped to the app's camelCase shape) to onChange. Returns an
// unsubscribe function.
export function subscribeAll(userId, onChange) {
  const channel = supabase.channel(`erc-sync-${userId}`);
  for (const [key, { table, fromRow }] of Object.entries(TABLES)) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
        onChange(key, payload.eventType, fromRow(row));
      },
    );
  }
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
