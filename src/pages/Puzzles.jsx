import { useOutletContext, Link } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import { Plus, Puzzle as PuzzleIcon, Pencil, Trash2, Lightbulb, ArrowRight, LayoutGrid, GripVertical, Music } from 'lucide-react';
import { useRooms, usePuzzles, useZones, useBoards } from '../store/RoomsContext.jsx';
import { computeDepths } from '../store/puzzleFlow.js';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import PuzzleFormModal from '../components/PuzzleFormModal.jsx';

export default function Puzzles() {
  const { room } = useOutletContext();
  const { addPuzzle, updatePuzzle, deletePuzzle } = useRooms();
  const puzzles = usePuzzles(room.id);
  const zones = useZones(room.id);
  const boards = useBoards(room.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { requestConfirm, dialogProps } = useConfirmDialog();

  const puzzleName = (id) => puzzles.find((p) => p.id === id)?.name || 'Unknown';
  const zoneName = (id) => zones.find((z) => z.id === id)?.name;
  const unlocksOf = (id) => puzzles.filter((p) => p.dependsOn.includes(id));
  const boardsFor = (puzzleId) => boards.filter((b) => b.puzzleId === puzzleId);

  // Display order follows each puzzle's depth in the dependency chain
  // (same computation the Flow page uses), so the list reads top-to-bottom
  // as the player's path. Dragging a puzzle sets it to require the one it's
  // dropped below - a shortcut for the common straight-chain case; more
  // complex/branching requirements are still set via the edit form.
  const depthOf = useMemo(() => computeDepths(puzzles), [puzzles]);
  // A drag updates two puzzles' dependsOn as separate writes, which are
  // separately confirmed by the realtime listener - if one confirmation
  // lands before the other, the two can briefly tie at the same depth again
  // (the same tie a drop is meant to resolve). Breaking ties by raw list
  // order made that transient state visibly reshuffle the whole list until
  // both confirmations landed. Breaking ties by the last known order
  // instead means a tie holds its position rather than jumping around.
  const lastOrderRef = useRef([]);
  const orderedIds = useMemo(() => {
    const previousIndex = new Map(lastOrderRef.current.map((id, i) => [id, i]));
    const sorted = [...puzzles]
      .sort((a, b) => {
        const depthDiff = (depthOf.get(a.id) || 0) - (depthOf.get(b.id) || 0);
        if (depthDiff !== 0) return depthDiff;
        const ai = previousIndex.has(a.id) ? previousIndex.get(a.id) : Infinity;
        const bi = previousIndex.has(b.id) ? previousIndex.get(b.id) : Infinity;
        return ai - bi;
      })
      .map((p) => p.id);
    lastOrderRef.current = sorted;
    return sorted;
  }, [puzzles, depthOf]);

  // Dragging never reorders the underlying list mid-gesture (fast real
  // pointer movement fires far more events than React can re-render and
  // settle card refs between, which made an earlier swap-as-you-go version
  // unreliable in practice despite working in slower simulated tests).
  // Instead the dragged card just visually follows the pointer via a
  // transform - immediate feedback for any movement, however small - and
  // the drop position is computed once, at release, against the other
  // cards' original (never-moved) positions.
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRefs = useRef(new Map());

  const displayPuzzles = orderedIds.map((id) => puzzles.find((p) => p.id === id)).filter(Boolean);

  const handleDragHandlePointerDown = (event, puzzleId) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startY = event.clientY;
    setDragId(puzzleId);
    setDragOffset(0);

    const onMove = (moveEvent) => {
      setDragOffset(moveEvent.clientY - startY);
    };
    const onUp = (upEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const others = orderedIds.filter((id) => id !== puzzleId);
      let targetIndex = 0;
      others.forEach((id) => {
        const rect = cardRefs.current.get(id)?.getBoundingClientRect();
        if (rect && upEvent.clientY > rect.top + rect.height / 2) targetIndex += 1;
      });
      const aboveId = targetIndex > 0 ? others[targetIndex - 1] : null;
      const belowId = targetIndex < others.length ? others[targetIndex] : null;

      setDragId(null);
      setDragOffset(0);

      const originalIndex = orderedIds.indexOf(puzzleId);
      if (targetIndex === originalIndex) return; // dropped back where it started

      // Unsplice from wherever the puzzle used to be: if something was
      // chained directly (and only) to the dragged puzzle at its OLD
      // position, close that gap by pointing it at what the dragged puzzle
      // used to depend on. Without this, moving a puzzle away from a spot
      // leaves a stale link behind - and if the puzzle is later dropped back
      // near its old neighbors, that stale link and the new one it picks up
      // can both point at it, tying two puzzles at the same depth again
      // (which is what made upward drags "not stick").
      const draggedPuzzle = puzzles.find((p) => p.id === puzzleId);
      const oldDependsOn = draggedPuzzle?.dependsOn || [];
      const oldSuccessor = puzzles.find(
        (p) => p.id !== puzzleId && p.dependsOn.length === 1 && p.dependsOn[0] === puzzleId,
      );
      if (oldSuccessor && oldSuccessor.id !== belowId) {
        updatePuzzle(oldSuccessor.id, { dependsOn: oldDependsOn });
      }

      updatePuzzle(puzzleId, { dependsOn: aboveId ? [aboveId] : [] });

      // Splice into an existing simple chain: if the puzzle now below was
      // directly (and only) chained to whatever is now above, re-point it
      // through the dragged puzzle instead - otherwise dropping into the
      // middle of a chain would tie both puzzles at the same depth and the
      // list would sort back out of drop order. Left alone for anything
      // more complex (multiple requirements) so a drag never silently
      // clobbers a manually-set branching setup.
      if (belowId) {
        const belowPuzzle = puzzles.find((p) => p.id === belowId);
        const belowWasChainedToAbove = aboveId
          ? belowPuzzle?.dependsOn.length === 1 && belowPuzzle.dependsOn[0] === aboveId
          : belowPuzzle?.dependsOn.length === 0;
        if (belowWasChainedToAbove) updatePuzzle(belowId, { dependsOn: [puzzleId] });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setFormOpen(true);
  };
  const handleSubmit = (values) => {
    if (editing) updatePuzzle(editing.id, values);
    else addPuzzle(room.id, values);
  };
  const handleDelete = (p) => {
    requestConfirm({
      title: 'Delete puzzle',
      message: `Delete puzzle "${p.name}"? This removes it from any chains, zones, and props.`,
      confirmLabel: 'Delete',
      onConfirm: () => deletePuzzle(p.id),
    });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-100">Puzzles & clues</h1>
          <p className="mt-1 text-sm text-stone-500">{puzzles.length} puzzle{puzzles.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          New puzzle
        </Button>
      </div>

      {puzzles.length === 0 ? (
        <EmptyState
          icon={PuzzleIcon}
          title="No puzzles yet"
          description="Add your first puzzle: its solution, hints, and what it depends on to build the chain."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} />
              New puzzle
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {displayPuzzles.map((p) => {
            const unlocks = unlocksOf(p.id);
            return (
              <Card
                key={p.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(p.id, el);
                  else cardRefs.current.delete(p.id);
                }}
                className={dragId === p.id ? 'relative z-10 shadow-2xl' : ''}
                style={
                  dragId === p.id
                    ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
                    : undefined
                }
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      title="Drag to reorder (sets what this puzzle requires)"
                      onPointerDown={(e) => handleDragHandlePointerDown(e, p.id)}
                      className="touch-none mt-0.5 shrink-0 cursor-grab text-stone-600 hover:text-stone-300 active:cursor-grabbing"
                    >
                      <GripVertical size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-stone-100">{p.name}</h3>
                        <Badge>{p.status}</Badge>
                        <span className="text-xs text-stone-500">{p.type}</span>
                        {zoneName(p.zoneId) && (
                          <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-400">
                            {zoneName(p.zoneId)}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="mt-1.5 text-sm text-stone-400">{p.description}</p>
                      )}

                      {p.dependsOn.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                          <span>Requires:</span>
                          {p.dependsOn.map((id) => (
                            <span key={id} className="rounded-full bg-stone-800 px-2 py-0.5 text-stone-300">
                              {puzzleName(id)}
                            </span>
                          ))}
                        </div>
                      )}
                      {unlocks.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                          <ArrowRight size={12} />
                          <span>Unlocks:</span>
                          {unlocks.map((u) => (
                            <span key={u.id} className="rounded-full bg-pink-400/10 px-2 py-0.5 text-pink-200">
                              {u.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {p.hints.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
                          <Lightbulb size={12} />
                          {p.hints.length} hint{p.hints.length === 1 ? '' : 's'}
                        </div>
                      )}
                      {p.audioClips?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {p.audioClips.map((clip) => (
                            <div key={clip.id} className="flex items-center gap-1.5">
                              <Music size={12} className="shrink-0 text-stone-500" />
                              <audio controls src={clip.dataUrl} className="h-7 max-w-xs" />
                            </div>
                          ))}
                        </div>
                      )}
                      {boardsFor(p.id).length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                          <LayoutGrid size={12} />
                          <span>Brainstorm:</span>
                          {boardsFor(p.id).map((b) => (
                            <Link
                              key={b.id}
                              to={`/rooms/${room.id}/brainstorm?board=${b.id}`}
                              className="rounded-full bg-stone-800 px-2 py-0.5 text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                            >
                              {b.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}>
                        <Trash2 size={14} className="text-rose-400" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <PuzzleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        zones={zones}
        otherPuzzles={puzzles.filter((p) => p.id !== editing?.id)}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
