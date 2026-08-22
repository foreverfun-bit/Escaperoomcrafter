import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Portalled to <body> for the same reason Modal is: a "fixed, full-viewport"
// overlay rendered inside an ancestor with backdrop-blur (e.g. the app
// header) ends up trapped inside that ancestor's box instead of the
// viewport, since backdrop-filter creates a containing block for fixed
// descendants.
export default function Lightbox({ src, onClose }) {
  if (!src) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
      >
        <X size={18} />
      </button>
    </div>,
    document.body,
  );
}
