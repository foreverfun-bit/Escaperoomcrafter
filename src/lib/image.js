const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.78;

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read image: ${file.name}`));
    };
    img.src = objectUrl;
  });
}

// Reads a FileList/array of File objects, downscales and compresses each to
// a JPEG data URL so photos stay small enough for localStorage.
export async function filesToPhotos(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
  const photos = [];
  for (const file of files) {
    try {
      const dataUrl = await fileToDataUrl(file);
      photos.push({ id: makeId(), dataUrl });
    } catch (err) {
      console.error(err);
    }
  }
  return photos;
}
