import { useEffect, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { TextField, TextArea } from './ui/Field.jsx';
import MultiSelect from './ui/MultiSelect.jsx';
import { ZONE_PALETTE } from '../store/constants.js';

const BLANK = { name: '', description: '', puzzleIds: [], notes: '', color: ZONE_PALETTE[0] };

export default function ZoneFormModal({ open, onClose, onSubmit, initial, puzzles, defaultColor }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    if (isEdit) setForm({ ...BLANK, ...initial });
    else setForm({ ...BLANK, color: defaultColor || ZONE_PALETTE[0] });
  }, [open, initial, isEdit, defaultColor]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit zone' : 'New zone'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Save changes' : 'Add zone'}</Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <TextField
          label="Zone name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Entry hallway, Library, Final vault"
          autoFocus
        />
        <TextArea label="Description" value={form.description} onChange={set('description')} />
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-400">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {ZONE_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color }))}
                aria-label={`Set color ${color}`}
                className={`h-7 w-7 rounded-full border-2 ${form.color === color ? 'border-pink-400' : 'border-stone-700'}`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
        <MultiSelect
          label="Puzzles in this zone"
          options={puzzles.map((p) => ({ value: p.id, label: p.name }))}
          selected={form.puzzleIds}
          onChange={(puzzleIds) => setForm((f) => ({ ...f, puzzleIds }))}
          emptyText="No puzzles yet."
        />
        <TextArea label="Notes" value={form.notes} onChange={set('notes')} />
      </form>
    </Modal>
  );
}
