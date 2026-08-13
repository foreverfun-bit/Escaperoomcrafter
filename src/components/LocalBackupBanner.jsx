import { useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import { useRooms } from '../store/RoomsContext.jsx';
import Button from './ui/Button.jsx';

export default function LocalBackupBanner() {
  const { localBackupAvailable, importLocalBackupToCloud, dismissLocalBackup } = useRooms();
  const [busy, setBusy] = useState(false);

  if (!localBackupAvailable) return null;

  const handleImport = async () => {
    setBusy(true);
    await importLocalBackupToCloud();
    setBusy(false);
  };

  return (
    <div className="border-b border-pink-400/20 bg-pink-400/5 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-stone-300">
          <CloudUpload size={16} className="shrink-0 text-pink-300" />
          <span>Found existing rooms on this device from before cloud sync. Upload them to your account?</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={dismissLocalBackup} disabled={busy}>
            Dismiss
          </Button>
          <Button size="sm" onClick={handleImport} disabled={busy}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : null}
            Upload to cloud
          </Button>
        </div>
      </div>
    </div>
  );
}
