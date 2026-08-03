import { useEffect, useRef } from 'react';

// A contenteditable div kept loosely in sync with `value`. We never let React
// re-render its children (contenteditable fights React's reconciliation), so
// the DOM is only touched here when the value changes from *outside* (i.e.
// not while this element itself has focus and the user is typing into it).
export default function EditableText({
  value,
  onChange,
  onCommit,
  placeholder,
  className = '',
  style,
  onPointerDown,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (document.activeElement === node) return;
    if (node.textContent !== (value || '')) node.textContent = value || '';
  }, [value]);

  return (
    <div
      ref={ref}
      className={`editable-text ${className}`.trim()}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onPointerDown={onPointerDown}
      onInput={(event) => onChange(event.currentTarget.textContent)}
      onBlur={onCommit}
    />
  );
}
