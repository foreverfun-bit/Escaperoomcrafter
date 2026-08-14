import { Loader2 } from 'lucide-react';
import { useAuth } from './store/AuthContext.jsx';
import { RoomsProvider } from './store/RoomsContext.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import App from './App.jsx';

export default function AppRoot() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 size={22} className="animate-spin text-stone-600" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <RoomsProvider>
      <App />
    </RoomsProvider>
  );
}
