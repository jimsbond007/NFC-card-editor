/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Key, Mail, RefreshCw } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isRegistering) {
        // --- REGISTRATION FLOW ---
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName.trim().toUpperCase(),
            }
          }
        });

        if (signUpError) throw signUpError;

        if (authData?.user) {
          setMessage('Account registered! Please check your email inbox to verify your account before logging in.');
          setIsRegistering(false);
          setFullName('');
          setEmail('');
          setPassword('');
        }
      } else {
        // --- LOGIN FLOW ---
        const { data: loginData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) throw signInError;

        if (loginData?.user) {
          try {
            // 1. Fetch the user profile role cleanly
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', loginData.user.id)
              .maybeSingle();

            if (profileError) {
              console.warn("Profile fetching warning:", profileError.message);
            }

            // 2. Clear out whitespace or fallback gracefully straight to 'student'
            const optimizedRole = (profile?.role || 'student').trim().toLowerCase();

            // 3. Clean SPA Routing Transitions
            if (optimizedRole.includes('admin')) {
              navigate('/admin', { replace: true });
            } else {
              navigate('/student', { replace: true });
            }
          } catch (routingError) {
            console.error("Routing extraction fallback triggered:", routingError);
            // Fail-safe fallback default
            navigate('/student', { replace: true });
          }
        }
      }
    } catch (error: any) {
      setMessage('Authentication failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-orange-600 p-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-neutral-800 tracking-tight uppercase">
            Techsystems NFC Gateway
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isRegistering ? 'Create your institutional credential node' : 'Access your designer profile workspace'}
          </p>
        </div>

        {message && (
          <div className={`p-3 mb-4 rounded-lg text-xs font-bold text-center ${
            message.includes('failed') || message.includes('Error') 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Full Name</label>
              <input 
                required
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-neutral-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm text-neutral-800 tracking-wide uppercase" 
                placeholder="JUAN DELA CRUZ"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">BU Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-neutral-400" size={16} />
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 p-2.5 border rounded-lg bg-neutral-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm" 
                placeholder="username@bicol-u.edu.ph"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 text-neutral-400" size={16} />
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 p-2.5 border rounded-lg bg-neutral-50 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neutral-900 text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition flex justify-center items-center gap-2 text-sm mt-2 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : isRegistering ? (
              <>
                <UserPlus size={16} /> Register Identity Profile
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <hr className="my-6 border-neutral-200" />

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setMessage('');
            }}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition underline underline-offset-4 cursor-pointer"
          >
            {isRegistering 
              ? "Already have an account? Sign In here" 
              : "New user? Register an account workspace here"}
          </button>
        </div>

      </div>
    </div>
  );
}