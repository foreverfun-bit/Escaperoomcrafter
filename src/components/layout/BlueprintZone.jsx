import { Maximize2, Pencil, Trash2 } from 'lucide-react';

export default function BlueprintZone({ zone, order, puzzleCount, x, y, w, h, onPointerDown, onResizePointerDown, onEdit, onOpenInterior, onDelete }) {
  return (
    <div
      className="group absolute touch-none select-none"
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
      onPointerDown={onPointerDown}
    >
      <div
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-lg border-2 border-black/30 p-2.5 text-white shadow-lg"
        style={{ background: zone.color }}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/30 text-[11px] font-bold">
            {order}
          </span>
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100" data-no-drag>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInterior();
              }}
              title="Design interior"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/30 hover:bg-black/50"
            >
              <Maximize2 size={12} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit zone"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/30 hover:bg-black/50"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete zone"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/30 hover:bg-rose-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <div>
          <p className="truncate text-sm font-bold leading-tight">{zone.name}</p>
          <p className="text-[11px] font-semibold text-white/75">
            {puzzleCount} puzzle{puzzleCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <span
        onPointerDown={onResizePointerDown}
        className="absolute -bottom-1 -right-1 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-stone-500 bg-stone-700"
      />
    </div>
  );
}
