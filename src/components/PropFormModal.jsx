import { useEffect, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { TextField, TextArea, Select } from './ui/Field.jsx';
import MultiSelect from './ui/MultiSelect.jsx';
import PhotoGallery from './ui/PhotoGallery.jsx';
import { PROP_CATEGORIES, SOURCING_STATUSES } from '../store/constants.js';

const BLANK = {
  name: '',
  category: 'Prop',
  quantity: 1,
  sourcingStatus: 'Need to source',
  cost: 0,
  source: '',
  puzzleIds: [],
  notes: '',
  photos: [],
  zoneId: '',
};

export default function PropFormModal({ open, onClose, onSubmit, initial, puzzles, zones = [] }) {
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (open) setForm(initial ? { ...BLANK, ...initial, zoneId: initial.zoneId || '' } : BLANK);
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const zoneId = form.zoneId || null;
    const previousZoneId = initial?.zoneId || null;
    const payload = {
      ...form,
      zoneId,
      quantity: Number(form.quantity) || 1,
      cost: Number(form.cost) || 0,
    };
    if (!zoneId) {
      payload.x = null;
      payload.y = null;
      payload.w = null;
      payload.h = null;
    } else if (zoneId !== previousZoneId || form.x == null) {
      // Newly placed in this zone (or switching zones) - drop it at a
      // default spot; it can be dragged into place from the interior view.
      payload.x = 10;
      payload.y = 10;
      payload.w = 20;
      payload.h = 16;
    }
    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit prop' : 'New prop'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initial ? 'Save changes' : 'Add prop'}</Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <TextField label="Name" required value={form.name} onChange={set('name')} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" options={PROP_CATEGORIES} value={form.category} onChange={set('category')} />
          <TextField label="Quantity" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Sourcing status"
            options={SOURCING_STATUSES}
            value={form.sourcingStatus}
            onChange={set('sourcingStatus')}
          />
          <TextField
            label="Cost per unit ($)"
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={set('cost')}
          />
        </div>
        <TextField
          label="Source / where to get it"
          value={form.source}
          onChange={set('source')}
          placeholder="Store, link, or 'build in-house'"
        />
        <Select
          label="Zone"
          options={[{ value: '', label: 'Unassigned' }, ...zones.map((z) => ({ value: z.id, label: z.name }))]}
          value={form.zoneId}
          onChange={set('zoneId')}
        />
        <MultiSelect
          label="Used in puzzles"
          options={puzzles.map((p) => ({ value: p.id, label: p.name }))}
          selected={form.puzzleIds}
          onChange={(puzzleIds) => setForm((f) => ({ ...f, puzzleIds }))}
          emptyText="No puzzles yet."
        />
        <TextArea label="Notes" value={form.notes} onChange={set('notes')} />
        <PhotoGallery
          photos={form.photos}
          onAdd={(newPhotos) => setForm((f) => ({ ...f, photos: [...f.photos, ...newPhotos] }))}
          onRemove={(id) => setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.id !== id) }))}
          emptyText="No photos of this prop yet."
        />
      </form>
    </Modal>
  );
}
