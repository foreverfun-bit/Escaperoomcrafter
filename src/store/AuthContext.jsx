import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebaseClient.js';

const AuthContext = createContext(null);

const FRIENDLY_ERRORS = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
};

function friendlyError(error) {
  return FRIENDLY_ERRORS[error.code] || error.message;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = not checked yet, null = signed out
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ? { ...fbUser, id: fbUser.uid } : null);
    });
    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email, password) => {
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      setAuthError(friendlyError(error));
      return false;
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      setAuthError(friendlyError(error));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      session: user ?? null,
      user: user ?? null,
      loading: user === undefined,
      authError,
      clearAuthError: () => setAuthError(''),
      signUp,
      signIn,
      signOut,
    }),
    [user, authError, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
