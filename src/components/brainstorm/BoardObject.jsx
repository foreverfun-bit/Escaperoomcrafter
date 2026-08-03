import { Star, X } from 'lucide-react';
import EditableText from './EditableText.jsx';
import BoardShape from './BoardShape.jsx';

export default function BoardObject({
  idea,
  x,
  y,
  w,
  h,
  selected,
  connectSource,
  onPointerDown,
  onResizePointerDown,
  onSelect,
  onDelete,
  onFieldChange,
  onToggleKeeper,
}) {
  const type = idea.boardType || 'sticky';

  const stopAndSelect = (event) => {
    event.stopPropagation();
    onSelect();
  };

  const body = (() => {
    if (type === 'sticky') {
      return (
        <div
          className="board-sticky flex h-full w-full flex-col gap-2 rounded-sm rounded-bl-2xl p-3 text-stone-900 shadow-lg"
          style={{ background: idea.color }}
        >
          <EditableText
            className="text-sm font-bold"
            value={idea.title}
            placeholder="Untitled idea"
            onPointerDown={stopAndSelect}
            onChange={(value) => onFieldChange('title', value)}
          />
          <EditableText
            className="flex-1 text-sm leading-snug"
            value={idea.notes}
            placeholder="Type freely…"
            onPointerDown={stopAndSelect}
            onChange={(value) => onFieldChange('notes', value)}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleKeeper();
              }}
              className="text-stone-900/40 hover:text-amber-600"
              aria-label="Toggle keeper"
            >
              <Star size={14} fill={idea.keeper ? 'currentColor' : 'none'} className={idea.keeper ? 'text-amber-600' : ''} />
            </button>
            {idea.convertedPuzzleId && <span className="text-[11px] font-semibold text-stone-900/50">→ puzzle</span>}
          </div>
        </div>
      );
    }
    if (type === 'text') {
      return (
        <div
          className={`h-full w-full rounded-lg p-1 transition-colors ${
            selected ? 'bg-stone-900/40 ring-1 ring-pink-400/40' : 'hover:bg-stone-900/25'
          }`}
        >
          <EditableText
            className="h-full text-lg font-semibold text-stone-100"
            value={idea.notes}
            placeholder="Type freely…"
            onPointerDown={stopAndSelect}
            onChange={(value) => onFieldChange('notes', value)}
          />
        </div>
      );
    }
    if (type === 'shape') {
      return (
        <BoardShape shapeKind={idea.shapeKind} color={idea.color}>
          <EditableText
            className="w-full text-center text-sm font-bold text-stone-900"
            value={idea.notes}
            placeholder="Label"
            onPointerDown={stopAndSelect}
            onChange={(value) => onFieldChange('notes', value)}
          />
        </BoardShape>
      );
    }
    if (type === 'section') {
      return (
        <div className="relative h-full w-full rounded-xl border-2 border-dashed border-pink-400/40 bg-pink-400/5">
          <div className="absolute -top-3 left-3 rounded bg-stone-950 px-2">
            <EditableText
              className="text-xs font-bold uppercase tracking-wide text-pink-300"
              value={idea.title}
              placeholder="Section"
              onPointerDown={stopAndSelect}
              onChange={(value) => onFieldChange('title', value)}
            />
          </div>
        </div>
      );
    }
    // image
    return (
      <div className="flex h-full w-full flex-col gap-2 rounded-lg border-2 border-stone-700 bg-stone-900 p-2.5">
        <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-stone-700 text-center text-[11px] font-bold uppercase tracking-wide text-stone-500">
          Image / reference
        </div>
        <EditableText
          className="text-xs text-stone-300"
          value={idea.notes}
          placeholder="Describe the reference…"
          onPointerDown={stopAndSelect}
          onChange={(value) => onFieldChange('notes', value)}
        />
      </div>
    );
  })();

  return (
    <div
      className="group absolute touch-none select-none"
      style={{ left: `${x}%`, top: `${y}%`, width: w, height: h }}
      onPointerDown={onPointerDown}
      data-board-object-id={idea.id}
    >
      <div
        className={`relative h-full w-full ${selected ? 'outline outline-2 outline-offset-2 outline-pink-400' : ''} ${
          connectSource ? 'outline outline-2 outline-offset-2 outline-emerald-400' : ''
        } ${idea.convertedPuzzleId ? 'opacity-70' : ''}`}
      >
        {body}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-2 -top-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full border border-stone-500 bg-stone-800 text-stone-300 hover:bg-rose-600 hover:text-white group-hover:flex"
          style={{ display: selected ? 'flex' : undefined }}
          aria-label="Delete object"
        >
          <X size={12} />
        </button>
        <span
          onPointerDown={onResizePointerDown}
          className="absolute -bottom-1 -right-1 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-stone-500 bg-stone-700"
        />
      </div>
    </div>
  );
}
