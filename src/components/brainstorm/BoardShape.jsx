const SHAPE_RADIUS = {
  rectangle: 'rounded-none',
  rounded: 'rounded-2xl',
  ellipse: 'rounded-full',
  diamond: 'rounded-none board-shape-diamond',
};

export default function BoardShape({ shapeKind, color, children }) {
  const radiusClass = SHAPE_RADIUS[shapeKind] || SHAPE_RADIUS.rounded;
  const isDiamond = shapeKind === 'diamond';
  return (
    <div
      className={`flex h-full w-full items-center justify-center border-2 border-stone-900/40 shadow-lg ${radiusClass}`}
      style={{ background: color, padding: isDiamond ? '24%' : '14%' }}
    >
      {children}
    </div>
  );
}
