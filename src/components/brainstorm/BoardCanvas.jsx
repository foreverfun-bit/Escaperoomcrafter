import { useRef, useState, useCallback } from 'react';
import BoardObject from './BoardObject.jsx';

export const CANVAS_WIDTH = 2000;
export const CANVAS_HEIGHT = 1300;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function centerOf(idea) {
  return {
    x: idea.x + ((idea.w / 2) / CANVAS_WIDTH) * 100,
    y: idea.y + ((idea.h / 2) / CANVAS_HEIGHT) * 100,
  };
}

export default function BoardCanvas({
  ideas,
  connections,
  paths,
  tool,
  connectSource,
  selection,
  onSelect,
  onClearSelection,
  onCreateAt,
  onCommitMove,
  onCommitResize,
  onConnectClick,
  onFinishDraw,
  onFieldChange,
  onToggleKeeper,
  onDeleteIdea,
}) {
  const canvasRef = useRef(null);
  const [liveDrag, setLiveDrag] = useState(null); // { id, x, y }
  const [liveResize, setLiveResize] = useState(null); // { id, w, h }
  const [drawingPoints, setDrawingPoints] = useState(null); // string[] of "x,y"

  const effective = useCallback(
    (idea) => ({
      x: liveDrag?.id === idea.id ? liveDrag.x : idea.x,
      y: liveDrag?.id === idea.id ? liveDrag.y : idea.y,
      w: liveResize?.id === idea.id ? liveResize.w : idea.w,
      h: liveResize?.id === idea.id ? liveResize.h : idea.h,
    }),
    [liveDrag, liveResize],
  );

  const handleObjectPointerDown = (event, idea) => {
    if (event.target.closest('[data-no-drag]')) return;
    if (tool === 'connect') {
      event.stopPropagation();
      onConnectClick(idea.id);
      return;
    }
    onSelect({ type: 'idea', id: idea.id });
    if (event.target.closest('.editable-text')) return; // let native focus/caret happen
    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { x: idea.x, y: idea.y };
    let finalPos = original;
    // Explicit pointer capture keeps the whole gesture tied to this element
    // even though re-rendering on every move touches a lot of the canvas tree.
    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (moveEvent) => {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
      const next = {
        x: clamp(Math.round(original.x + dx), 0, 92),
        y: clamp(Math.round(original.y + dy), 0, 92),
      };
      finalPos = next;
      setLiveDrag({ id: idea.id, ...next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLiveDrag(null);
      if (finalPos !== original) onCommitMove(idea.id, finalPos.x, finalPos.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizePointerDown = (event, idea) => {
    event.stopPropagation();
    event.preventDefault();
    onSelect({ type: 'idea', id: idea.id });
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { w: idea.w, h: idea.h };
    let finalSize = original;

    const onMove = (moveEvent) => {
      const next = {
        w: clamp(Math.round(original.w + (moveEvent.clientX - startX)), 90, 900),
        h: clamp(Math.round(original.h + (moveEvent.clientY - startY)), 50, 700),
      };
      finalSize = next;
      setLiveResize({ id: idea.id, ...next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLiveResize(null);
      if (finalSize !== original) onCommitResize(idea.id, finalSize.w, finalSize.h);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleCanvasDoubleClick = (event) => {
    if (event.target !== canvasRef.current) return;
    if (tool === 'connect' || tool === 'draw') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clamp(Math.round(((event.clientX - rect.left) / rect.width) * 100), 0, 88);
    const y = clamp(Math.round(((event.clientY - rect.top) / rect.height) * 100), 0, 84);
    onCreateAt(x, y);
  };

  const handleCanvasPointerDown = (event) => {
    if (event.target !== canvasRef.current) return;
    if (tool === 'draw') {
      event.currentTarget.setPointerCapture(event.pointerId);
      const rect = canvasRef.current.getBoundingClientRect();
      const point = `${Math.round(event.clientX - rect.left)},${Math.round(event.clientY - rect.top)}`;
      let points = [point];
      setDrawingPoints(points);

      const onMove = (moveEvent) => {
        points = [...points, `${Math.round(moveEvent.clientX - rect.left)},${Math.round(moveEvent.clientY - rect.top)}`];
        setDrawingPoints(points);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (points.length > 1) onFinishDraw(points.join(' '));
        setDrawingPoints(null);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return;
    }
    onClearSelection();
  };

  return (
    <div
      ref={canvasRef}
      className={`board-canvas relative shrink-0 rounded-xl border border-stone-800 bg-stone-950 ${
        tool === 'draw' ? 'touch-none' : ''
      }`}
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onDoubleClick={handleCanvasDoubleClick}
      onPointerDown={handleCanvasPointerDown}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {paths.map((path) => {
          const isSelected = selection?.type === 'path' && selection.id === path.id;
          return (
            <g key={path.id}>
              <polyline
                points={path.points}
                fill="none"
                stroke={isSelected ? '#f472b6' : path.color}
                strokeWidth={isSelected ? path.width + 1.5 : path.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={path.points}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect({ type: 'path', id: path.id });
                }}
              />
            </g>
          );
        })}
        {drawingPoints && (
          <polyline points={drawingPoints.join(' ')} fill="none" stroke="#f472b6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {connections.map((connection) => {
          const from = ideas.find((i) => i.id === connection.from);
          const to = ideas.find((i) => i.id === connection.to);
          if (!from || !to) return null;
          const fromPos = effective(from);
          const toPos = effective(to);
          const p1 = centerOf({ ...from, ...fromPos });
          const p2 = centerOf({ ...to, ...toPos });
          const isSelected = selection?.type === 'connection' && selection.id === connection.id;
          return (
            <g key={connection.id}>
              <line
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke={isSelected ? '#f472b6' : '#c98a2c'}
                strokeWidth={isSelected ? 3.5 : 2.5}
                strokeLinecap="round"
              />
              <line
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke="transparent"
                strokeWidth={16}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect({ type: 'connection', id: connection.id });
                }}
              />
            </g>
          );
        })}
      </svg>

      {ideas.map((idea) => {
        const pos = effective(idea);
        return (
          <BoardObject
            key={idea.id}
            idea={idea}
            x={pos.x}
            y={pos.y}
            w={pos.w}
            h={pos.h}
            selected={selection?.type === 'idea' && selection.id === idea.id}
            connectSource={connectSource === idea.id}
            onPointerDown={(event) => handleObjectPointerDown(event, idea)}
            onResizePointerDown={(event) => handleResizePointerDown(event, idea)}
            onSelect={() => onSelect({ type: 'idea', id: idea.id })}
            onDelete={() => onDeleteIdea(idea.id)}
            onFieldChange={(field, value) => onFieldChange(idea.id, field, value)}
            onToggleKeeper={() => onToggleKeeper(idea.id)}
          />
        );
      })}
    </div>
  );
}
