import { useRef, useState, useCallback } from 'react';
import InteriorItem from './InteriorItem.jsx';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function InteriorCanvas({ items, onCommitMove, onCommitResize, onEdit, onRemove }) {
  const canvasRef = useRef(null);
  const [liveDrag, setLiveDrag] = useState(null);
  const [liveResize, setLiveResize] = useState(null);

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

  return (
    <div
      ref={canvasRef}
      className="board-canvas relative w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-950"
      style={{ aspectRatio: '4 / 3' }}
    >
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
