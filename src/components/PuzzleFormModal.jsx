import { useEffect, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { TextField, TextArea, Select } from './ui/Field.jsx';
import MultiSelect from './ui/MultiSelect.jsx';
import HintsEditor from './HintsEditor.jsx';
import AudioGallery from './ui/AudioGallery.jsx';
import PhotoGallery from './ui/PhotoGallery.jsx';
import { PUZZLE_TYPES, PUZZLE_STATUSES } from '../store/constants.js';

const BLANK = {
  name: '',
  description: '',
  type: 'Logic',
  status: 'Idea',
  zoneId: '',
  solution: '',
  hints: [],
  audioClips: [],
  photos: [],
  dependsOn: [],
  notes: '',
};

export default function PuzzleFormModal({ open, onClose, onSubmit, initial, zones, otherPuzzles, props = [] }) {
  const [form, setForm] = useState(BLANK);
  // Which props this puzzle is used with is actually stored on the prop
  // (prop.puzzleIds), the same field the Props tab's "Used in puzzles"
  // field edits - this just lets the puzzle form edit that same
  // relationship from the other side, so it's kept separate from `form`
  // and diffed against props on submit rather than saved onto the puzzle.
  const [linkedPropIds, setLinkedPropIds] = useState([]);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...BLANK, ...initial } : BLANK);
      setLinkedPropIds(initial ? props.filter((pr) => pr.puzzleIds.includes(initial.id)).map((pr) => pr.id) : []);
    }
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(
      {
        ...form,
        zoneId: form.zoneId || null,
        hints: form.hints.filter((h) => h.trim() !== ''),
      },
      linkedPropIds,
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={initial ? 'Edit puzzle' : 'New puzzle'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initial ? 'Save changes' : 'Add puzzle'}</Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <TextField label="Puzzle name" required value={form.name} onChange={set('name')} autoFocus />
        <TextArea
          label="Description"
          value={form.description}
          onChange={set('description')}
          placeholder="What does the player see / interact with?"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" options={PUZZLE_TYPES} value={form.type} onChange={set('type')} />
          <Select label="Status" options={PUZZLE_STATUSES} value={form.status} onChange={set('status')} />
        </div>
        <Select
          label="Room zone"
          value={form.zoneId || ''}
          onChange={set('zoneId')}
          options={[{ value: '', label: 'Not assigned yet' }, ...zones.map((z) => ({ value: z.id, label: z.name }))]}
        />
        <TextArea label="Solution" value={form.solution} onChange={set('solution')} />
        <HintsEditor hints={form.hints} onChange={(hints) => setForm((f) => ({ ...f, hints }))} />
        <AudioGallery
          clips={form.audioClips}
          onAdd={(newClips) => setForm((f) => ({ ...f, audioClips: [...f.audioClips, ...newClips] }))}
          onRemove={(id) => setForm((f) => ({ ...f, audioClips: f.audioClips.filter((c) => c.id !== id) }))}
          emptyText="No audio clues or voice hints yet."
        />
        <PhotoGallery
          photos={form.photos}
          onAdd={(newPhotos) => setForm((f) => ({ ...f, photos: [...f.photos, ...newPhotos] }))}
          onRemove={(id) => setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.id !== id) }))}
          emptyText="No reference photos yet."
        />
        <MultiSelect
          label="Props used in this puzzle"
          options={props.map((pr) => ({ value: pr.id, label: pr.name }))}
          selected={linkedPropIds}
          onChange={setLinkedPropIds}
          emptyText="No props yet — add some on the Props tab."
        />
        <MultiSelect
          label="Depends on (must be solved first)"
          options={otherPuzzles.map((p) => ({ value: p.id, label: p.name }))}
          selected={form.dependsOn}
          onChange={(dependsOn) => setForm((f) => ({ ...f, dependsOn }))}
          emptyText="No other puzzles yet — add more puzzles to chain them together."
        />
        <TextArea label="Notes" value={form.notes} onChange={set('notes')} />
      </form>
    </Modal>
  );
}
