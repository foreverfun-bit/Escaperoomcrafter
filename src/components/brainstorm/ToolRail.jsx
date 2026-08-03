import { StickyNote, Type, Square, Frame, Image, Pencil, Spline, Trash2 } from 'lucide-react';

const TOOLS = [
  { id: 'sticky', label: 'Note', icon: StickyNote },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'shape', label: 'Shape', icon: Square },
  { id: 'section', label: 'Area', icon: Frame },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'draw', label: 'Draw', icon: Pencil },
  { id: 'connect', label: 'Line', icon: Spline },
];

export default function ToolRail({ tool, onToolChange, hasSelection, onDeleteSelected }) {
  return (
    <aside className="sticky top-4 flex shrink-0 flex-col gap-1 self-start rounded-xl border border-stone-800 bg-stone-900 p-1.5">
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onToolChange(id)}
          title={label}
          className={`flex flex-col items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition-colors ${
            tool === id ? 'bg-pink-400 text-stone-950' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
          }`}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
      <div className="my-1 h-px bg-stone-800" />
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        title="Delete selected"
        className="flex flex-col items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 disabled:pointer-events-none disabled:opacity-30"
      >
        <Trash2 size={17} />
        Delete
      </button>
    </aside>
  );
}
