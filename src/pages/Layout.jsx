import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Map, ArrowLeft } from 'lucide-react';
import { useRooms, useZones, usePuzzles, usePropsInZone } from '../store/RoomsContext.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { ZONE_PALETTE } from '../store/constants.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ZoneFormModal from '../components/ZoneFormModal.jsx';
import PropFormModal from '../components/PropFormModal.jsx';
import BlueprintCanvas from '../components/layout/BlueprintCanvas.jsx';
import InteriorCanvas from '../components/layout/InteriorCanvas.jsx';

const QUICK_ADD_KINDS = ['Prop', 'Lock / Hardware', 'Furniture', 'Electronics'];

export default function Layout() {
  const { room } = useOutletContext();
  const { addZone, updateZone, deleteZone, moveZone, updatePuzzle, addProp, updateProp } = useRooms();
  const zones = useZones(room.id);
  const puzzles = usePuzzles(room.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [interiorZoneId, setInteriorZoneId] = useState(null);
  const [propFormOpen, setPropFormOpen] = useState(false);
  const [editingProp, setEditingProp] = useState(null);
  const { requestConfirm, dialogProps } = useConfirmDialog();

  const puzzlesInZone = (zoneId) => puzzles.filter((p) => p.zoneId === zoneId);
  const unassigned = puzzles.filter((p) => !p.zoneId);
  const interiorZone = zones.find((z) => z.id === interiorZoneId) || null;
  const items = usePropsInZone(interiorZoneId);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (zone) => {
    setEditing({ ...zone, puzzleIds: puzzlesInZone(zone.id).map((p) => p.id) });
    setFormOpen(true);
  };

  const handleSubmit = (values) => {
    const { puzzleIds, ...zoneFields } = values;
    const zoneId = editing ? editing.id : addZone(room.id, zoneFields);
    if (editing) updateZone(editing.id, zoneFields);

    puzzles.forEach((p) => {
      const shouldBeInZone = puzzleIds.includes(p.id);
      const isInZone = p.zoneId === zoneId;
      if (shouldBeInZone && !isInZone) updatePuzzle(p.id, { zoneId });
      else if (!shouldBeInZone && isInZone) updatePuzzle(p.id, { zoneId: null });
    });
  };

  const handleDelete = (zone) => {
    requestConfirm({
      title: 'Delete zone',
      message: `Delete zone "${zone.name}"? Puzzles and props placed in it will become unassigned.`,
      confirmLabel: 'Delete zone',
      onConfirm: () => deleteZone(zone.id),
    });
  };

  const handleQuickAdd = (category) => {
    if (!interiorZone) return;
    const cascade = items.length;
    addProp(room.id, {
      name: category,
      category,
      zoneId: interiorZone.id,
      x: 8 + ((cascade * 11) % 70),
      y: 8 + ((cascade * 13) % 66),
      w: 20,
      h: 16,
    });
  };

  const openEditProp = (prop) => {
    setEditingProp(prop);
    setPropFormOpen(true);
  };

  const handlePropSubmit = (values) => {
    if (editingProp) updateProp(editingProp.id, values);
  };

  const handleRemoveFromInterior = (prop) => {
    updateProp(prop.id, { zoneId: null, x: null, y: null, w: null, h: null });
  };

  if (interiorZone) {
    return (
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <button
              onClick={() => setInteriorZoneId(null)}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-300"
            >
              <ArrowLeft size={14} />
              Blueprint
            </button>
            <h1 className="text-lg font-semibold text-stone-100">
              {interiorZone.name} — interior
              {interiorZone.widthFt && interiorZone.lengthFt ? (
                <span className="ml-2 text-sm font-normal text-stone-500">
                  {interiorZone.widthFt}' × {interiorZone.lengthFt}'
                </span>
              ) : null}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Place props, locks, and furniture inside this zone. Drag to position, corner handle to resize.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_KINDS.map((kind) => (
              <Button key={kind} variant="secondary" size="sm" onClick={() => handleQuickAdd(kind)}>
                <Plus size={13} />
                {kind}
              </Button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Map}
            title="Nothing placed yet"
            description="Use the buttons above to drop props, locks, and furniture into this zone's floor plan."
          />
        ) : null}
        <InteriorCanvas
          items={items}
          onCommitMove={(id, x, y) => updateProp(id, { x, y })}
          onCommitResize={(id, w, h) => updateProp(id, { w, h })}
          onEdit={openEditProp}
          onRemove={handleRemoveFromInterior}
        />

        <PropFormModal
          open={propFormOpen}
          onClose={() => setPropFormOpen(false)}
          onSubmit={handlePropSubmit}
          initial={editingProp}
          puzzles={puzzles}
          zones={zones}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-100">Room layout & flow</h1>
          <p className="mt-1 text-sm text-stone-500">
            Drag zones to sketch the floor plan. The number badge is the player's path order - hover a zone and
            use the arrows next to it to reorder.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          New zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No zones yet"
          description="Break the physical room into zones (e.g. entryway, library, vault) and place puzzles in each to map the player's path."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} />
              New zone
            </Button>
          }
        />
      ) : (
        <BlueprintCanvas
          zones={zones}
          puzzleCountFor={(zoneId) => puzzlesInZone(zoneId).length}
          onCommitMove={(id, x, y) => updateZone(id, { x, y })}
          onCommitResize={(id, w, h) => updateZone(id, { w, h })}
          onEdit={openEdit}
          onOpenInterior={(zone) => setInteriorZoneId(zone.id)}
          onDelete={handleDelete}
          onMoveZone={moveZone}
        />
      )}

      {unassigned.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-stone-300">Not yet placed in a zone</h2>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((p) => (
              <span key={p.id} className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-300">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <ZoneFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        defaultColor={ZONE_PALETTE[zones.length % ZONE_PALETTE.length]}
        puzzles={puzzles}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
