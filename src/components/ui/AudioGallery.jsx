import { useRef, useState } from 'react';
import { Music, Trash2 } from 'lucide-react';
import { uploadAudioClips, deleteAudioClip } from '../../lib/audio.js';
import { useAuth } from '../../store/AuthContext.jsx';

export default function AudioGallery({ clips, onAdd, onRemove, label = 'Audio clips', emptyText = 'No audio clips yet.' }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    const { clips: newClips, errors: newErrors } = await uploadAudioClips(files, user.id);
    setBusy(false);
    setErrors(newErrors);
    if (newClips.length) onAdd(newClips);
  };

  const handleRemove = (clip) => {
    onRemove(clip.id);
    deleteAudioClip(clip.path);
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
          <Music size={13} />
          {busy ? 'Uploading…' : 'Add audio'}
        </button>
        <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {errors.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {errors.map((err, i) => (
            <li key={i} className="text-xs text-rose-400">
              {err}
            </li>
          ))}
        </ul>
      )}

      {clips.length === 0 ? (
        <p className="mt-1.5 text-xs text-stone-600">{emptyText}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-xs text-stone-400">{clip.name}</p>
                <audio controls src={clip.url} className="h-8 w-full" />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(clip)}
                title="Remove audio clip"
                className="shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-stone-800 hover:text-rose-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
