import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { filesToPhotos } from '../../lib/image.js';
import Lightbox from './Lightbox.jsx';

export default function PhotoGallery({ photos, onAdd, onRemove, label = 'Photos', emptyText = 'No photos yet.' }) {
  const inputRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    const newPhotos = await filesToPhotos(files);
    setBusy(false);
    if (newPhotos.length) onAdd(newPhotos);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-stone-400">{label}</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-medium text-pink-300 hover:underline disabled:opacity-50"
        >
          <ImagePlus size={13} />
          {busy ? 'Adding…' : 'Add photos'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {photos.length === 0 ? (
        <p className="mt-1.5 text-xs text-stone-600">{emptyText}</p>
      ) : (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-stone-800 bg-stone-950"
            >
              <img
                src={photo.dataUrl}
                alt=""
                className="h-full w-full cursor-pointer object-cover"
                onClick={() => setLightbox(photo.dataUrl)}
              />
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                title="Remove photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
