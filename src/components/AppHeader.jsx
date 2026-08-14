import { Link } from 'react-router-dom';
import { KeyRound, DatabaseBackup, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../store/AuthContext.jsx';
import Button from './ui/Button.jsx';
import BackupModal from './BackupModal.jsx';

export default function AppHeader() {
  const [backupOpen, setBackupOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/rooms" className="flex items-center gap-2 text-stone-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-400/15 text-pink-300">
            <KeyRound size={18} />
          </span>
          <span className="text-sm font-semibold tracking-wide">Escape Room Crafter</span>
        </Link>
        <div className="flex items-center gap-1">
          {user?.email && (
            <span className="mr-1 hidden text-xs text-stone-500 sm:inline">{user.email}</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setBackupOpen(true)}>
            <DatabaseBackup size={14} />
            Backup
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
            <LogOut size={14} />
          </Button>
        </div>
      </div>
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </header>
  );
}
