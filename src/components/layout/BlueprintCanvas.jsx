import { useRef, useState, useCallback } from 'react';
import BlueprintZone from './BlueprintZone.jsx';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function BlueprintCanvas({
  zones,
  puzzleCountFor,
  onCommitMove,
  onCommitResize,
  onEdit,
  onOpenInterior,
  onDelete,
  onMoveZone,
}) {
  const canvasRef = useRef(null);
  const [liveDrag, setLiveDrag] = useState(null); // { id, x, y }
  const [liveResize, setLiveResize] = useState(null); // { id, w, h }

  const effective = useCallback(
    (zone) => ({
      x: liveDrag?.id === zone.id ? liveDrag.x : zone.x,
      y: liveDrag?.id === zone.id ? liveDrag.y : zone.y,
      w: liveResize?.id === zone.id ? liveResize.w : zone.w,
      h: liveResize?.id === zone.id ? liveResize.h : zone.h,
    }),
    [liveDrag, liveResize],
  );

  const handlePointerDown = (event, zone) => {
    if (event.target.closest('[data-no-drag]')) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { x: zone.x, y: zone.y };
    let moved = false;
    let finalPos = original;

    const onMove = (moveEvent) => {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
      const next = {
        x: clamp(Math.round(original.x + dx), 0, 100 - zone.w),
        y: clamp(Math.round(original.y + dy), 0, 100 - zone.h),
      };
      finalPos = next;
      setLiveDrag({ id: zone.id, ...next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLiveDrag(null);
      if (moved) onCommitMove(zone.id, finalPos.x, finalPos.y);
      else onEdit(zone);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizePointerDown = (event, zone) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { w: zone.w, h: zone.h };
    let finalSize = original;

    const onMove = (moveEvent) => {
      const dw = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dh = ((moveEvent.clientY - startY) / rect.height) * 100;
      const next = {
        w: clamp(Math.round(original.w + dw), 10, 100 - zone.x),
        h: clamp(Math.round(original.h + dh), 10, 100 - zone.y),
      };
      finalSize = next;
      setLiveResize({ id: zone.id, ...next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLiveResize(null);
      if (finalSize !== original) onCommitResize(zone.id, finalSize.w, finalSize.h);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={canvasRef}
      className="board-canvas relative w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-950"
      style={{ aspectRatio: '16 / 9' }}
    >
      {zones.map((zone, idx) => {
        const pos = effective(zone);
        return (
          <BlueprintZone
            key={zone.id}
            zone={zone}
            order={idx + 1}
            isFirst={idx === 0}
            isLast={idx === zones.length - 1}
            puzzleCount={puzzleCountFor(zone.id)}
            x={pos.x}
            y={pos.y}
            w={pos.w}
            h={pos.h}
            onPointerDown={(event) => handlePointerDown(event, zone)}
            onResizePointerDown={(event) => handleResizePointerDown(event, zone)}
            onEdit={() => onEdit(zone)}
            onOpenInterior={() => onOpenInterior(zone)}
            onDelete={() => onDelete(zone)}
            onMoveUp={() => onMoveZone(zone.id, 'up')}
            onMoveDown={() => onMoveZone(zone.id, 'down')}
          />
        );
      })}
    </div>
  );
}
