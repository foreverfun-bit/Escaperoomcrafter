import { useId } from 'react';

const baseInput =
  'w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 outline-none transition-colors focus:border-pink-400 focus:ring-1 focus:ring-pink-400';

function Label({ label, required }) {
  if (!label) return null;
  return (
    <label className="mb-1 block text-xs font-medium text-stone-400">
      {label}
      {required && <span className="text-rose-400"> *</span>}
    </label>
  );
}

export function TextField({ label, required, className = '', ...props }) {
  return (
    <div className={className}>
      <Label label={label} required={required} />
      <input className={baseInput} {...props} />
    </div>
  );
}

export function TextArea({ label, required, className = '', rows = 3, ...props }) {
  return (
    <div className={className}>
      <Label label={label} required={required} />
      <textarea className={baseInput} rows={rows} {...props} />
    </div>
  );
}

export function Select({ label, required, options, className = '', ...props }) {
  return (
    <div className={className}>
      <Label label={label} required={required} />
      <select className={`${baseInput} appearance-none`} {...props}>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// A text field with a dropdown of suggestions, but - unlike Select - never
// rejects a value that isn't one of them, so a field like puzzle type can
// suggest the common options while still taking any custom one typed in.
export function ComboField({ label, required, options, className = '', ...props }) {
  const listId = useId();
  return (
    <div className={className}>
      <Label label={label} required={required} />
      <input className={baseInput} list={listId} {...props} />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}
