import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Puzzle } from 'lucide-react';

export default function BoardTabs({ boards, puzzles = [], activeId, onSelect, onCreate, onRename, onDelete }) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const puzzleName = (id) => puzzles.find((p) => p.id === id)?.name;

  const startRename = (board) => {
    setRenamingId(board.id);
    setRenameValue(board.name);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) onRename(renamingId, trimmed);
    setRenamingId(null);
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {boards.map((board) => (
        <div
          key={board.id}
          className={`group flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            board.id === activeId
              ? 'border-pink-400/60 bg-pink-400/10 text-pink-200'
              : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
          }`}
        >
          {renamingId === board.id ? (
            <>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="w-24 rounded border border-stone-700 bg-stone-950 px-1.5 py-0.5 text-xs text-stone-100 outline-none focus:border-pink-400"
              />
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={commitRename} className="text-emerald-400 hover:text-emerald-300">
                <Check size={12} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setRenamingId(null)}
                className="text-stone-500 hover:text-stone-300"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onSelect(board.id)} className="flex items-center gap-1">
                {board.name}
                {puzzleName(board.puzzleId) && (
                  <span
                    title={`Linked to puzzle: ${puzzleName(board.puzzleId)}`}
                    className="flex items-center gap-0.5 rounded-full bg-stone-800 px-1.5 py-0.5 text-[10px] font-normal text-stone-400"
                  >
                    <Puzzle size={9} />
                    {puzzleName(board.puzzleId)}
                  </span>
                )}
              </button>
              <span className="ml-0.5 hidden items-center gap-1 group-hover:flex">
                <button
                  type="button"
                  onClick={() => startRename(board)}
                  title="Rename board"
                  className="text-stone-500 hover:text-stone-200"
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(board)}
                  title="Delete board"
                  className="text-stone-500 hover:text-rose-400"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-1 rounded-lg border border-dashed border-stone-700 px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:border-stone-600 hover:text-stone-300"
      >
        <Plus size={12} />
        New board
      </button>
    </div>
  );
}
