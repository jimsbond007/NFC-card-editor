/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldAlert, KeyRound, Mail, Loader2, UserPlus, User, Hash } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { loading } = useAuth(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Custom tracking states for registration entities
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');

  const [isSignUp, setIsSignUp] = useState(false); // Mode structural toggle switch
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleIdentityAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // Run Supabase User Creation Strategy with metadata payloads
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'student',
              full_name: fullName.toUpperCase(), // Normalize layout arrays to uppercase
              student_id: studentId,
            },
          },
        });

        if (error) throw error;

        if (data.user && data.session === null) {
          setSuccessMsg('Registration complete! Check your email for verification.');
        } else {
          setSuccessMsg('Account matrix successfully generated! Routing profile...');
          setTimeout(() => navigate('/student', { replace: true }), 1500);
        }
      } else {
        // Run Traditional Authentication Login Strategy
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const userRole = data.user?.user_metadata?.role || 'student';
        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication sequence failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto text-amber-400">
            {isSignUp ? <UserPlus size={24} /> : <KeyRound size={24} />}
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">
            {isSignUp ? 'Register an Account' : 'TECHSYSTEMS NFC GATEWAY'}
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono tracking-wider">
            {isSignUp ? 'NEW ACCOUNT SETUP' : 'ENTER IN YOUR WORKSPACE'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2 font-mono">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs rounded-lg flex items-center gap-2 font-mono">
            <Loader2 size={16} className="shrink-0 animate-spin" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleIdentityAuth} className="space-y-4">
          
          {/* Conditional registration inputs rendering sequence */}
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-neutral-400 font-mono">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition" 
                    placeholder="JUAN DELA CRUZ"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-neutral-400 font-mono">Student ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
                  <input 
                    type="text" 
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition" 
                    placeholder="0000-00-000000"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-black text-neutral-400 font-mono">BU Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition" 
                placeholder="student@bicol-u.edu.ph"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-black text-neutral-400 font-mono">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={authLoading || loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2.5 rounded-lg text-xs transition uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isSignUp ? (
              'Register Account'
            ) : (
              'Log-in'
            )}
          </button>
        </form>

        <div className="border-t border-neutral-900 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFullName('');
              setStudentId('');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-[11px] font-mono uppercase tracking-wider text-amber-500/80 hover:text-amber-400 transition cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Go To Login' : 'New TSA NFC user? Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}