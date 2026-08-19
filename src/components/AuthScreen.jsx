import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { TextField } from './ui/Field.jsx';
import Button from './ui/Button.jsx';

export default function AuthScreen() {
  const { signIn, signUp, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    clearAuthError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    if (mode === 'sign-up') await signUp(email.trim(), password);
    else await signIn(email.trim(), password);
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-400/10">
            <Lock size={22} className="text-pink-300" />
          </div>
          <h1 className="text-lg font-semibold text-stone-100">Escape Room Crafter</h1>
          <p className="mt-1 text-sm text-stone-500">
            Sign in to sync your rooms across every device you use.
          </p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <div className="mb-4 flex rounded-lg bg-stone-950 p-1 text-sm">
            <button
              type="button"
              onClick={() => switchMode('sign-in')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                mode === 'sign-in' ? 'bg-stone-800 text-stone-100' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('sign-up')}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                mode === 'sign-up' ? 'bg-stone-800 text-stone-100' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Create account
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'sign-up' ? 'At least 6 characters' : '••••••••'}
            />
            {authError && <p className="text-xs text-rose-400">{authError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-stone-600">
          Your data is private to your account and only visible to you.
        </p>
      </div>
    </div>
  );
}
