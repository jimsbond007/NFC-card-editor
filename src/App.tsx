import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import { RefreshCw } from 'lucide-react';

export default function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1. Fetch current session status immediately on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    // 2. Listen closely for real-time authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show a clean loading screen while evaluating session tokens
  if (initializing) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-tech-orange" size={28} />
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Checking Authentication Status...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* If session exists, forward them to workspace, else show Login */}
        <Route 
          path="/" 
          element={session ? <Navigate to="/student" replace /> : <Login />} 
        />

        {/* Guarded Student Route: If token is empty, instantly reject back to root Login */}
        <Route 
          path="/student" 
          element={session ? <StudentDashboard /> : <Navigate to="/" replace />} 
        />

        {/* Fallback Catch-all Rule */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}