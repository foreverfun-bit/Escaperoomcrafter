import { Minus, Plus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { BOARD_SWATCHES, SHAPE_KINDS } from '../../store/constants.js';

const KIND_LABELS = { sticky: 'Sticky note', text: 'Text', shape: 'Shape', section: 'Section', image: 'Image' };

const SHAPE_PREVIEW = {
  rectangle: 'rounded-none',
  rounded: 'rounded-md',
  ellipse: 'rounded-full',
  diamond: 'rounded-none board-shape-diamond',
};

export default function PropertiesPanel({
  selection,
  idea,
  hasPath,
  hasConnection,
  onColorChange,
  onShapeKindChange,
  onFontSizeChange,
  onConvert,
  onDelete,
}) {
  if (!selection) {
    return (
      <aside className="sticky top-4 hidden w-52 shrink-0 self-start rounded-xl border border-stone-800 bg-stone-900 p-4 lg:block">
        <p className="text-sm text-stone-500">Select an object to edit its color, shape, or size.</p>
      </aside>
    );
  }

  if (selection.type === 'path' && hasPath) {
    return (
      <aside className="sticky top-4 w-52 shrink-0 self-start rounded-xl border border-stone-800 bg-stone-900 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-pink-300">Drawing</p>
        <Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
          Delete stroke
        </Button>
      </aside>
    );
  }

  if (selection.type === 'connection' && hasConnection) {
    return (
      <aside className="sticky top-4 w-52 shrink-0 self-start rounded-xl border border-stone-800 bg-stone-900 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-pink-300">Connector</p>
        <Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
          Delete connector
        </Button>
      </aside>
    );
  }

  if (!idea) return null;

  const type = idea.boardType || 'sticky';
  const showColor = type !== 'text';
  const showShapeKind = type === 'shape';
  const showFontSize = ['sticky', 'text', 'shape'].includes(type);
  const canConvert = ['sticky', 'text', 'shape'].includes(type) && !idea.convertedPuzzleId;

  return (
    <aside className="sticky top-4 w-52 shrink-0 self-start space-y-4 rounded-xl border border-stone-800 bg-stone-900 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-pink-300">{KIND_LABELS[type] || 'Object'}</p>

      {showColor && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Color</p>
          <div className="flex flex-wrap gap-1.5">
            {BOARD_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                aria-label={`Set color ${color}`}
                className={`h-6 w-6 rounded-full border-2 ${
                  idea.color === color ? 'border-pink-400' : 'border-stone-700'
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      )}

      {showShapeKind && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Shape</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SHAPE_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onShapeKindChange(kind)}
                aria-label={`${kind} shape`}
                className={`flex h-9 items-center justify-center rounded-lg border ${
                  idea.shapeKind === kind ? 'border-pink-400 bg-stone-800' : 'border-stone-700 bg-stone-950'
                }`}
              >
                <span className={`h-4 w-4 bg-stone-300 ${SHAPE_PREVIEW[kind]}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {showFontSize && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Font size</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onFontSizeChange(-2)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <Minus size={13} />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-stone-200">{idea.fontSize}</span>
            <button
              type="button"
              onClick={() => onFontSizeChange(2)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}

      {canConvert && (
        <Button variant="secondary" size="sm" className="w-full" onClick={onConvert}>
          Turn into puzzle
        </Button>
      )}
      {idea.convertedPuzzleId && <p className="text-xs text-stone-500">Converted to a puzzle</p>}

      <Button variant="danger" size="sm" className="w-full" onClick={onDelete}>
        Delete
      </Button>
    </aside>
  );
}
