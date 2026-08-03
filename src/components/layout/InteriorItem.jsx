import { Pencil, X } from 'lucide-react';

const KIND_COLORS = {
  Prop: '#3b6fa6',
  'Lock / Hardware': '#c2564a',
  Electronics: '#0f8f82',
  Furniture: '#8a6a3f',
  Decor: '#7c5cbf',
  Consumable: '#3f8f5c',
  Other: '#57534e',
};

export default function InteriorItem({ prop, x, y, w, h, onPointerDown, onResizePointerDown, onEdit, onRemove }) {
  return (
    <div
      className="group absolute touch-none select-none"
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
      onPointerDown={onPointerDown}
    >
      <div
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-md border-2 border-black/30 p-2 text-white shadow-lg"
        style={{ background: KIND_COLORS[prop.category] || KIND_COLORS.Other }}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-white/70">{prop.category}</span>
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100" data-no-drag>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex h-5 w-5 items-center justify-center rounded bg-black/30 hover:bg-black/50"
            >
              <Pencil size={10} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex h-5 w-5 items-center justify-center rounded bg-black/30 hover:bg-rose-600"
            >
              <X size={10} />
            </button>
          </div>
        </div>
        <p className="truncate text-xs font-bold leading-tight">{prop.name}</p>
      </div>
      <span
        onPointerDown={onResizePointerDown}
        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-stone-500 bg-stone-700"
      />
    </div>
  );
}
