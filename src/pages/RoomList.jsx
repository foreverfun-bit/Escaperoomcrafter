import { useState } from 'react';
import { Plus, DoorOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { useRooms } from '../store/RoomsContext.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import RoomCard from '../components/RoomCard.jsx';
import RoomFormModal from '../components/RoomFormModal.jsx';

export default function RoomList() {
  const { data, syncState, syncError, addRoom, updateRoom, deleteRoom } = useRooms();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const { requestConfirm, dialogProps } = useConfirmDialog();

  const openCreate = () => {
    setEditingRoom(null);
    setFormOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setFormOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingRoom) updateRoom(editingRoom.id, values);
    else addRoom(values);
  };

  const handleDelete = (room) => {
    requestConfirm({
      title: 'Delete room',
      message: `Delete "${room.name}" and all of its puzzles, props, layout, and tasks?`,
      confirmLabel: 'Delete room',
      onConfirm: () => deleteRoom(room.id),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-100">Your escape rooms</h1>
          <p className="mt-1 text-sm text-stone-500">
            {data.rooms.length} room{data.rooms.length === 1 ? '' : 's'} in your portfolio
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          New room
        </Button>
      </div>

      {syncState === 'error' && data.rooms.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              Can&apos;t reach the server right now - showing your last saved copy. Anything you change here
              stays on this device only until the connection comes back, so reload once it's working again to
              make sure everything's synced.
            </span>
          </div>
          <Button onClick={() => window.location.reload()} size="sm" variant="ghost">
            Retry
          </Button>
        </div>
      )}

      {syncState === 'error' && data.rooms.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load your rooms"
          description={
            <>
              There was a problem reaching the server. Check your connection and reload the page - nothing
              has been lost, this is just a display issue.
              {syncError && (
                <span className="mt-2 block font-mono text-xs text-stone-600">{syncError}</span>
              )}
            </>
          }
          action={
            <Button onClick={() => window.location.reload()} size="sm">
              Reload
            </Button>
          }
        />
      ) : syncState === 'loading' ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-stone-600" />
        </div>
      ) : data.rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms yet"
          description="Create your first escape room to start tracking puzzles, props, layout, and build tasks."
          action={
            <Button onClick={openCreate} size="sm">
              <Plus size={14} />
              New room
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.rooms.map((room) => (
            <RoomCard key={room.id} room={room} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <RoomFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editingRoom}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
