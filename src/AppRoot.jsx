import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './store/AuthContext.jsx';
import { RoomsProvider } from './store/RoomsContext.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import SharedRoom from './pages/SharedRoom.jsx';
import App from './App.jsx';

// A shared-room link has to work for someone who isn't signed in at all, so
// it's routed here - before the auth gate below - rather than as a route
// inside the authenticated App. Everything else still requires a session.
function AuthGate() {
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

export default function AppRoot() {
  return (
    <Routes>
      <Route path="/share/:roomId" element={<SharedRoom />} />
      <Route path="*" element={<AuthGate />} />
    </Routes>
  );
}
