import { useRef, useState, useCallback } from 'react';
import InteriorItem from './InteriorItem.jsx';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const DRAW_COLOR = '#e7e5e4';
const DRAW_WIDTH = 2;

export default function InteriorCanvas({ items, paths, tool, onCommitMove, onCommitResize, onEdit, onRemove, onFinishDraw }) {
  const canvasRef = useRef(null);
  const [liveDrag, setLiveDrag] = useState(null);
  const [liveResize, setLiveResize] = useState(null);
  const [drawingPoints, setDrawingPoints] = useState(null);

  const effective = useCallback(
    (item) => ({
      x: liveDrag?.id === item.id ? liveDrag.x : item.x,
      y: liveDrag?.id === item.id ? liveDrag.y : item.y,
      w: liveResize?.id === item.id ? liveResize.w : item.w,
      h: liveResize?.id === item.id ? liveResize.h : item.h,
    }),
    [liveDrag, liveResize],
  );

  const handlePointerDown = (event, item) => {
    if (tool === 'draw') return; // sketching is exclusive of arranging props
    if (event.target.closest('[data-no-drag]')) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { x: item.x, y: item.y };
    let finalPos = original;

    const onMove = (moveEvent) => {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
      const next = {
        x: clamp(Math.round(original.x + dx), 0, 100 - item.w),
        y: clamp(Math.round(original.y + dy), 0, 100 - item.h),
      };
      finalPos = next;
      setLiveDrag({ id: item.id, ...next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLiveDrag(null);
      onCommitMove(item.id, finalPos.x, finalPos.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizePointerDown = (event, item) => {
    if (tool === 'draw') return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { w: item.w, h: item.h };
    let finalSize = original;

    const onMove = (moveEvent) => {
      const dw = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dh = ((moveEvent.clientY - startY) / rect.height) * 100;
      const next = {
        w: clamp(Math.round(original.w + dw), 8, 100 - item.x),
        h: clamp(Math.round(original.h + dh), 8, 100 - item.y),
      };
      finalSize = next;
      setLiveResize({ id: item.id, ...next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLiveResize(null);
      onCommitResize(item.id, finalSize.w, finalSize.h);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Freehand sketching, mirroring the Brainstorm board's draw tool but in
  // percentage coordinates (like everything else on this canvas) instead of
  // raw pixels, so strokes stay correctly placed as the canvas is resized.
  const handleCanvasPointerDown = (event) => {
    if (tool !== 'draw') return;
    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const toPoint = (e) => {
      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    };
    let points = [toPoint(event)];
    setDrawingPoints(points);

    const onMove = (moveEvent) => {
      points = [...points, toPoint(moveEvent)];
      setDrawingPoints(points);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setDrawingPoints(null);
      if (points.length > 1) onFinishDraw(points.join(' '));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={canvasRef}
      className={`board-canvas relative w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-950 ${
        tool === 'draw' ? 'touch-none cursor-crosshair' : ''
      }`}
      style={{ aspectRatio: '4 / 3' }}
      onPointerDown={handleCanvasPointerDown}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {paths.map((path) => (
          <polyline
            key={path.id}
            points={path.points}
            fill="none"
            stroke={path.color}
            strokeWidth={path.width}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {drawingPoints && (
          <polyline
            points={drawingPoints.join(' ')}
            fill="none"
            stroke={DRAW_COLOR}
            strokeWidth={DRAW_WIDTH}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {items.map((item) => {
        const pos = effective(item);
        return (
          <InteriorItem
            key={item.id}
            prop={item}
            x={pos.x}
            y={pos.y}
            w={pos.w}
            h={pos.h}
            onPointerDown={(event) => handlePointerDown(event, item)}
            onResizePointerDown={(event) => handleResizePointerDown(event, item)}
            onEdit={() => onEdit(item)}
            onRemove={() => onRemove(item)}
          />
        );
      })}
    </div>
  );
}
