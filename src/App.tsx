/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

// 1. Create a global Auth Context window
const AuthContext = createContext<{ user: any; role: string | null; loading: boolean; logout: () => Promise<void> }>({
  user: null, role: null, loading: true, logout: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setRole(null);
        return;
      }

      setUser(authUser);

      // Grab confirmed role column matching up with the login query
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      setRole(profile?.role ? profile.role.trim().toLowerCase() : 'student');
    } catch (err) {
      console.error("Session verification failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();

    // Listen globally for sign-outs or token changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // Load the profile parameters ahead of completing the verification loader
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setRole(profile?.role ? profile.role.trim().toLowerCase() : 'student');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 2. Standardized Protected Route Guard Wrapper Component
function ProtectedRoute({ children, allowedRoles }: { children: React.JSX.Element; allowedRoles: string[] }) {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Verifying Gateway State...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Root Route */}
          <Route path="/" element={<Login />} />

          {/* Secure Workspace Node Access Points wrapped cleanly as explicitly mounted child elements */}
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Global Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export const useAuth = () => useContext(AuthContext);